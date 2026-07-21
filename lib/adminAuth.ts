import crypto from "crypto";
import bcrypt from "bcryptjs";
import { hasPermission } from "@/data/adminRoles";
import type { AdminRole, AdminSession, Permission } from "@/types/domain";
import type { IncomingMessage, ServerResponse } from "http";

const COOKIE_NAME = "dis_admin_session";
// Hard cap regardless of activity — forces a fresh login at least this
// often even if the admin never goes idle.
const SESSION_ABSOLUTE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
// "Session timeout" per the spec — the sliding window that actually logs an
// idle admin out. Refreshed on every authenticated request via
// requireAdminApi/requireAdminPage below.
const SESSION_IDLE_TTL_MS = 1000 * 60 * 30; // 30 minutes

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Add it to .env.local before using admin login."
    );
  }
  return secret;
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_EMAIL &&
      process.env.ADMIN_PASSWORD_HASH &&
      process.env.SESSION_SECRET
  );
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function verifySignature(payload: string, signature: string): boolean {
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

function buildSessionCookie({ email, role, issuedAt, lastActivity }: AdminSession): string {
  const payload = Buffer.from(JSON.stringify({ email, role, issuedAt, lastActivity })).toString(
    "base64url"
  );
  const token = `${payload}.${sign(payload)}`;
  const isProd = process.env.NODE_ENV === "production";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${
    SESSION_ABSOLUTE_TTL_MS / 1000
  }${isProd ? "; Secure" : ""}`;
}

// Issued at login — starts both the absolute clock and the idle clock.
export function createSessionCookie(email: string, role: AdminRole): string {
  const now = Date.now();
  return buildSessionCookie({ email, role, issuedAt: now, lastActivity: now });
}

// Re-issued on every authenticated request — slides the idle window
// forward without resetting the absolute 12h clock, so a continuously
// active admin stays signed in, but one who is genuinely idle for
// SESSION_IDLE_TTL_MS is logged out, and even an active admin is forced to
// re-authenticate once the absolute cap is reached.
function touchSessionCookie(session: AdminSession): string {
  return buildSessionCookie({ ...session, lastActivity: Date.now() });
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function parseCookies(header: string | undefined | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    cookies[pair.slice(0, idx).trim()] = decodeURIComponent(
      pair.slice(idx + 1).trim()
    );
  });
  return cookies;
}

type AnyReq = IncomingMessage & { headers: Record<string, string | string[] | undefined> };

// Works with both API route `req` objects and getServerSideProps' `req`.
// Returns null for a missing/invalid/tampered cookie, an absolute-expired
// session, or an idle-timed-out session — callers can't tell which, by
// design (same as the old code never distinguishing "bad" from "expired").
export function getAdminSession(req: AnyReq): AdminSession | null {
  if (!process.env.SESSION_SECRET) return null;
  const cookieHeader = req.headers?.cookie;
  const cookies = parseCookies(Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!verifySignature(payload, signature)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (!data.email || !data.issuedAt || !data.lastActivity) return null;
    const now = Date.now();
    if (now - data.issuedAt > SESSION_ABSOLUTE_TTL_MS) return null;
    if (now - data.lastActivity > SESSION_IDLE_TTL_MS) return null;
    return { email: data.email, role: data.role || "ADMIN", issuedAt: data.issuedAt, lastActivity: data.lastActivity };
  } catch {
    return null;
  }
}

export function getClientIp(req: AnyReq): string | null {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return (req.socket as { remoteAddress?: string } | undefined)?.remoteAddress || null;
}

export interface VerifyCredentialsResult {
  ok: boolean;
  role?: AdminRole;
  source?: "db" | "env";
}

// Checks the real multi-user AdminUser table first; falls back to the
// single ADMIN_EMAIL/ADMIN_PASSWORD_HASH env-var account (always treated as
// Super Admin) only when no active DB user matches that email — a
// break-glass path so a fresh deployment (or a DB outage) never locks
// everyone out, while day-to-day accounts/roles live in the database.
export async function verifyAdminCredentials(email: string, password: string): Promise<VerifyCredentialsResult> {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !password) return { ok: false };

  try {
    const { findAdminUserByEmail, markAdminUserLoggedIn } = await import(
      "@/services/db/adminUsers"
    );
    const user = await findAdminUserByEmail(normalizedEmail);
    if (user && user.active) {
      const matches = await bcrypt.compare(password, user.passwordHash);
      if (matches) {
        await markAdminUserLoggedIn(user.id);
        return { ok: true, role: user.role as AdminRole, source: "db" };
      }
      return { ok: false };
    }
  } catch {
    // DB unreachable — fall through to the env-var break-glass account.
  }

  if (
    isAdminAuthConfigured() &&
    normalizedEmail === (process.env.ADMIN_EMAIL as string).trim().toLowerCase() &&
    (await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH as string))
  ) {
    return { ok: true, role: "SUPER_ADMIN", source: "env" };
  }

  return { ok: false };
}

async function logDenied(req: AnyReq, session: AdminSession | null, permission: Permission | undefined): Promise<void> {
  try {
    const { logAdminActivity } = await import("@/services/db/adminActivity");
    await logAdminActivity(
      session?.email || "unknown",
      "permission_denied",
      permission ? `Blocked from action requiring "${permission}".` : "Blocked: no session.",
      getClientIp(req)
    );
  } catch {
    // Never let audit logging break the request it's guarding.
  }
}

type AnyRes = ServerResponse & {
  status: (code: number) => AnyRes;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

// For API routes: verifies the session (and, if given, that its role has
// `permission`), writes 401/403 on failure, and refreshes the idle window
// on success. Returns the session (truthy) so callers can `if (!session) return;`.
export async function requireAdminApi(
  req: AnyReq,
  res: AnyRes,
  permission?: Permission
): Promise<AdminSession | null> {
  const session = getAdminSession(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  if (permission && !hasPermission(session.role, permission)) {
    await logDenied(req, session, permission);
    res.status(403).json({ error: "Your role does not have permission to do this." });
    return null;
  }
  res.setHeader("Set-Cookie", touchSessionCookie(session));
  return session;
}

export type RequireAdminPageResult =
  | { redirect: { destination: string; permanent: boolean } }
  | { session: AdminSession };

// For getServerSideProps: same checks as requireAdminApi, but returns
// Next.js's { redirect } / { session } shape instead of writing to res
// directly (the cookie refresh still goes through res.setHeader, since
// getServerSideProps receives the real response object).
export async function requireAdminPage(
  req: AnyReq,
  res: AnyRes,
  permission?: Permission
): Promise<RequireAdminPageResult> {
  const session = getAdminSession(req);
  if (!session) {
    return { redirect: { destination: "/admin/login", permanent: false } };
  }
  if (permission && !hasPermission(session.role, permission)) {
    await logDenied(req, session, permission);
    return { redirect: { destination: "/admin/dashboard", permanent: false } };
  }
  res.setHeader("Set-Cookie", touchSessionCookie(session));
  return { session };
}

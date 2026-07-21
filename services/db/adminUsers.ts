import bcrypt from "bcryptjs";
import { prisma, isDbConfigured } from "@/lib/db";
import { ADMIN_ROLES } from "@/data/adminRoles";
import type { AdminUser } from "@/lib/generated/prisma/client";
import type { AdminRole, PlainAdminUser } from "@/types/domain";

function toPlain(row: AdminUser): PlainAdminUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as AdminRole,
    active: row.active,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
  };
}

export async function fetchAdminUsers(): Promise<PlainAdminUser[]> {
  if (!isDbConfigured()) return [];
  const rows = await prisma!.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(toPlain);
}

export async function findAdminUserByEmail(email: string): Promise<AdminUser | null> {
  if (!isDbConfigured()) return null;
  const row = await prisma!.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  return row;
}

export interface CreateAdminUserInput {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
}

export async function createAdminUser({ name, email, password, role }: CreateAdminUserInput): Promise<PlainAdminUser> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  if (!ADMIN_ROLES.includes(role)) throw new Error("Invalid role.");
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const row = await prisma!.adminUser.create({
    data: {
      name,
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
      active: true,
    },
  });
  return toPlain(row);
}

export interface UpdateAdminUserInput {
  name?: string;
  role?: AdminRole;
  active?: boolean;
  password?: string;
}

export async function updateAdminUser(id: string, patch: UpdateAdminUserInput): Promise<PlainAdminUser> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  const data: Record<string, unknown> = {};
  if ("name" in patch) data.name = patch.name;
  if ("role" in patch && patch.role) {
    if (!ADMIN_ROLES.includes(patch.role)) throw new Error("Invalid role.");
    data.role = patch.role;
  }
  if ("active" in patch) data.active = Boolean(patch.active);
  if (patch.password) {
    if (patch.password.length < 8) throw new Error("Password must be at least 8 characters.");
    data.passwordHash = await bcrypt.hash(patch.password, 10);
  }
  const row = await prisma!.adminUser.update({ where: { id }, data });
  return toPlain(row);
}

export async function deleteAdminUser(id: string): Promise<true> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  await prisma!.adminUser.delete({ where: { id } });
  return true;
}

export async function markAdminUserLoggedIn(id: string): Promise<void> {
  if (!isDbConfigured()) return;
  await prisma!.adminUser.update({ where: { id }, data: { lastLoginAt: new Date() } });
}

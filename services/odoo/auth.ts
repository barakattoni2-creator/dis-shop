import { isOdooConfigured } from "./config";
import { executeKw } from "./client";

export interface OdooCustomer {
  id: string | number;
  name: string;
  email: string;
}

// In mock mode (no Odoo configured) these simulate an account locally.
// A real deployment should route both calls through a server-side API
// endpoint so ODOO_API_KEY is never sent to the browser.
export async function loginCustomer({ email, password }: { email: string; password: string }): Promise<OdooCustomer> {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }
  if (!isOdooConfigured()) {
    return { id: email, name: email.split("@")[0], email };
  }
  const [partner] = (await executeKw(
    "res.partner",
    "search_read",
    [[["email", "=", email]]],
    { fields: ["name", "email"], limit: 1 }
  )) as Array<{ id: number; name: string; email: string }>;
  if (!partner) throw new Error("No account found for this email.");
  return { id: partner.id, name: partner.name, email: partner.email };
}

export async function registerCustomer({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}): Promise<OdooCustomer> {
  if (!name || !email || !password) {
    throw new Error("All fields are required.");
  }
  if (!isOdooConfigured()) {
    return { id: email, name, email };
  }
  const id = (await executeKw("res.partner", "create", [[{ name, email }]])) as number;
  return { id, name, email };
}

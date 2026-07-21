import { prisma, isDbConfigured } from "@/lib/db";
import type { Customer } from "@/lib/generated/prisma/client";
import type { PlainCustomer } from "@/types/domain";

type CustomerWithCount = Customer & { _count?: { orders: number } };

function toPlain(row: CustomerWithCount): PlainCustomer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    orderCount: row._count?.orders ?? 0,
    createdAt: row.createdAt,
  };
}

export async function fetchCustomers(): Promise<PlainCustomer[]> {
  if (!isDbConfigured()) return [];
  const rows = await prisma!.customer.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toPlain);
}

export interface CustomerInput {
  name: string;
  email: string;
  phone?: string | null;
}

export async function upsertCustomer({ name, email, phone }: CustomerInput): Promise<Customer | null> {
  if (!isDbConfigured() || !email) return null;
  const row = await prisma!.customer.upsert({
    where: { email },
    update: { name, phone },
    create: { name, email, phone },
  });
  return row;
}

export async function createCustomer({ name, email, phone }: CustomerInput): Promise<PlainCustomer> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  const row = await prisma!.customer.create({
    data: { name, email, phone: phone || null },
    include: { _count: { select: { orders: true } } },
  });
  return toPlain(row);
}

export async function updateCustomer(id: string, patch: Partial<CustomerInput>): Promise<PlainCustomer> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  const data: Partial<CustomerInput> = {};
  for (const field of ["name", "email", "phone"] as const) {
    if (field in patch) data[field] = patch[field];
  }
  const row = await prisma!.customer.update({
    where: { id },
    data,
    include: { _count: { select: { orders: true } } },
  });
  return toPlain(row);
}

export async function deleteCustomer(id: string): Promise<true> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  await prisma!.customer.delete({ where: { id } });
  return true;
}

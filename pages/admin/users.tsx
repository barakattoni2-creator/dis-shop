import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AdminLayout from "@/features/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { ADMIN_ROLES, ROLE_LABELS, PERMISSIONS, type AdminRole } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";

interface AdminUsersPageProps {
  email: string;
  role: AdminRole;
  dbConfigured: boolean;
}

export const getServerSideProps: GetServerSideProps<AdminUsersPageProps> = async ({ req, res }) => {
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.MANAGE_USERS);
  if ("redirect" in guard) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
};

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  lastLoginAt: string | null;
}

function emptyForm() {
  return { name: "", email: "", password: "", role: "SALES" as AdminRole };
}

function UsersPanel({ currentEmail, dbConfigured }: { currentEmail: string; dbConfigured: boolean }) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(dbConfigured);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (dbConfigured) reload();
  }, [dbConfigured]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    toast.success("Admin user created.");
    setShowForm(false);
    setForm(emptyForm());
    reload();
  };

  const patchUser = async (user: AdminUserRow, patch: Partial<AdminUserRow>) => {
    setError("");
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    reload();
  };

  const handleDelete = async (user: AdminUserRow) => {
    if (!window.confirm(`Remove admin account "${user.email}"?`)) return;
    setError("");
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    toast.success("Admin user removed.");
    reload();
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base">Admin Users</CardTitle>
          <CardDescription>
            Accounts and roles for /admin access. Roles: Super Admin, Admin, Sales, Warehouse, Delivery.
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} disabled={!dbConfigured}>
          <Plus className="size-4" /> Add Admin User
        </Button>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-3 text-sm font-medium text-destructive">{error}</p>}

        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : users.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No admin users yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-40" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Select value={u.role} onValueChange={(v) => patchUser(u, { role: v as AdminRole })}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ADMIN_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.active ? "success" : "secondary"}>{u.active ? "Active" : "Disabled"}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => patchUser(u, { active: !u.active })}
                        disabled={u.email === currentEmail}
                      >
                        {u.active ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(u)}
                        disabled={u.email === currentEmail}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u-name">Name</Label>
              <Input id="u-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-email">Email</Label>
              <Input
                id="u-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-password">Temporary Password (min 8 characters)</Label>
              <Input
                id="u-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as AdminRole }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Creating…" : "Create Admin User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface ActivityRow {
  id: string;
  actorEmail: string;
  action: string;
  details?: string;
  createdAt: string;
}

function ActivityPanel({ dbConfigured }: { dbConfigured: boolean }) {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 30;
  const [loading, setLoading] = useState(dbConfigured);

  useEffect(() => {
    if (!dbConfigured) return;
    fetch(`/api/admin/activity?page=${page}&pageSize=${pageSize}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.rows || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dbConfigured, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activity Log</CardTitle>
        <CardDescription>
          Sign-ins, sign-outs, denied actions and admin-account changes, most recent first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No activity logged yet.</p>
        ) : (
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                <div>
                  <span className="text-sm font-medium">{r.actorEmail}</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {r.action}
                    {r.details ? ` — ${r.details}` : ""}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ← Prev
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminUsersPage({ email, role, dbConfigured }: AdminUsersPageProps) {
  return (
    <AdminLayout title="Admin Users" email={email} role={role}>
      <div className="shadcn-root">
        {!dbConfigured && (
          <p className="mb-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            No database connected yet. Set <code>DATABASE_URL</code> in <code>.env.local</code> to manage
            admin accounts.
          </p>
        )}

        <Tabs defaultValue="users">
          <TabsList className="mb-5">
            <TabsTrigger value="users">Admin Users</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <UsersPanel currentEmail={email} dbConfigured={dbConfigured} />
          </TabsContent>
          <TabsContent value="activity">
            <ActivityPanel dbConfigured={dbConfigured} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import AdminLayout from "@/features/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import type { AdminRole } from "@/types/domain";

interface AdminOdooPageProps {
  email: string;
  role: AdminRole;
}

export const getServerSideProps: GetServerSideProps<AdminOdooPageProps> = async ({ req, res }) => {
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.MANAGE_ODOO);
  if ("redirect" in guard) return guard;
  return { props: { email: guard.session.email, role: guard.session.role } };
};

function StatusRow({ label, value, ok }: { label: string; value: React.ReactNode; ok: boolean }) {
  return (
    <div className="flex items-center justify-between border-b py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`flex items-center gap-1.5 font-medium ${ok ? "text-success" : ""}`}>
        {ok ? <CheckCircle2 className="size-4 text-success" /> : <XCircle className="size-4 text-muted-foreground" />}
        {value}
      </span>
    </div>
  );
}

const STEP_LABELS: Record<string, string> = {
  config: "Configuration",
  version: "1. version() — /xmlrpc/2/common",
  authenticate: "2. authenticate() — /xmlrpc/2/common",
  search_count: "3. search_count(product.product) — /xmlrpc/2/object",
};

interface OdooStatus {
  syncEnabled: boolean;
  hasUrl: boolean;
  hostname?: string;
  hasDatabase: boolean;
  database?: string;
  hasUsername: boolean;
  hasApiKey: boolean;
  version?: string;
  configured: boolean;
}

interface TestResult {
  ok: boolean;
  version?: string;
  productCount?: number;
  step?: string;
  error?: string;
}

export default function AdminOdooPage({ email, role }: AdminOdooPageProps) {
  const [status, setStatus] = useState<OdooStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    fetch("/api/admin/odoo/status")
      .then((r) => r.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/admin/odoo/test", { method: "POST" });
    const data = await res.json();
    setTesting(false);
    setTestResult(data);
  };

  return (
    <AdminLayout title="Odoo Integration" email={email} role={role}>
      <div className="shadcn-root max-w-xl space-y-4">
        <p className="text-sm text-muted-foreground">
          Odoo credentials (URL, database, username, API key) are read from server environment
          variables only — they are never sent to the browser, and this page never displays the API
          key itself.
        </p>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          status && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Connection Status</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusRow label="Sync Enabled" value={status.syncEnabled ? "Yes" : "No"} ok={status.syncEnabled} />
                <StatusRow label="URL" value={status.hasUrl ? status.hostname : "Not set"} ok={status.hasUrl} />
                <StatusRow
                  label="Database"
                  value={status.hasDatabase ? status.database : "Not set"}
                  ok={status.hasDatabase}
                />
                <StatusRow label="Username" value={status.hasUsername ? "Set" : "Not set"} ok={status.hasUsername} />
                <StatusRow label="API Key" value={status.hasApiKey ? "Set (hidden)" : "Not set"} ok={status.hasApiKey} />
                {status.version && <StatusRow label="Odoo Version" value={status.version} ok />}
                <p className="mt-3 text-sm text-muted-foreground">
                  {status.configured
                    ? "Odoo sync is active — product and order actions use Odoo instead of the local database."
                    : "Odoo is not active. The storefront and admin dashboard use the local database/catalog instead."}
                </p>
              </CardContent>
            </Card>
          )
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Test Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Makes a real, read-only call to Odoo using the server-side credentials above — works
              even while sync is turned off, so you can verify credentials first.
            </p>
            <Button onClick={handleTest} disabled={testing}>
              {testing ? "Testing…" : "Test Connection"}
            </Button>
            {testResult && (
              <div className="mt-4">
                {testResult.ok ? (
                  <>
                    <p className="mb-2 text-sm font-medium text-success">Connected successfully.</p>
                    <StatusRow label="Odoo Version" value={testResult.version} ok />
                    <StatusRow label="Products Found" value={testResult.productCount ?? 0} ok />
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-destructive">
                      Failed at {STEP_LABELS[testResult.step || ""] || testResult.step}
                    </p>
                    <p className="text-sm text-muted-foreground">{testResult.error}</p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

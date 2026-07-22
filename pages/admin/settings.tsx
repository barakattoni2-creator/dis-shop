import { useEffect, useState } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { toast } from "sonner";
import { Search, Plus, Trash2 } from "lucide-react";
import AdminLayout from "@/features/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { COMPANY_NAME, ADDRESS_LINES, EMAIL, PHONE_NUMBERS, WHATSAPP_NUMBER } from "@/data/contact";
import { SSP_PER_USD } from "@/data/currency";
import type { AdminRole } from "@/types/domain";

interface AdminSettingsPageProps {
  email: string;
  role: AdminRole;
  dbConfigured: boolean;
}

export const getServerSideProps: GetServerSideProps<AdminSettingsPageProps> = async ({ req, res }) => {
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.MANAGE_SETTINGS);
  if ("redirect" in guard) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
};

const COMPANY_FIELDS = [
  { key: "companyName", label: "Company Name", default: COMPANY_NAME, multiline: false },
  { key: "address", label: "Address (one line per row)", default: ADDRESS_LINES.join("\n"), multiline: true },
  { key: "email", label: "Email", default: EMAIL, multiline: false },
  { key: "phone1", label: "Phone 1", default: PHONE_NUMBERS[0]?.tel || "", multiline: false },
  { key: "phone2", label: "Phone 2", default: PHONE_NUMBERS[1]?.tel || "", multiline: false },
  { key: "whatsappNumber", label: "WhatsApp Number (digits only, no +)", default: WHATSAPP_NUMBER, multiline: false },
];

export default function AdminSettingsPage({ email, role, dbConfigured }: AdminSettingsPageProps) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Record<string, string>>(
    Object.fromEntries(COMPANY_FIELDS.map((f) => [f.key, f.default]))
  );
  const [companySaving, setCompanySaving] = useState(false);
  const [exchangeRateInput, setExchangeRateInput] = useState(String(SSP_PER_USD));
  const [exchangeRateSaving, setExchangeRateSaving] = useState(false);
  const [exchangeRateError, setExchangeRateError] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = () => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        const rows = data.settings || {};
        setSettings(rows);
        setCompany((prev) => {
          const next = { ...prev };
          COMPANY_FIELDS.forEach((f) => {
            if (rows[f.key] !== undefined) next[f.key] = rows[f.key];
          });
          return next;
        });
        if (rows.exchangeRate !== undefined) setExchangeRateInput(rows.exchangeRate);
        setLoading(false);
      });
  };

  useEffect(() => {
    reload();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanySaving(true);
    await Promise.all(COMPANY_FIELDS.map((f) => saveSetting(f.key, company[f.key])));
    setCompanySaving(false);
    toast.success("Company information saved.");
    reload();
  };

  const handleExchangeRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExchangeRateError("");
    setExchangeRateSaving(true);
    try {
      const res = await fetch("/api/admin/settings/exchange-rate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: exchangeRateInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save exchange rate.");
      toast.success("Exchange rate saved.");
      reload();
    } catch (err) {
      setExchangeRateError((err as Error).message);
    } finally {
      setExchangeRateSaving(false);
    }
  };

  const deleteSetting = async (key: string) => {
    if (!window.confirm(`Delete setting "${key}"?`)) return;
    await fetch(`/api/admin/settings/${encodeURIComponent(key)}`, { method: "DELETE" });
    toast.success(`Deleted "${key}".`);
    reload();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    setSaving(true);
    await saveSetting(newKey.trim(), newValue);
    setSaving(false);
    setNewKey("");
    setNewValue("");
    toast.success("Setting added.");
    reload();
  };

  const companyKeys = new Set(COMPANY_FIELDS.map((f) => f.key));
  const hiddenKeys = new Set([...companyKeys, "exchangeRate", "exchangeRateUpdatedAt"]);
  const otherSettings = Object.entries(settings).filter(([key]) => !hiddenKeys.has(key));

  const exchangeRateUpdatedAt = settings.exchangeRateUpdatedAt
    ? new Date(settings.exchangeRateUpdatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
    : null;

  return (
    <AdminLayout title="Settings" email={email} role={role}>
      <div className="shadcn-root max-w-3xl">
        <h1 className="mb-4 text-xl font-bold">Settings</h1>

        {!dbConfigured && (
          <p className="mb-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            No database connected yet. Set <code>DATABASE_URL</code> in <code>.env.local</code> to store
            settings. The storefront uses the built-in defaults from the codebase until then.
          </p>
        )}

        <Button variant="outline" className="mb-6 w-full justify-start sm:w-auto" asChild>
          <Link href="/admin/settings/search">
            <Search className="size-4" /> Smart Search — synonyms, keywords, popular searches &amp; ranking
          </Link>
        </Button>

        <Tabs defaultValue="company">
          <TabsList className="mb-5">
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="currency">Currency</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Company Information</CardTitle>
                <CardDescription>
                  Shown in the site footer, top bar, contact page and WhatsApp links. Changes here take
                  effect without any code changes or redeploy.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCompanySubmit} className="space-y-4">
                  {COMPANY_FIELDS.map((f) => (
                    <div key={f.key} className="space-y-2">
                      <Label htmlFor={f.key}>{f.label}</Label>
                      {f.multiline ? (
                        <Textarea
                          id={f.key}
                          value={company[f.key]}
                          disabled={!dbConfigured}
                          onChange={(e) => setCompany((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        />
                      ) : (
                        <Input
                          id={f.key}
                          value={company[f.key]}
                          disabled={!dbConfigured}
                          onChange={(e) => setCompany((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                  <Button type="submit" disabled={!dbConfigured || companySaving}>
                    {companySaving ? "Saving…" : "Save Company Information"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="currency">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Currency Settings</CardTitle>
                <CardDescription>
                  Product prices are always stored and entered in USD — this rate only controls the SSP
                  amount shown to shoppers who switch currency. Changing it updates every SSP price across
                  the site immediately; it never rewrites the underlying USD prices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleExchangeRateSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="exchangeRate">1 USD = ? SSP</Label>
                    <Input
                      id="exchangeRate"
                      type="number"
                      min="0"
                      step="0.01"
                      className="max-w-40"
                      value={exchangeRateInput}
                      disabled={!dbConfigured}
                      onChange={(e) => setExchangeRateInput(e.target.value)}
                    />
                  </div>
                  {exchangeRateUpdatedAt && (
                    <p className="text-xs text-muted-foreground">Last updated: {exchangeRateUpdatedAt}</p>
                  )}
                  {exchangeRateError && <p className="text-sm font-medium text-destructive">{exchangeRateError}</p>}
                  <Button type="submit" disabled={!dbConfigured || exchangeRateSaving}>
                    {exchangeRateSaving ? "Saving…" : "Save Exchange Rate"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Other Settings</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
                ) : otherSettings.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No other settings yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead className="w-16" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {otherSettings.map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell className="font-mono text-xs">{key}</TableCell>
                          <TableCell>
                            <Input
                              defaultValue={value}
                              onBlur={(e) => {
                                if (e.target.value !== value) saveSetting(key, e.target.value).then(reload);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSetting(key)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add Setting</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdd} className="flex flex-wrap gap-2">
                  <Input
                    placeholder="Key (e.g. storeName)"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    disabled={!dbConfigured}
                    className="max-w-56"
                  />
                  <Input
                    placeholder="Value"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    disabled={!dbConfigured}
                    className="max-w-56"
                  />
                  <Button type="submit" disabled={!dbConfigured || saving}>
                    <Plus className="size-4" /> Save
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

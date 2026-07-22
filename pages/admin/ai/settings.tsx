import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { toast } from "sonner";
import AdminLayout from "@/features/admin/AdminLayout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import type { AdminRole } from "@/types/domain";

interface AdminAiSettingsPageProps {
  email: string;
  role: AdminRole;
  dbConfigured: boolean;
}

export const getServerSideProps: GetServerSideProps<AdminAiSettingsPageProps> = async ({ req, res }) => {
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.MANAGE_AI);
  if ("redirect" in guard) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
};

const MODEL_OPTIONS = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"];

interface AiSettings {
  mode: string;
  openAiConfigured: boolean;
  enabled: boolean;
  model: string;
  dailyBudgetUsd: number;
}

export default function AiSettingsPage({ email, role, dbConfigured }: AdminAiSettingsPageProps) {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = () => {
    fetch("/api/admin/ai/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings));
  };

  useEffect(() => {
    if (dbConfigured) reload();
  }, [dbConfigured]);

  const save = async (key: string, value: unknown) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ai/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Save failed.");
      setSettings(result.settings);
      toast.success("Saved.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="AI Settings" email={email} role={role}>
      <div className="shadcn-root max-w-xl">
        {!dbConfigured && (
          <p className="mb-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            No database connected yet. Set <code>DATABASE_URL</code> to enable the AI system.
          </p>
        )}

        {settings && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>AI Mode (deploy-time, set via AI_MODE in the server environment)</Label>
                <Input value={settings.mode} disabled readOnly />
                <p className="text-xs text-muted-foreground">
                  This is a safety ceiling, not a runtime toggle — changing it requires editing the server
                  environment and redeploying, on purpose. Every apply route re-checks this value
                  independently of anything below.
                </p>
              </div>

              <div className="space-y-2">
                <Label>OpenAI API Key</Label>
                <Input value={settings.openAiConfigured ? "Set (hidden)" : "Not set"} disabled readOnly />
                <p className="text-xs text-muted-foreground">
                  Set <code>OPENAI_API_KEY</code> in the server environment. Never displayed here.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="ai-enabled">
                  Customer Assistant Enabled (instant kill switch — no redeploy needed)
                </Label>
                <Switch
                  id="ai-enabled"
                  checked={settings.enabled}
                  disabled={saving}
                  onCheckedChange={(checked) => save("enabled", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Model</Label>
                <Select value={settings.model} onValueChange={(v) => save("model", v)} disabled={saving}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-budget">Daily Budget (USD)</Label>
                <Input
                  id="ai-budget"
                  type="number"
                  min="0"
                  step="0.5"
                  value={settings.dailyBudgetUsd}
                  disabled={saving}
                  onChange={(e) => save("dailyBudgetUsd", Number(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Suggestion generation and the customer assistant stop for the rest of the day once this
                  is reached.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Never allowed, by design: raw terminal access, database resets, independent payment processing,
          writing to Odoo while sync is disabled, bypassing admin permissions, or inventing prices, stock,
          discounts, warranty or delivery dates.
        </p>
      </div>
    </AdminLayout>
  );
}

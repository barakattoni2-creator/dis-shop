import { fetchSettings, updateSetting } from "@/services/db/settings";

// AI configuration lives as namespaced rows in the existing generic Setting
// table (ai.*) rather than a dedicated model — reuses infra that already
// does exactly this job. Env vars (.env.example) provide the first-boot
// default; once an admin saves a value from Admin -> AI -> Settings, the
// Setting row takes over and survives redeploys.
const DEFAULTS: Record<string, () => string> = {
  "ai.enabled": () => (process.env.AI_CUSTOMER_ASSISTANT_ENABLED === "true" ? "true" : "false"),
  "ai.model": () => process.env.AI_MODEL || "gpt-4o-mini",
  "ai.dailyBudgetUsd": () => process.env.AI_DAILY_BUDGET_USD || "5",
};

// AI_MODE itself is intentionally NOT stored in Setting — it's a deploy-time
// safety ceiling read straight from the environment on every request, not a
// runtime-editable value. Admin -> AI -> Settings displays it read-only.
export function getAiMode(): "suggest_only" | "disabled" {
  const mode = process.env.AI_MODE || "suggest_only";
  return mode === "disabled" ? "disabled" : "suggest_only";
}

export function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export interface AiSettings {
  mode: "suggest_only" | "disabled";
  openAiConfigured: boolean;
  enabled: boolean;
  model: string;
  dailyBudgetUsd: number;
}

export async function fetchAiSettings(): Promise<AiSettings> {
  const all = await fetchSettings();
  const result: Record<string, unknown> = { mode: getAiMode(), openAiConfigured: isOpenAiConfigured() };
  for (const key of Object.keys(DEFAULTS)) {
    const shortKey = key.replace("ai.", "");
    result[shortKey] = key in all ? all[key] : DEFAULTS[key]();
  }
  result.enabled = result.enabled === "true";
  result.dailyBudgetUsd = Number(result.dailyBudgetUsd) || 0;
  return result as unknown as AiSettings;
}

const EDITABLE_KEYS = new Set(["enabled", "model", "dailyBudgetUsd"]);

export async function updateAiSetting(shortKey: string, value: unknown): Promise<true> {
  if (!EDITABLE_KEYS.has(shortKey)) {
    throw new Error(`"${shortKey}" is not an editable AI setting.`);
  }
  await updateSetting(`ai.${shortKey}`, String(value));
  return true;
}

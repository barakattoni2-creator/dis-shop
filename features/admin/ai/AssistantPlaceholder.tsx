import { Card, CardContent } from "@/components/ui/card";

interface AssistantPlaceholderProps {
  icon: string;
  title: string;
  bullets?: string[];
}

// Shown for assistant sections whose generation pipeline hasn't been wired
// up yet (see services/ai/suggestions.js's APPLIERS registry) — the route,
// permission and nav entry all exist now; the "Generate suggestions" action
// arrives with its own phase rather than shipping half-wired.
export default function AssistantPlaceholder({ icon, title, bullets }: AssistantPlaceholderProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="text-4xl">{icon}</span>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          This assistant&apos;s suggestion pipeline hasn&apos;t been connected yet. Once it is,
          suggestions generated here will always land in Pending Approvals first — nothing is ever
          written automatically.
        </p>
        {bullets && bullets.length > 0 && (
          <ul className="mt-2 grid gap-1.5 text-left text-sm text-muted-foreground sm:grid-cols-2">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-2">
                <span className="size-1 shrink-0 rounded-full bg-primary" />
                {b}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

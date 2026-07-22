import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const subscribeNoop = () => () => {};

// Mounted-guard avoids a hydration mismatch: next-themes only knows the
// real theme after mounting client-side (it reads localStorage), so the
// server-rendered icon would otherwise briefly disagree with the client's.
// useSyncExternalStore (not useState+useEffect) so React itself handles
// the server/client snapshot difference instead of a manual setState-in-
// effect, which the newer react-hooks lint rules flag as an anti-pattern.
function useMounted() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {mounted && resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

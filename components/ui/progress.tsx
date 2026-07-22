import * as React from "react";
import { cn } from "@/lib/utils";

// Plain div-based bar rather than @radix-ui/react-progress (not an existing
// dependency here) — visually identical to shadcn's default Progress, just
// without the extra package for something this simple.
function Progress({
  className,
  value = 0,
  ...props
}: React.ComponentProps<"div"> & { value?: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn("bg-secondary relative h-2 w-full overflow-hidden rounded-full", className)}
      {...props}
    >
      <div
        className="bg-primary h-full flex-1 transition-all duration-200 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export { Progress };

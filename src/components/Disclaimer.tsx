import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function Disclaimer({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <aside
      role="note"
      aria-label="Medical disclaimer"
      className={cn(
        "flex gap-3 rounded-2xl border border-warn/40 bg-warn/10 p-4 text-sm text-foreground",
        compact && "items-center py-3",
        className,
      )}
    >
      <ShieldAlert className="mt-0.5 shrink-0 text-warn" size={20} aria-hidden />
      <p>
        <strong>Educational prototype. Not medical advice.</strong>{" "}
        {compact
          ? "Do not use MediBayes to diagnose or treat any condition. In an emergency call your local emergency number."
          : "MediBayes demonstrates uncertain reasoning with illustrative probabilities, most of which are assumed rather than measured. It is not validated, not a medical device and no substitute for a qualified clinician. In an emergency call your local emergency number."}
      </p>
    </aside>
  );
}

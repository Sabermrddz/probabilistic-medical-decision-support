"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";
import { useDiagnosisStore, type AnalysisView } from "@/store/useDiagnosisStore";

const options: { id: AnalysisView; label: string }[] = [
  { id: "naive", label: "Naive Bayes" },
  { id: "network", label: "Bayesian network" },
  { id: "dempster", label: "Dempster–Shafer" },
];

export function ModeSwitch({ includeDS = true }: { includeDS?: boolean }) {
  const view = useDiagnosisStore((s) => s.view);
  const setView = useDiagnosisStore((s) => s.setView);
  const uid = useId();
  const opts = includeDS ? options : options.slice(0, 2);
  return (
    <div role="tablist" aria-label="Reasoning mode" className="inline-flex rounded-xl border border-border bg-subtle/70 p-1">
      {opts.map((o) => {
        const active = view === o.id;
        return (
          <button
            key={o.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => setView(o.id)}
            className={cn(
              "relative cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "text-accent-foreground" : "text-muted hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={`mode-pill-${uid}`}
                className="absolute inset-0 rounded-lg bg-accent"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { confidenceOf, type RankedDisease } from "@/lib/inference";
import { cn } from "@/lib/utils";

const confColor = { high: "var(--ok)", moderate: "var(--accent)", low: "#5b84b8" } as const;
const confLabel = { high: "High", moderate: "Moderate", low: "Low" } as const;

interface Props {
  rows: readonly RankedDisease[];
  showPrior?: boolean;
  compact?: boolean;
  className?: string;
}

export function ProbabilityBars({ rows, showPrior = true, compact = false, className }: Props) {
  return (
    <ol className={cn("space-y-3", className)} aria-label="Ranked disease probabilities">
      {rows.map((r, i) => {
        const conf = confidenceOf(r.posterior);
        return (
          <motion.li key={r.id} layout transition={{ type: "spring", stiffness: 380, damping: 36 }}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className={cn("truncate text-sm", i === 0 ? "font-semibold" : "font-medium")}>
                <span className="mr-2 text-xs tabular-nums text-muted">{i + 1}</span>
                {r.name}
              </span>
              <span className="flex items-baseline gap-2 tabular-nums">
                {!compact && (
                  <span className="hidden text-xs text-muted sm:inline">
                    {confLabel[conf]} · prior {(r.prior * 100).toFixed(1)}%
                  </span>
                )}
                <AnimatedNumber value={r.posterior * 100} format={(v) => `${v.toFixed(1)}%`} className="text-sm font-semibold" />
              </span>
            </div>
            <div
              className="relative h-2.5 overflow-hidden rounded-full bg-border"
              role="meter"
              aria-label={`${r.name} probability`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(r.posterior * 100)}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: confColor[conf] }}
                initial={false}
                animate={{ width: `${Math.max(r.posterior * 100, 0.4)}%` }}
                transition={{ type: "spring", stiffness: 140, damping: 22 }}
              />
              {showPrior && (
                <span
                  aria-hidden
                  className="absolute top-0 h-full w-0.5 bg-foreground/70"
                  style={{ left: `${Math.min(r.prior * 100, 99.5)}%` }}
                  title="Prior"
                />
              )}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}

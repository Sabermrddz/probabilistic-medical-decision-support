"use client";

import { AlertTriangle, CheckCircle2, FlaskConical, HelpCircle, Siren } from "lucide-react";
import { Card } from "@/components/ui/card";
import { THRESHOLDS, type Decision, type DecisionLevel } from "@/lib/inference";
import { cn } from "@/lib/utils";

const styles: Record<DecisionLevel, { icon: typeof Siren; box: string; iconColor: string }> = {
  urgent: { icon: Siren, box: "border-danger/60 bg-danger/10", iconColor: "text-danger" },
  test: { icon: FlaskConical, box: "border-ok/50 bg-ok/10", iconColor: "text-ok" },
  clinician: { icon: AlertTriangle, box: "border-warn/50 bg-warn/10", iconColor: "text-warn" },
  monitor: { icon: HelpCircle, box: "border-border bg-subtle/60", iconColor: "text-accent" },
  none: { icon: CheckCircle2, box: "border-border bg-subtle/60", iconColor: "text-muted" },
};

export function DecisionPanel({ decision }: { decision: Decision }) {
  const st = styles[decision.level];
  const Icon = st.icon;
  return (
    <Card className={cn("border-2", st.box)} role="region" aria-label="Decision support" aria-live="polite">
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 shrink-0", st.iconColor)} size={26} aria-hidden />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Decision support</p>
          <h2 className="text-lg font-semibold leading-snug">{decision.headline}</h2>
        </div>
      </div>
      {decision.redFlags.length > 0 && (
        <ul className="mt-4 space-y-2">
          {decision.redFlags.map((f) => (
            <li key={f.id} className="rounded-xl border border-danger/40 bg-card-solid/70 p-3 text-sm">
              <strong className="text-danger">⚠ {f.title}.</strong> {f.detail}
            </li>
          ))}
        </ul>
      )}
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
        {decision.advice.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
      {decision.suggestedTest && decision.level !== "none" && (
        <p className="mt-3 text-sm">
          <span className="font-medium">Typical confirmatory test:</span> {decision.suggestedTest}
        </p>
      )}
      <p className="mt-4 text-xs text-muted">
        Rules: test advised when top posterior ≥ {THRESHOLDS.test * 100}%; urgent care on red-flag patterns (checked independently of
        the probabilities). Thresholds are illustrative.
      </p>
    </Card>
  );
}

"use client";

import { model, diseaseById } from "@/data/model";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { RiskFactor } from "@/lib/inference";
import { cn } from "@/lib/utils";
import { useDiagnosisStore } from "@/store/useDiagnosisStore";

function effectSummary(rf: RiskFactor, levelId: string): string {
  const entries = Object.entries(rf.multipliers[levelId] ?? {}).filter(([, m]) => Math.abs(m.value - 1) > 0.05);
  if (entries.length === 0) return "Reference level: no change to any prior.";
  const up = entries.filter(([, m]) => m.value > 1).sort((a, b) => b[1].value - a[1].value).slice(0, 3);
  const down = entries.filter(([, m]) => m.value < 1).sort((a, b) => a[1].value - b[1].value).slice(0, 2);
  const fmt = ([d, m]: [string, { value: number }]) => `${diseaseById[d].name} ×${m.value}`;
  return [up.length ? `Raises: ${up.map(fmt).join(", ")}` : "", down.length ? `Lowers: ${down.map(fmt).join(", ")}` : ""]
    .filter(Boolean)
    .join(" · ");
}

function FactorGroup({ rf }: { rf: RiskFactor }) {
  const selected = useDiagnosisStore((s) => s.risk[rf.id]);
  const setRisk = useDiagnosisStore((s) => s.setRisk);
  const options = [...rf.levels, { id: "__unknown", label: "Unknown" }];
  const current = selected ?? "__unknown";
  return (
    <Card>
      <fieldset>
        <legend className="text-base font-semibold">{rf.label}</legend>
        <p className="mt-1 text-sm text-muted">{rf.description}</p>
        <div role="radiogroup" aria-label={rf.label} className="mt-4 flex flex-wrap gap-2">
          {options.map((o) => {
            const active = current === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setRisk(rf.id, o.id === "__unknown" ? null : o.id)}
                className={cn(
                  "cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium transition active:scale-95",
                  active
                    ? "border-accent bg-accent text-accent-foreground shadow"
                    : "border-border bg-card-solid/60 hover:border-accent/60 hover:bg-accent-soft",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        <p className="mt-3 min-h-10 text-xs text-muted" aria-live="polite">
          {selected ? `${effectSummary(rf, selected)} (assumed multipliers)` : "Unknown: ignored by Naive Bayes, marginalised over its prior by the Bayesian network."}
        </p>
      </fieldset>
    </Card>
  );
}

export function ProfileStep() {
  return (
    <section aria-labelledby="profile-title">
      <CardTitle id="profile-title" className="text-2xl">
        Patient profile
      </CardTitle>
      <CardDescription className="mb-6 max-w-2xl">
        Risk factors change the <em>prior</em> probability of each disease before any symptom is considered. Skip anything you
        don&apos;t know.
      </CardDescription>
      <div className="grid gap-4 md:grid-cols-2">
        {model.riskFactors.map((rf) => (
          <FactorGroup key={rf.id} rf={rf} />
        ))}
      </div>
    </section>
  );
}

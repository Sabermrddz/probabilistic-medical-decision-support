"use client";

import { useMemo } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { compareModes } from "@/lib/inference";
import { cn } from "@/lib/utils";
import type { Analysis } from "@/store/useAnalysis";

export function ModeCompare({ analysis }: { analysis: Analysis }) {
  const rows = useMemo(() => compareModes(analysis.naive, analysis.network), [analysis]);
  const maxDelta = Math.max(...rows.map((r) => Math.abs(r.delta)));
  return (
    <Card>
      <CardTitle>Naive Bayes vs Bayesian network</CardTitle>
      <CardDescription>
        Same symptom likelihoods; the models differ only in how risk factors shape the prior: independent multipliers vs a CPT with
        interactions, with unknown factors marginalised by enumeration.
      </CardDescription>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <caption className="sr-only">Posterior probability per disease in both modes</caption>
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted">
              <th scope="col" className="pb-2 font-medium">Disease</th>
              <th scope="col" className="pb-2 text-right font-medium">Naive</th>
              <th scope="col" className="pb-2 text-right font-medium">Network</th>
              <th scope="col" className="pb-2 text-right font-medium">Δ (pp)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const big = Math.abs(r.delta) >= 0.01;
              return (
                <tr key={r.id} className="border-t border-border">
                  <th scope="row" className="py-1.5 pr-2 text-left font-medium">{r.name}</th>
                  <td className="py-1.5 text-right tabular-nums">{(r.naive * 100).toFixed(1)}%</td>
                  <td className="py-1.5 text-right tabular-nums">{(r.network * 100).toFixed(1)}%</td>
                  <td className={cn("py-1.5 text-right tabular-nums", big && (r.delta > 0 ? "font-semibold text-ok" : "font-semibold text-danger"))}>
                    {r.delta > 0 ? "+" : ""}
                    {(r.delta * 100).toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted" aria-live="polite">
        {maxDelta < 0.01
          ? "The two models agree within 1 percentage point for this patient."
          : "Rows in colour differ by ≥ 1 percentage point: an interaction fired, or some risk factors are unknown."}
      </p>
    </Card>
  );
}

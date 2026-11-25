"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { diseaseById, symptomById } from "@/data/model";
import type { Analysis } from "@/store/useAnalysis";

export function DempsterShaferPanel({ analysis }: { analysis: Analysis }) {
  const { ds, result } = analysis;
  const rows = [...ds.diseases].sort((a, b) => b.betP - a.betP);
  return (
    <Card>
      <CardTitle>Dempster–Shafer belief</CardTitle>
      <CardDescription>
        Each symptom becomes a simple-support mass function; they are combined with Dempster&apos;s rule. Priors are <em>not</em> used,
        so the Bel–Pl gap shows ignorance honestly.
      </CardDescription>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone={ds.conflict > 0.3 ? "warn" : "neutral"}>Conflict K = {ds.conflict.toFixed(3)}</Badge>
        <Badge tone="accent">m(Θ) ignorance = {(ds.ignorance * 100).toFixed(1)}%</Badge>
        <Badge>{ds.masses.length} mass functions combined</Badge>
        {ds.degenerate && <Badge tone="danger">Totally conflicting evidence</Badge>}
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <caption className="sr-only">Belief, plausibility and pignistic probability per disease, compared with the Bayesian posterior</caption>
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted">
              <th scope="col" className="pb-2 font-medium">Disease</th>
              <th scope="col" className="pb-2 font-medium">Belief interval [Bel, Pl]</th>
              <th scope="col" className="pb-2 text-right font-medium">Bel</th>
              <th scope="col" className="pb-2 text-right font-medium">Pl</th>
              <th scope="col" className="pb-2 text-right font-medium">BetP</th>
              <th scope="col" className="pb-2 text-right font-medium">Bayes</th>
              <th scope="col" className="pb-2 text-right font-medium" title="1 − Pl: mass committed against the disease">Disbelief</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <th scope="row" className="py-2 pr-2 text-left font-medium">{r.name}</th>
                <td className="w-48 py-2">
                  <div className="relative h-3 rounded-full bg-border" aria-hidden>
                    <div className="absolute h-full rounded-full bg-accent/40" style={{ left: `${r.bel * 100}%`, width: `${Math.max((r.pl - r.bel) * 100, 0.8)}%` }} />
                    <div className="absolute -top-0.5 h-4 w-1 rounded bg-accent" style={{ left: `calc(${r.betP * 100}% - 2px)` }} title="BetP" />
                    <div className="absolute -top-0.5 h-4 w-1 rounded bg-foreground" style={{ left: `calc(${result.posterior[r.id] * 100}% - 2px)` }} title="Bayesian posterior" />
                  </div>
                </td>
                <td className="py-2 text-right tabular-nums">{r.bel.toFixed(3)}</td>
                <td className="py-2 text-right tabular-nums">{r.pl.toFixed(3)}</td>
                <td className="py-2 text-right font-semibold tabular-nums">{r.betP.toFixed(3)}</td>
                <td className="py-2 text-right tabular-nums text-muted">{result.posterior[r.id].toFixed(3)}</td>
                <td className="py-2 text-right tabular-nums text-muted">{(1 - r.pl).toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">
        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-accent" /> BetP marker · <span className="mx-1 inline-block h-2 w-2 rounded-full bg-foreground" /> Bayesian posterior ({result.mode === "network" ? "network" : "naive"}). Dempster&apos;s rule yields one global K,
        so the per-disease column shows disbelief (1 − Pl) instead.
      </p>
      {ds.masses.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium">Mass functions built from the evidence</summary>
          <ul className="mt-2 space-y-1.5 text-xs">
            {ds.masses.map((m) => (
              <li key={m.symptomId} className="rounded-lg bg-subtle/70 p-2">
                <b>{symptomById[m.symptomId].label}</b> ({m.state}): m({m.focal.length > 4 ? `${m.focal.length} diseases` : m.focal.map((f) => diseaseById[f].name).join(" ∪ ")}) ={" "}
                {m.weight.toFixed(2)}, m(Θ) = {(1 - m.weight).toFixed(2)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

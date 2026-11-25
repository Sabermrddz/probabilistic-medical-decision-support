"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { diseaseById, model, symptomById } from "@/data/model";
import { bayesBreakdown } from "@/lib/inference";
import type { Analysis } from "@/store/useAnalysis";
import { useDiagnosisStore } from "@/store/useDiagnosisStore";

export const fmtP = (x: number): string => (x !== 0 && Math.abs(x) < 0.001 ? x.toExponential(2) : x.toFixed(4));

export function WhyPanel({ analysis }: { analysis: Analysis }) {
  const evidence = useDiagnosisStore((s) => s.evidence);
  const [selected, setSelected] = useState<string | null>(null);
  const { result } = analysis;
  const id = selected ?? result.ranking[0].id;

  const data = useMemo(
    () =>
      result.contributions[id]
        .map((c) => ({
          name: symptomById[c.symptomId].label + (c.state === "absent" ? " (absent)" : ""),
          value: Number(c.marginalLogOdds.toFixed(2)),
          lr: c.likelihoodRatio,
          p: model.likelihoods[id][c.symptomId].value,
          state: c.state,
        }))
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value)),
    [result, id],
  );
  const breakdown = useMemo(() => bayesBreakdown(model, result, evidence, id), [result, evidence, id]);

  if (result.observedCount === 0) {
    return (
      <Card>
        <CardTitle>Why this result?</CardTitle>
        <CardDescription>Mark at least one symptom as present or absent to see the explanation.</CardDescription>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Why this result?</CardTitle>
          <CardDescription>Explaining the posterior of the selected disease.</CardDescription>
        </div>
        <label className="text-sm">
          <span className="mr-2 text-muted">Disease</span>
          <select
            value={id}
            onChange={(e) => setSelected(e.target.value)}
            className="h-9 cursor-pointer rounded-lg border border-border bg-card-solid px-2 text-sm"
          >
            {result.ranking.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h3 className="mt-6 text-sm font-semibold">Per-symptom contribution to the log-odds of {diseaseById[id].name}</h3>
      <p className="text-xs text-muted">
        Shift in ln-odds when the symptom is added <em>last</em>, given all other evidence. Positive pushes towards the disease.
      </p>
      <div className="mt-2 w-full" style={{ height: 52 + data.length * 34 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" stroke="var(--muted)" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={130} stroke="var(--muted)" tick={{ fontSize: 12 }} />
            <ReferenceLine x={0} stroke="var(--foreground)" />
            <RTooltip
              cursor={{ fill: "var(--accent-soft)" }}
              contentStyle={{ background: "var(--card-solid)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, color: "var(--foreground)" }}
              itemStyle={{ color: "var(--foreground)" }}
              formatter={(v) => [`${Number(v) > 0 ? "+" : ""}${v} ln-odds`, "Contribution"]}
              labelFormatter={(l) => {
                const row = data.find((d) => d.name === l);
                return row ? `${l}: LR ${row.lr.toFixed(2)}, P(s|D) = ${row.p.toFixed(2)}` : String(l);
              }}
            />
            <Bar dataKey="value" radius={4} isAnimationActive animationDuration={500}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.value >= 0 ? "var(--accent)" : "var(--danger)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h3 className="mt-6 text-sm font-semibold">Bayes&apos; theorem, step by step: {diseaseById[id].name}</h3>
      <div className="mt-2 space-y-3 rounded-xl bg-subtle/70 p-4 font-mono text-xs leading-relaxed sm:text-sm">
        <p className="text-muted">P(D | E) = P(D) · Π P(sᵢ | D) / P(E)</p>
        <p>
          1. Prior&nbsp; P(D) = <b>{fmtP(breakdown.prior)}</b>
          <span className="text-muted"> ({result.mode === "network" ? "network marginal" : "risk-adjusted"})</span>
        </p>
        <ul className="space-y-0.5">
          {breakdown.terms.map((t, i) => (
            <li key={t.symptomId}>
              {i + 2}. × P({symptomById[t.symptomId].label} {t.state === "present" ? "present" : "absent"} | D) = <b>{fmtP(t.probability)}</b>
            </li>
          ))}
        </ul>
        <p>
          = joint P(D, E) = <b>{fmtP(breakdown.joint)}</b>
        </p>
        <p>
          Σ over all 11 classes: P(E) = <b>{fmtP(breakdown.evidenceProbability)}</b>
        </p>
        <p className="text-accent">
          P(D | E) = {fmtP(breakdown.joint)} / {fmtP(breakdown.evidenceProbability)} = <b>{(breakdown.posterior * 100).toFixed(2)}%</b>
        </p>
      </div>

      <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">Sequential updating (order entered)</h4>
      <ol className="mt-2 space-y-1.5">
        {breakdown.steps.map((s, i) => (
          <li key={s.label + i} className="grid grid-cols-[110px_1fr_52px] items-center gap-2 text-xs sm:grid-cols-[150px_1fr_56px]">
            <span className="truncate text-muted">{s.label.replace("_", " ")}</span>
            <span className="h-2 overflow-hidden rounded-full bg-border">
              <span className="block h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${s.posterior * 100}%` }} />
            </span>
            <span className="text-right tabular-nums">{(s.posterior * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

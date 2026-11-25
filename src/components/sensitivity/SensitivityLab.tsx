"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { ModeSwitch } from "@/components/diagnosis/ModeSwitch";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { diseaseById, model, symptomById } from "@/data/model";
import { testPatients } from "@/data/patients";
import { infer, withOverrides } from "@/lib/inference";
import { diseaseColors } from "@/lib/symptomMeta";
import { useDiagnosisStore } from "@/store/useDiagnosisStore";

const tooltipStyle = { background: "var(--card-solid)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, color: "var(--foreground)" };
const tooltipItemStyle = { color: "var(--foreground)" };
const legendLabelStyle = { color: "var(--foreground)" };

export function SensitivityLab() {
  const mode = useDiagnosisStore((s) => s.mode);
  const sessionRisk = useDiagnosisStore((s) => s.risk);
  const sessionEvidence = useDiagnosisStore((s) => s.evidence);
  const [scenarioId, setScenarioId] = useState("ambiguous");
  const [scale, setScale] = useState<Record<string, number>>({});
  const [likDisease, setLikDisease] = useState("covid");
  const [likSymptom, setLikSymptom] = useState("loss_of_smell");
  const [likValue, setLikValue] = useState<number | null>(null);

  const scenario = scenarioId === "session" ? { risk: sessionRisk, evidence: sessionEvidence } : testPatients.find((p) => p.id === scenarioId)!;
  const baseLik = model.likelihoods[likDisease][likSymptom].value;
  const lv = likValue ?? baseLik;
  const input = { mode, risk: scenario.risk, evidence: scenario.evidence };

  const baseline = useMemo(() => infer(model, input), [mode, scenario]); // eslint-disable-line react-hooks/exhaustive-deps
  const adjustedModel = useMemo(
    () => withOverrides(model, { priorScale: scale, likelihood: likValue === null ? undefined : { diseaseId: likDisease, symptomId: likSymptom, value: likValue } }),
    [scale, likValue, likDisease, likSymptom],
  );
  const adjusted = useMemo(() => infer(adjustedModel, input), [adjustedModel, mode, scenario]); // eslint-disable-line react-hooks/exhaustive-deps

  const bars = model.diseases.map((d) => ({ name: d.name, Baseline: +(baseline.posterior[d.id] * 100).toFixed(1), Adjusted: +(adjusted.posterior[d.id] * 100).toFixed(1) }));
  const leaders = baseline.ranking.slice(0, 4).map((r) => r.id);
  if (!leaders.includes(likDisease)) leaders.push(likDisease);

  const sweep = useMemo(() => {
    const pts: Record<string, number>[] = [];
    for (let v = 0.01; v <= 0.99; v += 0.02) {
      const m = withOverrides(model, { priorScale: scale, likelihood: { diseaseId: likDisease, symptomId: likSymptom, value: v } });
      const r = infer(m, input);
      const row: Record<string, number> = { v: +v.toFixed(2) };
      for (const id of leaders) row[id] = +(r.posterior[id] * 100).toFixed(2);
      pts.push(row);
    }
    return pts;
  }, [scale, likDisease, likSymptom, mode, scenario]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setScale({});
    setLikValue(null);
  };
  const observed = Object.keys(scenario.evidence);
  const priorsNow = adjustedModel.priors;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm">
            <span className="mb-1 block text-muted">Scenario</span>
            <select value={scenarioId} onChange={(e) => setScenarioId(e.target.value)} className="h-10 cursor-pointer rounded-xl border border-border bg-card-solid px-3">
              {testPatients.map((p) => (
                <option key={p.id} value={p.id}>{p.kind}: {p.name}</option>
              ))}
              <option value="session">My current diagnosis session</option>
            </select>
          </label>
          <ModeSwitch includeDS={false} />
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw size={14} aria-hidden /> Reset sliders
        </Button>
      </div>
      {observed.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">The current session has no symptoms yet. Pick a test patient or add symptoms in Diagnosis.</p>}

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardTitle>Prior sliders</CardTitle>
            <CardDescription>Scale each base prior from 0.1× to 5×; priors are renormalised to sum to 1.</CardDescription>
            <ul className="mt-4 space-y-3">
              {model.diseases.map((d) => (
                <li key={d.id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium">{d.name}</span>
                    <span className="tabular-nums text-muted">×{(scale[d.id] ?? 1).toFixed(1)} → {(priorsNow[d.id].value * 100).toFixed(1)}%</span>
                  </div>
                  <Slider label={`Prior scale for ${d.name}`} min={0.1} max={5} step={0.1} value={scale[d.id] ?? 1} onChange={(v) => setScale((s) => ({ ...s, [d.id]: v }))} />
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardTitle>Likelihood slider</CardTitle>
            <CardDescription>Override a single P(symptom | disease).</CardDescription>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <label>
                <span className="mb-1 block text-xs text-muted">Disease</span>
                <select value={likDisease} onChange={(e) => { setLikDisease(e.target.value); setLikValue(null); }} className="h-9 w-full cursor-pointer rounded-lg border border-border bg-card-solid px-2">
                  {model.diseases.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-xs text-muted">Symptom</span>
                <select value={likSymptom} onChange={(e) => { setLikSymptom(e.target.value); setLikValue(null); }} className="h-9 w-full cursor-pointer rounded-lg border border-border bg-card-solid px-2">
                  {model.symptoms.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </label>
            </div>
            <div className="mb-1 mt-4 flex justify-between text-xs">
              <span className="font-medium">P({symptomById[likSymptom].label} | {diseaseById[likDisease].name})</span>
              <span className="tabular-nums text-muted">baseline {baseLik.toFixed(2)} → <b className="text-foreground">{lv.toFixed(2)}</b></span>
            </div>
            <Slider label="Likelihood value" min={0.01} max={0.99} step={0.01} value={lv} onChange={setLikValue} />
            <p className="mt-2 text-xs text-muted">
              {symptomById[likSymptom].label} is {scenario.evidence[likSymptom] ?? "not observed"} in this scenario
              {scenario.evidence[likSymptom] ? "" : ", so changing this likelihood has no effect on the posterior."}
            </p>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <CardTitle>Posterior: baseline vs adjusted (%)</CardTitle>
            <div className="mt-3 h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bars} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="var(--muted)" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={120} stroke="var(--muted)" tick={{ fontSize: 11 }} />
                  <RTooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} cursor={{ fill: "var(--accent-soft)" }} />
                  <Legend labelStyle={legendLabelStyle} />
                  <Bar dataKey="Baseline" fill="#64748b" radius={3} animationDuration={400} />
                  <Bar dataKey="Adjusted" fill="var(--accent)" radius={3} animationDuration={400} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <CardTitle>Sweep: P({symptomById[likSymptom].label} | {diseaseById[likDisease].name}) from 0 to 1</CardTitle>
            <CardDescription>How the leading posteriors react as this single likelihood changes. Dot = current slider value.</CardDescription>
            <div className="mt-3 h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sweep} margin={{ left: 0, right: 16, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="v" type="number" domain={[0, 1]} stroke="var(--muted)" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} unit="%" stroke="var(--muted)" tick={{ fontSize: 11 }} />
                  <RTooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} formatter={(v, n) => [`${v}%`, diseaseById[String(n)]?.name ?? String(n)]} />
                  <Legend labelStyle={legendLabelStyle} formatter={(n) => diseaseById[String(n)]?.name ?? String(n)} />
                  {leaders.map((id) => (
                    <Line key={id} type="monotone" dataKey={id} stroke={diseaseColors[id]} strokeWidth={id === likDisease ? 3 : 1.8} dot={false} isAnimationActive={false} />
                  ))}
                  <ReferenceDot x={+lv.toFixed(2)} y={adjusted.posterior[likDisease] * 100} r={6} fill={diseaseColors[likDisease]} stroke="var(--foreground)" ifOverflow="extendDomain" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

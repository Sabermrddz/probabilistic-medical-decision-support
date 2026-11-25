"use client";

import { FileDown, ImageDown, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { DecisionPanel } from "@/components/diagnosis/DecisionPanel";
import { ProbabilityBars } from "@/components/ProbabilityBars";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { model, symptomById } from "@/data/model";
import type { TestPatient } from "@/data/patients";
import { analyse } from "@/store/useAnalysis";
import { useDiagnosisStore } from "@/store/useDiagnosisStore";

const toneByKind = { Mild: "ok", Classic: "accent", Ambiguous: "warn" } as const;

export function PatientReport({ patient }: { patient: TestPatient }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const load = useDiagnosisStore((s) => s.load);
  const setStep = useDiagnosisStore((s) => s.setStep);
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);
  const analysis = useMemo(() => analyse(patient.risk, patient.evidence, "naive"), [patient]);
  const top = analysis.result.ranking[0];
  const contrib = analysis.result.contributions[top.id]
    .map((c) => ({ name: symptomById[c.symptomId].label + (c.state === "absent" ? " (absent)" : ""), value: +c.marginalLogOdds.toFixed(2) }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const best = analysis.ds.diseases.reduce((a, b) => (b.betP > a.betP ? b : a));

  const capture = async () => {
    const { toPng } = await import("html-to-image");
    const bg = getComputedStyle(document.body).backgroundColor;
    return toPng(ref.current as HTMLElement, { pixelRatio: 2, backgroundColor: bg, filter: (n) => !(n instanceof HTMLElement && n.dataset.noExport !== undefined) });
  };
  const exportPng = async () => {
    setBusy("png");
    try {
      const url = await capture();
      const a = document.createElement("a");
      a.href = url;
      a.download = `medibayes-${patient.id}.png`;
      a.click();
    } finally {
      setBusy(null);
    }
  };
  const exportPdf = async () => {
    setBusy("pdf");
    try {
      const url = await capture();
      const { jsPDF } = await import("jspdf");
      const img = new Image();
      img.src = url;
      await img.decode();
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const w = 190;
      const h = (img.height / img.width) * w;
      pdf.setFontSize(9);
      pdf.text("MediBayes educational report. Not medical advice.", 10, 8);
      if (h <= 275) pdf.addImage(url, "PNG", 10, 12, w, h);
      else pdf.addImage(url, "PNG", 10, 12, (275 / h) * w, 275);
      pdf.save(`medibayes-${patient.id}.pdf`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-label={`Report for ${patient.name}`} className="space-y-3">
      <div ref={ref} className="space-y-4 rounded-3xl bg-background p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">{patient.name}</h2>
              <Badge tone={toneByKind[patient.kind]}>{patient.kind} case</Badge>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted">{patient.summary}</p>
          </div>
          <p className="flex items-center gap-1 text-xs text-muted"><Stethoscope size={14} aria-hidden /> MediBayes · synthetic patient · not medical advice</p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {model.riskFactors.map((rf) => (
            <Badge key={rf.id}>{rf.label}: {rf.levels.find((l) => l.id === patient.risk[rf.id])?.label ?? "unknown"}</Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {Object.entries(patient.evidence).map(([id, st]) => (
            <Badge key={id} tone={st === "present" ? "accent" : "neutral"}>{st === "present" ? "+" : "−"} {symptomById[id].label}</Badge>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="mb-3 font-semibold">Top 5 · naive Bayes</h3>
            <ProbabilityBars rows={analysis.result.top5} compact />
            <p className="mt-4 text-xs text-muted">
              Bayesian network top: <b className="text-foreground">{analysis.network.ranking[0].name} ({(analysis.network.ranking[0].posterior * 100).toFixed(1)}%)</b>. Dempster–Shafer BetP top:{" "}
              <b className="text-foreground">{best.name} ({(best.betP * 100).toFixed(1)}%)</b>, K = {analysis.ds.conflict.toFixed(2)}.
            </p>
          </Card>
          <Card>
            <h3 className="mb-1 font-semibold">Evidence for {top.name} (Δ ln-odds)</h3>
            <div className="w-full" style={{ height: 40 + contrib.length * 30 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contrib} layout="vertical" margin={{ left: 4, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted)" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={120} stroke="var(--muted)" tick={{ fontSize: 11 }} />
                  <ReferenceLine x={0} stroke="var(--foreground)" />
                  <Bar dataKey="value" radius={3} isAnimationActive={false}>
                    {contrib.map((d) => <Cell key={d.name} fill={d.value >= 0 ? "var(--accent)" : "var(--danger)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <DecisionPanel decision={analysis.decision} />
      </div>
      <div className="flex flex-wrap gap-2" data-no-export>
        <Button variant="outline" size="sm" onClick={exportPng} disabled={busy !== null}>
          <ImageDown size={14} aria-hidden /> {busy === "png" ? "Exporting…" : "Export PNG"}
        </Button>
        <Button variant="outline" size="sm" onClick={exportPdf} disabled={busy !== null}>
          <FileDown size={14} aria-hidden /> {busy === "pdf" ? "Exporting…" : "Export PDF"}
        </Button>
        <Button size="sm" onClick={() => { load(patient.risk, patient.evidence); setStep(2); router.push("/diagnosis"); }}>
          Open in diagnosis tool
        </Button>
      </div>
    </section>
  );
}

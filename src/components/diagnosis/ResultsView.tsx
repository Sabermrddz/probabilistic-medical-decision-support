"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { DataStatus } from "@/components/DataStatus";
import { ProbabilityBars } from "@/components/ProbabilityBars";
import type { Analysis } from "@/store/useAnalysis";
import { useDiagnosisStore } from "@/store/useDiagnosisStore";
import { DecisionPanel } from "./DecisionPanel";
import { DempsterShaferPanel } from "./DempsterShaferPanel";
import { ModeCompare } from "./ModeCompare";
import { ModeSwitch } from "./ModeSwitch";
import { NextQuestion } from "./NextQuestion";
import { WhyPanel } from "./WhyPanel";

export function RankedCard({ analysis, showAll }: { analysis: Analysis; showAll: boolean }) {
  const rows = showAll ? analysis.result.ranking : analysis.result.top5;
  return <ProbabilityBars rows={rows} />;
}

export function ResultsView({ analysis }: { analysis: Analysis }) {
  const view = useDiagnosisStore((s) => s.view);
  const [showAll, setShowAll] = useState(false);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-6">
        <Card>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Ranked diagnoses</CardTitle>
              <CardDescription>
                P(disease | evidence) · tick marks show the prior · {analysis.result.observedCount} symptom
                {analysis.result.observedCount === 1 ? "" : "s"} observed
              </CardDescription>
            </div>
            <ModeSwitch />
          </div>
          <RankedCard analysis={analysis} showAll={showAll} />
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => setShowAll((s) => !s)} aria-expanded={showAll}>
            {showAll ? "Show top 5 only" : "Show all 11 classes"}
          </Button>
        </Card>
        {view === "dempster" && <DempsterShaferPanel analysis={analysis} />}
        <ModeCompare analysis={analysis} />
        <WhyPanel analysis={analysis} />
      </div>
      <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start" aria-label="Decision support and next steps">
        <DecisionPanel decision={analysis.decision} />
        <NextQuestion analysis={analysis} />
        <DataStatus />
      </aside>
    </div>
  );
}

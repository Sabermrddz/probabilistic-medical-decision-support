"use client";

import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { diseaseById, symptomById } from "@/data/model";
import { symptomIcons } from "@/lib/symptomMeta";
import type { Analysis } from "@/store/useAnalysis";
import { useDiagnosisStore } from "@/store/useDiagnosisStore";

export function NextQuestion({ analysis }: { analysis: Analysis }) {
  const setSymptom = useDiagnosisStore((s) => s.setSymptom);
  const best = analysis.next[0];
  if (!best) return null;
  const Icon = symptomIcons[best.symptomId] ?? Lightbulb;
  const s = symptomById[best.symptomId];
  const top = diseaseById[best.topDiseaseId].name;
  const second = diseaseById[best.runnerUpId].name;
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <Icon size={20} aria-hidden />
        </span>
        <div>
          <CardTitle>Suggested next question</CardTitle>
          <CardDescription>Highest expected information gain between the two leading diseases.</CardDescription>
        </div>
      </div>
      <p className="mt-4 text-base font-semibold">Do you have: {s.label.toLowerCase()}?</p>
      <p className="mt-1 text-sm text-muted">
        P(present | {top}) = <b className="text-foreground">{(best.pTop * 100).toFixed(0)}%</b> vs P(present | {second}) ={" "}
        <b className="text-foreground">{(best.pRunnerUp * 100).toFixed(0)}%</b>. Expected gain {best.gainTop2.toFixed(3)} bits
        (full distribution: {best.gainAll.toFixed(3)} bits).
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setSymptom(best.symptomId, "present")}>
          Present
        </Button>
        <Button size="sm" variant="outline" onClick={() => setSymptom(best.symptomId, "absent")}>
          Absent
        </Button>
      </div>
      {analysis.next.length > 1 && (
        <p className="mt-4 text-xs text-muted">
          Next best:{" "}
          {analysis.next
            .slice(1)
            .map((q) => `${symptomById[q.symptomId].label} (${q.gainTop2.toFixed(3)} bits)`)
            .join(", ")}
        </p>
      )}
    </Card>
  );
}

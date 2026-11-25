"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/Disclaimer";
import { ProbabilityBars } from "@/components/ProbabilityBars";
import { cn } from "@/lib/utils";
import { useAnalysis } from "@/store/useAnalysis";
import { useDiagnosisStore } from "@/store/useDiagnosisStore";
import { ModeSwitch } from "./ModeSwitch";
import { ProfileStep } from "./ProfileStep";
import { ResultsView } from "./ResultsView";
import { SymptomPicker } from "./SymptomPicker";

const steps = ["Patient profile", "Symptoms", "Results"] as const;

function Stepper() {
  const step = useDiagnosisStore((s) => s.step);
  const setStep = useDiagnosisStore((s) => s.setStep);
  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {steps.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(i as 0 | 1 | 2)}
              aria-current={active ? "step" : undefined}
              className="flex cursor-pointer items-center gap-2 text-left"
            >
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-semibold transition",
                  active && "border-accent bg-accent text-accent-foreground",
                  done && "border-accent bg-accent-soft text-accent",
                  !active && !done && "border-border text-muted",
                )}
              >
                {done ? <Check size={16} aria-hidden /> : i + 1}
              </span>
              <span className={cn("hidden text-sm font-medium sm:inline", active ? "text-foreground" : "text-muted")}>{label}</span>
            </button>
            {i < steps.length - 1 && <span className={cn("h-0.5 flex-1 rounded", done ? "bg-accent" : "bg-border")} aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

function LivePanel({ onResults }: { onResults: () => void }) {
  const analysis = useAnalysis();
  return (
    <Card className="lg:sticky lg:top-24" aria-label="Live results">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Live results</h2>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className="h-2 w-2 animate-pulse rounded-full bg-ok" aria-hidden /> updating
        </span>
      </div>
      <div className="mb-4 overflow-x-auto">
        <ModeSwitch includeDS={false} />
      </div>
      <ProbabilityBars rows={analysis.result.top5} compact />
      <p className="mt-4 rounded-lg bg-subtle/70 p-3 text-xs" aria-live="polite">
        <b>{analysis.decision.headline}</b>
      </p>
      <Button className="mt-4 w-full" onClick={onResults}>
        Full results & explanation <ArrowRight size={16} aria-hidden />
      </Button>
    </Card>
  );
}

export function DiagnosisWizard() {
  const step = useDiagnosisStore((s) => s.step);
  const setStep = useDiagnosisStore((s) => s.setStep);
  const reset = useDiagnosisStore((s) => s.reset);
  const analysis = useAnalysis();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Diagnosis</h1>
          <p className="mt-1 text-sm text-muted">Three steps: profile → symptoms → probabilistic results.</p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw size={14} aria-hidden /> Start over
        </Button>
      </div>
      <Disclaimer compact />
      <Stepper />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {step === 0 && <ProfileStep />}
          {step === 1 && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <SymptomPicker />
              <div>
                <LivePanel onResults={() => setStep(2)} />
              </div>
            </div>
          )}
          {step === 2 && <ResultsView analysis={analysis} />}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between gap-3 border-t border-border pt-6">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((step - 1) as 0 | 1 | 2)}>
          <ArrowLeft size={16} aria-hidden /> Back
        </Button>
        {step < 2 && (
          <Button onClick={() => setStep((step + 1) as 0 | 1 | 2)}>
            {step === 0 ? "Continue to symptoms" : "See full results"} <ArrowRight size={16} aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}

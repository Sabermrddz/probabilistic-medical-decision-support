"use client";

import { useMemo } from "react";
import { model } from "@/data/model";
import {
  decide,
  infer,
  inferDempsterShafer,
  suggestNextQuestions,
  riskAdjustedPrior,
  type Evidence,
  type InferenceMode,
  type RiskProfile,
} from "@/lib/inference";
import { useDiagnosisStore } from "./useDiagnosisStore";

export function analyse(risk: RiskProfile, evidence: Evidence, mode: InferenceMode) {
  const naive = infer(model, { mode: "naive", risk, evidence });
  const network = infer(model, { mode: "network", risk, evidence });
  const result = mode === "network" ? network : naive;
  const ds = inferDempsterShafer(model, evidence);
  const decision = decide(model, result, evidence);
  const next = suggestNextQuestions(model, result.posterior, evidence, 3);
  return { naive, network, result, ds, decision, next, dsWithPrior: inferDempsterShafer(model, evidence, { prior: riskAdjustedPrior(model, risk) }) };
}

export type Analysis = ReturnType<typeof analyse>;

/** Live analysis of the current store state: recomputed synchronously on every change (≈ms). */
export function useAnalysis(): Analysis {
  const risk = useDiagnosisStore((s) => s.risk);
  const evidence = useDiagnosisStore((s) => s.evidence);
  const mode = useDiagnosisStore((s) => s.mode);
  return useMemo(() => analyse(risk, evidence, mode), [risk, evidence, mode]);
}

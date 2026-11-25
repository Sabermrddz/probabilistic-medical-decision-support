"use client";

import { create } from "zustand";
import type { BodyRegion, Evidence, InferenceMode, Presence, RiskProfile } from "@/lib/inference";

export type AnalysisView = InferenceMode | "dempster";

interface DiagnosisState {
  step: 0 | 1 | 2;
  risk: RiskProfile;
  evidence: Record<string, Presence>;
  mode: InferenceMode;
  view: AnalysisView;
  region: BodyRegion | null;
  query: string;
  setStep: (s: 0 | 1 | 2) => void;
  setRisk: (factorId: string, levelId: string | null) => void;
  setSymptom: (id: string, state: Presence) => void;
  setMode: (m: InferenceMode) => void;
  setView: (v: AnalysisView) => void;
  setRegion: (r: BodyRegion | null) => void;
  setQuery: (q: string) => void;
  load: (risk: RiskProfile, evidence: Evidence) => void;
  reset: () => void;
}

export const useDiagnosisStore = create<DiagnosisState>((set) => ({
  step: 0,
  risk: {},
  evidence: {},
  mode: "naive",
  view: "naive",
  region: null,
  query: "",
  setStep: (step) => set({ step }),
  setRisk: (factorId, levelId) =>
    set((s) => {
      const risk = { ...s.risk };
      if (levelId === null) delete risk[factorId];
      else risk[factorId] = levelId;
      return { risk };
    }),
  setSymptom: (id, state) =>
    set((s) => {
      const evidence = { ...s.evidence };
      if (state === "unknown") delete evidence[id];
      else evidence[id] = state;
      return { evidence };
    }),
  setMode: (mode) => set({ mode, view: mode }),
  setView: (view) => set((s) => ({ view, mode: view === "dempster" ? s.mode : view })),
  setRegion: (region) => set({ region }),
  setQuery: (query) => set({ query }),
  load: (risk, evidence) => {
    const clean: Record<string, Presence> = {};
    for (const [k, v] of Object.entries(evidence)) if (v === "present" || v === "absent") clean[k] = v;
    set({ risk: { ...risk }, evidence: clean });
  },
  reset: () => set({ risk: {}, evidence: {}, step: 0, region: null, query: "" }),
}));

export type Presence = "present" | "absent" | "unknown";
export type InferenceMode = "naive" | "network";

/** symptomId -> state. Missing key is treated as "unknown". */
export type Evidence = Readonly<Partial<Record<string, Presence>>>;
/** riskFactorId -> levelId. Missing key means the factor is unobserved. */
export type RiskProfile = Readonly<Partial<Record<string, string>>>;

export interface SymptomContribution {
  symptomId: string;
  state: Exclude<Presence, "unknown">;
  /** P(obs | disease) / P(obs | not disease), alternatives weighted by the prior. */
  likelihoodRatio: number;
  /** ln(likelihoodRatio) */
  logLR: number;
  /** Change in ln-odds of the disease when this symptom is added last, given all other evidence. */
  marginalLogOdds: number;
}

export interface RankedDisease {
  id: string;
  name: string;
  prior: number;
  posterior: number;
}

export interface InferenceResult {
  mode: InferenceMode;
  prior: Record<string, number>;
  posterior: Record<string, number>;
  /** All diseases sorted by posterior, descending. */
  ranking: RankedDisease[];
  top5: RankedDisease[];
  /** diseaseId -> contribution of each observed symptom. */
  contributions: Record<string, SymptomContribution[]>;
  observedCount: number;
}

export interface BreakdownTerm {
  symptomId: string;
  state: "present" | "absent";
  /** P(S=state | D) */
  probability: number;
}

export interface BayesBreakdown {
  diseaseId: string;
  prior: number;
  terms: BreakdownTerm[];
  /** prior * prod(terms) */
  joint: number;
  /** P(E) = sum over diseases of the joint */
  evidenceProbability: number;
  posterior: number;
  /** Sequential updating: posterior of the disease after adding each symptom in order. */
  steps: { label: string; posterior: number }[];
}

export interface DSDiseaseResult {
  id: string;
  name: string;
  bel: number;
  pl: number;
  betP: number;
}

export interface DSSymptomMass {
  symptomId: string;
  state: "present" | "absent";
  /** disease ids in the focal set A */
  focal: string[];
  /** m(A) = weight, m(Theta) = 1 - weight */
  weight: number;
}

export interface DSResult {
  diseases: DSDiseaseResult[];
  /** Global conflict K accumulated across all combinations (Dempster normalisation). */
  conflict: number;
  /** Mass left on the whole frame (total ignorance). */
  ignorance: number;
  masses: DSSymptomMass[];
  /** true if evidence was totally contradictory (K = 1) and the result is vacuous */
  degenerate: boolean;
}

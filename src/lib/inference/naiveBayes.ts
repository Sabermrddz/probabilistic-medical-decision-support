import type { Model } from "./schema";
import type { Evidence, Presence, RiskProfile } from "./types";

export const EPS = 1e-9;

export const clampProb = (p: number): number => Math.min(1 - EPS, Math.max(EPS, p));

/** Numerically stable softmax over log-scores. */
export function softmax(logScores: readonly number[]): number[] {
  const max = Math.max(...logScores);
  if (!Number.isFinite(max)) return logScores.map(() => 1 / logScores.length);
  const exps = logScores.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/**
 * Naive Bayes over mutually exclusive, exhaustive classes, computed in log-space.
 *   P(c | e)  ∝  P(c) · Π_{observed s} P(s = obs | c)
 * Unknown symptoms contribute nothing (they are marginalised out, which multiplies by 1).
 *
 * @param priors     P(c) for each class
 * @param likelihood likelihood[c][s] = P(symptom s present | c)
 * @param observed   per-symptom state, aligned with the columns of `likelihood`
 */
export function naiveBayesCore(
  priors: readonly number[],
  likelihood: readonly (readonly number[])[],
  observed: readonly Presence[],
): number[] {
  const logScores = priors.map((prior, c) => {
    let score = Math.log(Math.max(prior, 1e-300));
    observed.forEach((state, s) => {
      if (state === "present") score += Math.log(clampProb(likelihood[c][s]));
      else if (state === "absent") score += Math.log(clampProb(1 - likelihood[c][s]));
    });
    return score;
  });
  return softmax(logScores);
}

export interface IndexedModel {
  diseaseIds: string[];
  symptomIds: string[];
  /** lik[d][s] = P(s present | d) */
  lik: number[][];
  basePrior: number[];
}

const cache = new WeakMap<Model, IndexedModel>();

export function indexModel(model: Model): IndexedModel {
  const hit = cache.get(model);
  if (hit) return hit;
  const diseaseIds = model.diseases.map((d) => d.id);
  const symptomIds = model.symptoms.map((s) => s.id);
  const indexed: IndexedModel = {
    diseaseIds,
    symptomIds,
    lik: diseaseIds.map((d) => symptomIds.map((s) => model.likelihoods[d][s].value)),
    basePrior: diseaseIds.map((d) => model.priors[d].value),
  };
  cache.set(model, indexed);
  return indexed;
}

export function observedVector(model: Model, evidence: Evidence): Presence[] {
  return model.symptoms.map((s) => evidence[s.id] ?? "unknown");
}

/**
 * Prior used by the naive-Bayes mode: base prior × product of the multipliers of the
 * *known* risk-factor levels (unknown factors contribute 1), renormalised.
 * Risk factors are treated as independent modifiers (no interactions).
 */
export function riskAdjustedPrior(model: Model, risk: RiskProfile): number[] {
  const { diseaseIds, basePrior } = indexModel(model);
  const raw = diseaseIds.map((d, i) => {
    let p = basePrior[i];
    for (const rf of model.riskFactors) {
      const level = risk[rf.id];
      if (!level) continue;
      p *= rf.multipliers[level]?.[d]?.value ?? 1;
    }
    return p;
  });
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((p) => p / sum);
}

export function naiveBayesPosterior(model: Model, risk: RiskProfile, evidence: Evidence) {
  const { lik } = indexModel(model);
  const prior = riskAdjustedPrior(model, risk);
  return { prior, posterior: naiveBayesCore(prior, lik, observedVector(model, evidence)) };
}

import { clampProb, indexModel } from "./naiveBayes";
import type { Model } from "./schema";
import type { DSResult, DSSymptomMass, Evidence } from "./types";

/**
 * Dempster–Shafer reasoning over the frame Θ = {the 11 disease classes}.
 * Subsets are bitmasks (bit i = disease i). Mass functions are sparse Maps.
 *
 * Each observed symptom becomes a SIMPLE SUPPORT function:  m(A) = w,  m(Θ) = 1 − w
 * where A = diseases that "explain" the observation (consistency ≥ 50 % of the best one) and
 * w measures how well A separates from its complement. This construction is a modelling
 * heuristic (documented in About), not something derived from data.
 */
type Mass = Map<number, number>;

const popcount = (x: number): number => {
  let c = 0;
  for (let v = x; v; v &= v - 1) c++;
  return c;
};

export const RELIABILITY = 0.9;

/** Build a simple-support function from per-disease consistency values in [0,1]. */
export function simpleSupport(consistency: readonly number[]): { mask: number; weight: number } {
  const n = consistency.length;
  const full = (1 << n) - 1;
  const max = Math.max(...consistency);
  if (max <= 0) return { mask: full, weight: 0 };
  let mask = 0;
  let inSum = 0;
  let inCount = 0;
  let outSum = 0;
  let outCount = 0;
  consistency.forEach((v, i) => {
    if (v >= 0.5 * max) {
      mask |= 1 << i;
      inSum += v;
      inCount++;
    } else {
      outSum += v;
      outCount++;
    }
  });
  if (outCount === 0) return { mask: full, weight: 0 };
  const separation = Math.max(0, 1 - outSum / outCount / (inSum / inCount));
  const weight = RELIABILITY * separation * Math.min(1, max / 0.5);
  return { mask, weight };
}

/** Dempster's conjunctive rule WITHOUT normalisation (mass on ∅ = conflict K is kept in key 0). */
function conjunctive(a: Mass, b: Mass): Mass {
  const out: Mass = new Map();
  for (const [x, mx] of a) {
    for (const [y, my] of b) {
      const k = x & y;
      out.set(k, (out.get(k) ?? 0) + mx * my);
    }
  }
  return out;
}

export function inferDempsterShafer(
  model: Model,
  evidence: Evidence,
  options: { prior?: readonly number[] } = {},
): DSResult {
  const { diseaseIds, symptomIds, lik } = indexModel(model);
  const n = diseaseIds.length;
  const full = (1 << n) - 1;

  let combined: Mass = new Map([[full, 1]]);
  const masses: DSSymptomMass[] = [];

  symptomIds.forEach((sid, s) => {
    const state = evidence[sid];
    if (state !== "present" && state !== "absent") return;
    const consistency = lik.map((row) => clampProb(state === "present" ? row[s] : 1 - row[s]));
    const { mask, weight } = simpleSupport(consistency);
    const m: Mass = new Map([[full, 1 - weight]]);
    if (weight > 0) m.set(mask, (m.get(mask) ?? 0) + weight);
    masses.push({
      symptomId: sid,
      state,
      weight,
      focal: diseaseIds.filter((_, i) => mask & (1 << i)),
    });
    combined = conjunctive(combined, m);
  });

  if (options.prior) {
    // A prior is a Bayesian mass function (all mass on singletons).
    const bayes: Mass = new Map(options.prior.map((p, i) => [1 << i, p] as const));
    combined = conjunctive(combined, bayes);
  }

  const K = combined.get(0) ?? 0;
  const degenerate = K > 1 - 1e-12;
  const norm = degenerate ? 1 : 1 - K;
  const normalised: Mass = new Map();
  if (degenerate) normalised.set(full, 1);
  else for (const [set, m] of combined) if (set !== 0) normalised.set(set, m / norm);

  const diseases = diseaseIds.map((id, i) => {
    const bit = 1 << i;
    let bel = 0;
    let pl = 0;
    let betP = 0;
    for (const [set, m] of normalised) {
      if (set === bit) bel += m;
      if (set & bit) {
        pl += m;
        betP += m / popcount(set);
      }
    }
    return { id, name: model.diseases[i].name, bel, pl, betP };
  });

  return {
    diseases,
    conflict: degenerate ? 1 : K,
    ignorance: normalised.get(full) ?? 0,
    masses,
    degenerate,
  };
}

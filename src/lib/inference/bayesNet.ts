import { indexModel, naiveBayesCore, observedVector, softmax } from "./naiveBayes";
import type { Model } from "./schema";
import type { Evidence, RiskProfile } from "./types";

/**
 * Bayesian network:   RiskFactor_1..6  →  Disease  →  Symptom_1..21
 *
 *  - Each risk factor is a root node with its own prior distribution.
 *  - Disease has all risk factors as parents. Its CPT P(D | parents) is a
 *    factored table (base prior × per-factor multipliers) PLUS explicit
 *    interaction terms, renormalised for each parent configuration.
 *  - Symptoms are children of Disease only (conditionally independent given D).
 *
 * Inference by enumeration: sum the joint over every configuration of the
 * *unobserved* parents. Unobserved symptoms are leaf nodes and sum to 1, so they vanish.
 */
interface NetConfig {
  levels: string[];
  /** P(parents = this configuration) */
  pConfig: number;
  /** P(D | parents = this configuration), aligned with model.diseases */
  cpt: number[];
}

const cache = new WeakMap<Model, NetConfig[]>();

/** CPT column P(D | parents) for a full parent configuration (factor id -> level id). */
export function diseaseCpt(model: Model, config: Readonly<Record<string, string>>): number[] {
  const { diseaseIds, basePrior } = indexModel(model);
  const raw = diseaseIds.map((d, i) => {
    let p = basePrior[i];
    for (const rf of model.riskFactors) p *= rf.multipliers[config[rf.id]]?.[d]?.value ?? 1;
    for (const it of model.interactions) {
      if (Object.entries(it.when).every(([f, l]) => config[f] === l)) p *= it.multipliers[d]?.value ?? 1;
    }
    return p;
  });
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((p) => p / sum);
}

function buildConfigs(model: Model): NetConfig[] {
  const hit = cache.get(model);
  if (hit) return hit;
  const out: NetConfig[] = [];
  const walk = (i: number, levels: string[], p: number) => {
    if (i === model.riskFactors.length) {
      const config = Object.fromEntries(model.riskFactors.map((rf, k) => [rf.id, levels[k]]));
      out.push({ levels: [...levels], pConfig: p, cpt: diseaseCpt(model, config) });
      return;
    }
    const rf = model.riskFactors[i];
    for (const lv of rf.levels) walk(i + 1, [...levels, lv.id], p * rf.distribution[lv.id].value);
  };
  walk(0, [], 1);
  cache.set(model, out);
  return out;
}

export function networkPosterior(model: Model, risk: RiskProfile, evidence: Evidence) {
  const { lik } = indexModel(model);
  const configs = buildConfigs(model);
  const obs = observedVector(model, evidence);

  // log-likelihood of the evidence under each disease (independent of the parents)
  const logL = lik.map((row) =>
    obs.reduce((acc, state, s) => {
      if (state === "present") return acc + Math.log(Math.max(row[s], 1e-9));
      if (state === "absent") return acc + Math.log(Math.max(1 - row[s], 1e-9));
      return acc;
    }, 0),
  );
  const maxLogL = Math.max(...logL);
  const L = logL.map((l) => Math.exp(l - maxLogL));

  const prior = new Array<number>(lik.length).fill(0);
  const joint = new Array<number>(lik.length).fill(0);
  for (const cfg of configs) {
    const consistent = model.riskFactors.every((rf, k) => !risk[rf.id] || risk[rf.id] === cfg.levels[k]);
    if (!consistent) continue;
    for (let d = 0; d < lik.length; d++) {
      const w = cfg.pConfig * cfg.cpt[d];
      prior[d] += w;
      joint[d] += w * L[d];
    }
  }
  const norm = (v: number[]) => {
    const s = v.reduce((a, b) => a + b, 0);
    return v.map((x) => x / s);
  };
  return { prior: norm(prior), posterior: norm(joint) };
}

/** Sanity helper used in tests: network posterior must equal naive Bayes when its prior is plugged in. */
export function posteriorGivenPrior(model: Model, prior: number[], evidence: Evidence): number[] {
  return naiveBayesCore(prior, indexModel(model).lik, observedVector(model, evidence));
}

export { softmax };

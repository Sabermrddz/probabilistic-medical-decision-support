import { networkPosterior } from "./bayesNet";
import { clampProb, indexModel, naiveBayesCore, naiveBayesPosterior, observedVector } from "./naiveBayes";
import type { Model } from "./schema";
import type {
  BayesBreakdown,
  Evidence,
  InferenceMode,
  InferenceResult,
  RiskProfile,
  SymptomContribution,
} from "./types";

export interface InferenceInput {
  mode: InferenceMode;
  risk: RiskProfile;
  evidence: Evidence;
}

function posteriorFor(model: Model, input: InferenceInput, evidence: Evidence) {
  return input.mode === "network"
    ? networkPosterior(model, input.risk, evidence)
    : naiveBayesPosterior(model, input.risk, evidence);
}

const logit = (p: number): number => {
  const q = clampProb(p);
  return Math.log(q / (1 - q));
};

/**
 * Full query: posterior, prior, per-symptom contributions and ranking.
 * Works for both "naive" (naive Bayes) and "network" (Bayesian network) modes.
 */
export function infer(model: Model, input: InferenceInput): InferenceResult {
  const { diseaseIds, symptomIds, lik } = indexModel(model);
  const { prior, posterior } = posteriorFor(model, input, input.evidence);

  const observed = symptomIds
    .map((sid, s) => ({ sid, s, state: input.evidence[sid] }))
    .filter((o): o is { sid: string; s: number; state: "present" | "absent" } => o.state === "present" || o.state === "absent");

  // leave-one-out posteriors (symptom i removed) for exact marginal log-odds
  const without = observed.map((o) => posteriorFor(model, input, { ...input.evidence, [o.sid]: "unknown" }).posterior);

  const contributions: Record<string, SymptomContribution[]> = {};
  diseaseIds.forEach((d, di) => {
    contributions[d] = observed.map((o, k) => {
      const value = (i: number) => (o.state === "present" ? lik[i][o.s] : 1 - lik[i][o.s]);
      let alt = 0;
      let altMass = 0;
      lik.forEach((_, i) => {
        if (i !== di) {
          alt += prior[i] * value(i);
          altMass += prior[i];
        }
      });
      const likelihoodRatio = clampProb(value(di)) / clampProb(alt / Math.max(altMass, 1e-12));
      return {
        symptomId: o.sid,
        state: o.state,
        likelihoodRatio,
        logLR: Math.log(likelihoodRatio),
        marginalLogOdds: logit(posterior[di]) - logit(without[k][di]),
      };
    });
  });

  const ranking = model.diseases
    .map((dis, i) => ({ id: dis.id, name: dis.name, prior: prior[i], posterior: posterior[i] }))
    .sort((a, b) => b.posterior - a.posterior);

  return {
    mode: input.mode,
    prior: Object.fromEntries(diseaseIds.map((d, i) => [d, prior[i]])),
    posterior: Object.fromEntries(diseaseIds.map((d, i) => [d, posterior[i]])),
    ranking,
    top5: ranking.slice(0, 5),
    contributions,
    observedCount: observed.length,
  };
}

/** Step-by-step Bayes calculation for one disease, using the (mode-specific) prior in `result`. */
export function bayesBreakdown(
  model: Model,
  result: InferenceResult,
  evidence: Evidence,
  diseaseId: string,
): BayesBreakdown {
  const { diseaseIds, symptomIds, lik } = indexModel(model);
  const di = diseaseIds.indexOf(diseaseId);
  const prior = diseaseIds.map((d) => result.prior[d]);

  const terms = symptomIds.flatMap((sid, s) => {
    const state = evidence[sid];
    if (state !== "present" && state !== "absent") return [];
    return [{ symptomId: sid, state, probability: state === "present" ? lik[di][s] : 1 - lik[di][s] }];
  });

  const joints = diseaseIds.map((_, i) => {
    let j = prior[i];
    symptomIds.forEach((sid, s) => {
      const st = evidence[sid];
      if (st === "present") j *= lik[i][s];
      else if (st === "absent") j *= 1 - lik[i][s];
    });
    return j;
  });
  const evidenceProbability = joints.reduce((a, b) => a + b, 0);

  // sequential Bayesian updating, in the order the user entered the evidence
  const steps: BayesBreakdown["steps"] = [{ label: "Prior", posterior: prior[di] }];
  const partial: Record<string, "present" | "absent"> = {};
  for (const t of terms) {
    partial[t.symptomId] = t.state;
    const post = naiveBayesCore(prior, lik, observedVector(model, partial));
    steps.push({ label: `${t.state === "present" ? "+" : "−"} ${t.symptomId}`, posterior: post[di] });
  }

  return {
    diseaseId,
    prior: prior[di],
    terms,
    joint: joints[di],
    evidenceProbability,
    posterior: joints[di] / evidenceProbability,
    steps,
  };
}

/** Per-disease difference (network − naive) in posterior probability. */
export function compareModes(naive: InferenceResult, network: InferenceResult) {
  return naive.ranking.map((r) => ({
    id: r.id,
    name: r.name,
    naive: r.posterior,
    network: network.posterior[r.id],
    delta: network.posterior[r.id] - r.posterior,
  }));
}

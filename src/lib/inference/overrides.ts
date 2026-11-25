import type { Model } from "./schema";

export interface ModelOverrides {
  /** diseaseId -> factor multiplying the base prior (renormalisation happens at inference). */
  priorScale?: Readonly<Record<string, number>>;
  /** Replace one P(symptom | disease). */
  likelihood?: { diseaseId: string; symptomId: string; value: number };
}

/** Return a new model with sensitivity-analysis overrides applied (original untouched). */
export function withOverrides(model: Model, o: ModelOverrides): Model {
  const priors = Object.fromEntries(
    Object.entries(model.priors).map(([id, p]) => [id, { ...p, value: p.value * (o.priorScale?.[id] ?? 1) }]),
  );
  const sum = Object.values(priors).reduce((a, p) => a + p.value, 0);
  for (const id of Object.keys(priors)) priors[id] = { ...priors[id], value: priors[id].value / sum };

  const likelihoods = { ...model.likelihoods };
  if (o.likelihood) {
    const { diseaseId, symptomId, value } = o.likelihood;
    likelihoods[diseaseId] = {
      ...likelihoods[diseaseId],
      [symptomId]: { ...likelihoods[diseaseId][symptomId], value, isAssumed: true },
    };
  }
  return { ...model, priors, likelihoods };
}

export function dataStatus(model: Model) {
  const cells = Object.values(model.likelihoods).flatMap((row) => Object.values(row));
  const all = [
    ...cells,
    ...Object.values(model.priors),
    ...model.riskFactors.flatMap((rf) => Object.values(rf.multipliers).flatMap((m) => Object.values(m))),
  ];
  const assumed = all.filter((x) => x.isAssumed).length;
  return {
    total: all.length,
    assumed,
    sourced: all.length - assumed,
    likelihoodTotal: cells.length,
    likelihoodSourced: cells.filter((c) => !c.isAssumed).length,
    assumedShare: assumed / all.length,
  };
}

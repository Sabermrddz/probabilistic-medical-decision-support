import { z } from "zod";

/** A probability with provenance. `isAssumed` must be true for anything not backed by a cited source. */
export const probabilitySchema = z.object({
  value: z.number().min(0).max(1),
  source: z.string().min(1),
  isAssumed: z.boolean(),
});

/** A strictly positive multiplier (odds-style) with provenance. */
export const multiplierSchema = z.object({
  value: z.number().positive(),
  source: z.string().min(1),
  isAssumed: z.boolean(),
});

export const diseaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  confirmatoryTest: z.string(),
  redFlag: z.boolean(),
  isOther: z.boolean(),
});

export const symptomSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  system: z.string().min(1),
  regions: z.array(z.enum(["head", "throat", "chest", "abdomen", "body"])),
  description: z.string(),
});

const multiplierMap = z.record(z.string(), multiplierSchema);

export const riskFactorSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string(),
  levels: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(2),
  /** Prior distribution of the factor itself (parent-node prior in the Bayesian network). */
  distribution: z.record(z.string(), probabilitySchema),
  /** level id -> disease id -> multiplier on the disease prior odds. Missing = 1. */
  multipliers: z.record(z.string(), multiplierMap),
});

export const interactionSchema = z.object({
  id: z.string().min(1),
  description: z.string(),
  when: z.record(z.string(), z.string()),
  multipliers: multiplierMap,
});

export const modelSchema = z
  .object({
    version: z.string(),
    title: z.string(),
    disclaimer: z.string(),
    diseases: z.array(diseaseSchema).length(11),
    symptoms: z.array(symptomSchema).min(20),
    priors: z.record(z.string(), probabilitySchema),
    likelihoods: z.record(z.string(), z.record(z.string(), probabilitySchema)),
    riskFactors: z.array(riskFactorSchema).min(5),
    interactions: z.array(interactionSchema),
  })
  .superRefine((m, ctx) => {
    const dIds = new Set(m.diseases.map((d) => d.id));
    const sIds = new Set(m.symptoms.map((s) => s.id));
    const sum = Object.values(m.priors).reduce((a, p) => a + p.value, 0);
    if (Math.abs(sum - 1) > 1e-3) ctx.addIssue({ code: "custom", message: `Priors must sum to 1 (got ${sum})` });
    if (m.diseases.filter((d) => d.isOther).length !== 1)
      ctx.addIssue({ code: "custom", message: "Exactly one 'other' class is required" });
    for (const d of dIds) {
      if (!(d in m.priors)) ctx.addIssue({ code: "custom", message: `Missing prior for ${d}` });
      for (const s of sIds)
        if (!m.likelihoods[d]?.[s]) ctx.addIssue({ code: "custom", message: `Missing P(${s}|${d})` });
    }
    for (const rf of m.riskFactors) {
      const lv = new Set(rf.levels.map((l) => l.id));
      const dsum = Object.values(rf.distribution).reduce((a, p) => a + p.value, 0);
      if (Math.abs(dsum - 1) > 1e-3) ctx.addIssue({ code: "custom", message: `Distribution of ${rf.id} must sum to 1` });
      for (const l of lv) if (!(l in rf.multipliers) || !(l in rf.distribution))
        ctx.addIssue({ code: "custom", message: `Risk factor ${rf.id} incomplete for level ${l}` });
      for (const map of Object.values(rf.multipliers))
        for (const d of Object.keys(map)) if (!dIds.has(d)) ctx.addIssue({ code: "custom", message: `Unknown disease ${d}` });
    }
  });

export type Probability = z.infer<typeof probabilitySchema>;
export type Disease = z.infer<typeof diseaseSchema>;
export type Symptom = z.infer<typeof symptomSchema>;
export type RiskFactor = z.infer<typeof riskFactorSchema>;
export type Interaction = z.infer<typeof interactionSchema>;
export type Model = z.infer<typeof modelSchema>;
export type BodyRegion = Symptom["regions"][number];

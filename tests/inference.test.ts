import { describe, expect, it } from "vitest";
import { model } from "../src/data/model";
import {
  bayesBreakdown,
  compareModes,
  dataStatus,
  decide,
  expectedInformationGain,
  infer,
  inferDempsterShafer,
  naiveBayesCore,
  networkPosterior,
  riskAdjustedPrior,
  simpleSupport,
  suggestNextQuestions,
  withOverrides,
  modelSchema,
  type Evidence,
  type RiskProfile,
} from "../src/lib/inference";

const sum = (v: readonly number[]) => v.reduce((a, b) => a + b, 0);
const NO_RISK: RiskProfile = {};
const FLU_EVIDENCE: Evidence = { fever: "present", cough: "present", muscle_aches: "present", fatigue: "present" };

describe("naiveBayesCore: hand-computed cases", () => {
  // classes: [Flu, not Flu]; symptoms: [fever, cough]
  const priors = [0.1, 0.9];
  const lik = [
    [0.8, 0.7],
    [0.1, 0.2],
  ];

  it("P(Flu | fever, cough) = 0.7568 (spec example)", () => {
    const post = naiveBayesCore(priors, lik, ["present", "present"]);
    // 0.1*0.8*0.7 = 0.056 ; 0.9*0.1*0.2 = 0.018 ; 0.056 / 0.074
    expect(post[0]).toBeCloseTo(0.7568, 4);
    expect(post[0]).toBeCloseTo(0.056 / 0.074, 10);
  });

  it("handles an absent symptom: P(Flu | no fever) = 0.02 / 0.83", () => {
    const post = naiveBayesCore(priors, lik, ["absent", "unknown"]);
    expect(post[0]).toBeCloseTo(0.02 / 0.83, 10);
  });

  it("mixed present/absent: fever present, cough absent", () => {
    // Flu: 0.1*0.8*0.3 = 0.024 ; not: 0.9*0.1*0.8 = 0.072 -> 0.25
    expect(naiveBayesCore(priors, lik, ["present", "absent"])[0]).toBeCloseTo(0.25, 10);
  });

  it("three-class example", () => {
    const post = naiveBayesCore([0.5, 0.3, 0.2], [[0.9], [0.5], [0.1]], ["present"]);
    expect(post[0]).toBeCloseTo(0.45 / 0.62, 10);
    expect(post[1]).toBeCloseTo(0.15 / 0.62, 10);
    expect(post[2]).toBeCloseTo(0.02 / 0.62, 10);
  });

  it("Unknown changes nothing", () => {
    const base = naiveBayesCore(priors, lik, ["present", "unknown"]);
    const same = naiveBayesCore(priors.slice(), [[0.8], [0.1]], ["present"]);
    expect(base[0]).toBeCloseTo(same[0], 12);
    expect(naiveBayesCore(priors, lik, ["unknown", "unknown"])[0]).toBeCloseTo(0.1, 12);
  });

  it("stays finite in log-space with hundreds of symptoms (no underflow)", () => {
    const n = 800;
    const l = [Array(n).fill(0.05), Array(n).fill(0.04)];
    const post = naiveBayesCore([0.5, 0.5], l, Array(n).fill("present"));
    expect(Number.isFinite(post[0])).toBe(true);
    expect(sum(post)).toBeCloseTo(1, 12);
    expect(post[0]).toBeGreaterThan(0.999);
  });
});

describe("full model: invariants", () => {
  it("model.json passes the Zod schema with 11 classes and ≥ 20 symptoms", () => {
    expect(modelSchema.safeParse(model).success).toBe(true);
    expect(model.diseases).toHaveLength(11);
    expect(model.symptoms.length).toBeGreaterThanOrEqual(20);
    expect(model.riskFactors.length).toBeGreaterThanOrEqual(5);
  });

  it("posteriors and priors sum to 1 in both modes for many evidence patterns", () => {
    const states = ["present", "absent", "unknown"] as const;
    for (const mode of ["naive", "network"] as const) {
      for (let seed = 0; seed < 40; seed++) {
        const evidence: Record<string, (typeof states)[number]> = {};
        model.symptoms.forEach((s, i) => (evidence[s.id] = states[(seed * 7 + i * 3 + (i % 5)) % 3]));
        const risk: RiskProfile = seed % 2 ? { age: "older", season: "winter" } : {};
        const r = infer(model, { mode, risk, evidence });
        expect(sum(Object.values(r.posterior))).toBeCloseTo(1, 10);
        expect(sum(Object.values(r.prior))).toBeCloseTo(1, 10);
        expect(r.top5).toHaveLength(5);
        for (let i = 1; i < r.ranking.length; i++) expect(r.ranking[i - 1].posterior).toBeGreaterThanOrEqual(r.ranking[i].posterior);
      }
    }
  });

  it("with no evidence the posterior equals the prior", () => {
    const r = infer(model, { mode: "naive", risk: { season: "winter" }, evidence: {} });
    for (const d of model.diseases) expect(r.posterior[d.id]).toBeCloseTo(r.prior[d.id], 12);
  });

  it("explicit Unknown is identical to omitting the symptom", () => {
    const a = infer(model, { mode: "naive", risk: NO_RISK, evidence: FLU_EVIDENCE });
    const b = infer(model, { mode: "naive", risk: NO_RISK, evidence: { ...FLU_EVIDENCE, sneezing: "unknown", nausea: "unknown", loss_of_smell: "unknown" } });
    for (const d of model.diseases) expect(b.posterior[d.id]).toBeCloseTo(a.posterior[d.id], 12);
  });

  it("classic influenza picture ranks influenza first, in winter more strongly", () => {
    const base = infer(model, { mode: "naive", risk: NO_RISK, evidence: FLU_EVIDENCE });
    const winter = infer(model, { mode: "naive", risk: { season: "winter", vaccinated: "no" }, evidence: FLU_EVIDENCE });
    expect(base.ranking[0].id).toBe("flu");
    expect(winter.posterior.flu).toBeGreaterThan(base.posterior.flu);
  });

  it("risk multipliers: hand-check of the adjusted prior", () => {
    const risk: RiskProfile = { season: "winter" };
    const raw = model.diseases.map((d) => model.priors[d.id].value * (model.riskFactors.find((r) => r.id === "season")!.multipliers.winter[d.id]?.value ?? 1));
    const expected = raw.map((x) => x / sum(raw));
    const got = riskAdjustedPrior(model, risk);
    got.forEach((p, i) => expect(p).toBeCloseTo(expected[i], 12));
  });

  it("contributions: present fever has LR > 1 for influenza and < 1 for allergic rhinitis", () => {
    const r = infer(model, { mode: "naive", risk: NO_RISK, evidence: { fever: "present" } });
    expect(r.contributions.flu[0].likelihoodRatio).toBeGreaterThan(1);
    expect(r.contributions.allergy[0].likelihoodRatio).toBeLessThan(1);
    // with a single symptom, leave-one-out log-odds = log-odds shift from prior to posterior
    const logit = (p: number) => Math.log(p / (1 - p));
    expect(r.contributions.flu[0].marginalLogOdds).toBeCloseTo(logit(r.posterior.flu) - logit(r.prior.flu), 8);
  });

  it("Bayes breakdown reproduces the engine posterior", () => {
    const r = infer(model, { mode: "naive", risk: NO_RISK, evidence: FLU_EVIDENCE });
    const b = bayesBreakdown(model, r, FLU_EVIDENCE, "flu");
    expect(b.posterior).toBeCloseTo(r.posterior.flu, 12);
    expect(b.steps).toHaveLength(5);
    expect(b.steps[b.steps.length - 1].posterior).toBeCloseTo(r.posterior.flu, 12);
  });
});

describe("Bayesian network (enumeration)", () => {
  const plain: RiskProfile = { age: "adult", smoker: "no", vaccinated: "yes", season: "spring", bmi: "normal", family: "none" };

  it("equals naive Bayes when all parents are observed and no interaction fires", () => {
    const n = infer(model, { mode: "naive", risk: plain, evidence: FLU_EVIDENCE });
    const b = infer(model, { mode: "network", risk: plain, evidence: FLU_EVIDENCE });
    for (const d of model.diseases) expect(b.posterior[d.id]).toBeCloseTo(n.posterior[d.id], 10);
  });

  it("differs when an interaction fires (older smoker → bronchitis/pneumonia)", () => {
    const risk: RiskProfile = { ...plain, age: "older", smoker: "yes" };
    const ev: Evidence = { cough: "present" };
    const n = infer(model, { mode: "naive", risk, evidence: ev });
    const b = infer(model, { mode: "network", risk, evidence: ev });
    expect(b.posterior.bronch).toBeGreaterThan(n.posterior.bronch);
    const rows = compareModes(n, b);
    expect(sum(rows.map((r) => r.delta))).toBeCloseTo(0, 10);
  });

  it("marginalises unobserved parents: unknown risk uses parent priors, not a multiplier of 1", () => {
    const r = networkPosterior(model, {}, {});
    expect(sum(r.prior)).toBeCloseTo(1, 12);
    const naive = riskAdjustedPrior(model, {});
    // the marginal prior is a *different* distribution than the plain base prior
    expect(r.prior.some((p, i) => Math.abs(p - naive[i]) > 1e-4)).toBe(true);
  });
});

describe("Dempster–Shafer", () => {
  it("simple support: separates explaining diseases from the rest", () => {
    const { mask, weight } = simpleSupport([0.9, 0.8, 0.05, 0.02]);
    expect(mask).toBe(0b0011);
    expect(weight).toBeGreaterThan(0.7);
    expect(weight).toBeLessThanOrEqual(0.9);
  });

  it("an uninformative symptom (equal consistency) gives zero support", () => {
    expect(simpleSupport([0.3, 0.3, 0.3]).weight).toBe(0);
  });

  it("no evidence → vacuous: Bel = 0, Pl = 1, K = 0", () => {
    const r = inferDempsterShafer(model, {});
    expect(r.conflict).toBe(0);
    for (const d of r.diseases) {
      expect(d.bel).toBeCloseTo(0, 12);
      expect(d.pl).toBeCloseTo(1, 12);
    }
  });

  it("Bel ≤ BetP ≤ Pl, BetP sums to 1, K in [0,1]", () => {
    const r = inferDempsterShafer(model, { ...FLU_EVIDENCE, loss_of_smell: "present", itchy_eyes: "absent", sore_throat: "present" });
    expect(sum(r.diseases.map((d) => d.betP))).toBeCloseTo(1, 10);
    for (const d of r.diseases) {
      expect(d.bel).toBeLessThanOrEqual(d.betP + 1e-12);
      expect(d.betP).toBeLessThanOrEqual(d.pl + 1e-12);
    }
    expect(r.conflict).toBeGreaterThanOrEqual(0);
    expect(r.conflict).toBeLessThanOrEqual(1);
    expect(r.masses.length).toBe(7);
  });

  it("conflicting evidence yields K > 0", () => {
    const r = inferDempsterShafer(model, { itchy_eyes: "present", fever: "present", diarrhea: "present", excessive_thirst: "present" });
    expect(r.conflict).toBeGreaterThan(0);
  });
});

describe("information gain & decision support", () => {
  it("EIG: perfectly discriminating test on a 50/50 pair = 1 bit; useless test = 0 bits", () => {
    expect(expectedInformationGain([0.5, 0.5], [1, 0])).toBeCloseTo(1, 10);
    expect(expectedInformationGain([0.5, 0.5], [0.3, 0.3])).toBeCloseTo(0, 10);
  });

  it("suggested question is unknown, discriminates the top two, and has non-negative gain", () => {
    const ev: Evidence = { fever: "present", cough: "present" };
    const r = infer(model, { mode: "naive", risk: NO_RISK, evidence: ev });
    const q = suggestNextQuestions(model, r.posterior, ev, 3);
    expect(q).toHaveLength(3);
    for (const x of q) {
      expect(ev[x.symptomId]).toBeUndefined();
      expect(x.gainTop2).toBeGreaterThanOrEqual(0);
    }
    expect(q[0].gainTop2).toBeGreaterThanOrEqual(q[1].gainTop2);
  });

  it("red flag: breathlessness + chest pain → urgent", () => {
    const ev: Evidence = { shortness_of_breath: "present", chest_pain: "present" };
    const r = infer(model, { mode: "naive", risk: NO_RISK, evidence: ev });
    expect(decide(model, r, ev).level).toBe("urgent");
  });

  it("high posterior (> 0.7) recommends a confirmatory test; empty evidence says add symptoms", () => {
    const ev: Evidence = { excessive_thirst: "present", frequent_urination: "present", blurred_vision: "present", fever: "absent", cough: "absent" };
    const r = infer(model, { mode: "naive", risk: { bmi: "obese", family: "diabetes", age: "older" }, evidence: ev });
    expect(r.ranking[0].id).toBe("t2d");
    expect(decide(model, r, ev).level).toBe("test");
    expect(decide(model, infer(model, { mode: "naive", risk: NO_RISK, evidence: {} }), {}).level).toBe("none");
  });
});

describe("overrides & data status", () => {
  it("doubling a prior raises that posterior; renormalises", () => {
    const m2 = withOverrides(model, { priorScale: { strep: 2 } });
    expect(sum(Object.values(m2.priors).map((p) => p.value))).toBeCloseTo(1, 12);
    const a = infer(model, { mode: "naive", risk: NO_RISK, evidence: { sore_throat: "present" } });
    const b = infer(m2, { mode: "naive", risk: NO_RISK, evidence: { sore_throat: "present" } });
    expect(b.posterior.strep).toBeGreaterThan(a.posterior.strep);
  });

  it("likelihood override is flagged as assumed and moves the posterior", () => {
    const m2 = withOverrides(model, { likelihood: { diseaseId: "flu", symptomId: "fever", value: 0.99 } });
    expect(m2.likelihoods.flu.fever.isAssumed).toBe(true);
    const a = infer(model, { mode: "naive", risk: NO_RISK, evidence: { fever: "present" } });
    const b = infer(m2, { mode: "naive", risk: NO_RISK, evidence: { fever: "present" } });
    expect(b.posterior.flu).toBeGreaterThan(a.posterior.flu);
  });

  it("data status counts sourced vs assumed honestly", () => {
    const s = dataStatus(model);
    expect(s.assumed + s.sourced).toBe(s.total);
    expect(s.likelihoodTotal).toBe(11 * model.symptoms.length);
    expect(s.assumedShare).toBeGreaterThan(0.8);
  });
});

import type { Model } from "./schema";
import type { Evidence, InferenceResult } from "./types";

/** Decision thresholds (documented in About). Illustrative, not clinically validated. */
export const THRESHOLDS = {
  /** top posterior above which a confirmatory test is suggested */
  test: 0.7,
  /** pneumonia posterior above which urgent assessment is advised */
  pneumoniaUrgent: 0.3,
  /** posterior below which the result is labelled low confidence */
  low: 0.4,
} as const;

export type DecisionLevel = "none" | "urgent" | "test" | "clinician" | "monitor";
export type Confidence = "high" | "moderate" | "low";

export interface RedFlag {
  id: string;
  title: string;
  detail: string;
}

export interface Decision {
  level: DecisionLevel;
  headline: string;
  advice: string[];
  redFlags: RedFlag[];
  suggestedTest: string | null;
  confidence: Confidence;
}

export const confidenceOf = (p: number): Confidence => (p >= THRESHOLDS.test ? "high" : p >= THRESHOLDS.low ? "moderate" : "low");

const is = (e: Evidence, id: string) => e[id] === "present";

/** Rule-based red flags. They are independent of the probabilistic model on purpose. */
export function detectRedFlags(model: Model, result: InferenceResult, evidence: Evidence): RedFlag[] {
  const flags: RedFlag[] = [];
  if (is(evidence, "shortness_of_breath") && is(evidence, "chest_pain"))
    flags.push({ id: "cardiorespiratory", title: "Breathlessness with chest pain", detail: "This combination can indicate a heart or lung emergency." });
  if ((result.posterior.pneum ?? 0) >= THRESHOLDS.pneumoniaUrgent && is(evidence, "shortness_of_breath"))
    flags.push({ id: "pneumonia", title: "Possible pneumonia with breathlessness", detail: "Pneumonia is plausible and breathing difficulty needs prompt in-person assessment." });
  if (is(evidence, "fever") && is(evidence, "headache") && is(evidence, "light_sensitivity"))
    flags.push({ id: "meningitis", title: "Fever + headache + light sensitivity", detail: "Meningitis is NOT modelled here but shares these signs; seek urgent assessment, especially with a stiff neck or rash." });
  if (is(evidence, "excessive_thirst") && is(evidence, "frequent_urination") && (is(evidence, "vomiting") || is(evidence, "abdominal_pain")))
    flags.push({ id: "dka", title: "Thirst, urination and vomiting / abdominal pain", detail: "Possible diabetic ketoacidosis, which needs emergency care." });
  return flags;
}

export function decide(model: Model, result: InferenceResult, evidence: Evidence): Decision {
  const top = result.ranking[0];
  const topDisease = model.diseases.find((d) => d.id === top.id);
  const redFlags = detectRedFlags(model, result, evidence);
  const confidence = confidenceOf(top.posterior);

  if (result.observedCount === 0 && redFlags.length === 0) {
    return { level: "none", headline: "Add symptoms to get a result", advice: ["Mark each symptom as present or absent. Unknown symptoms are simply ignored."], redFlags, suggestedTest: null, confidence };
  }
  if (redFlags.length > 0) {
    return {
      level: "urgent",
      headline: "Seek urgent medical care",
      advice: ["A red-flag pattern was detected. Contact emergency services or an urgent-care clinic now; do not wait for this tool."],
      redFlags,
      suggestedTest: topDisease?.confirmatoryTest ?? null,
      confidence,
    };
  }
  const clinicalOnly = !!topDisease && /^(usually )?clinical|no test/i.test(topDisease.confirmatoryTest);
  if (topDisease && !topDisease.isOther && top.posterior >= THRESHOLDS.test && clinicalOnly) {
    return {
      level: "monitor",
      headline: `Most consistent with ${top.name}`,
      advice: [
        `Posterior ${(top.posterior * 100).toFixed(0)}% is above the ${(THRESHOLDS.test * 100).toFixed(0)}% threshold, but this condition is normally diagnosed clinically: no confirmatory test is usually needed.`,
        "Self-care is usually enough; see a clinician if symptoms persist or worsen.",
      ],
      redFlags,
      suggestedTest: null,
      confidence,
    };
  }
  if (topDisease && !topDisease.isOther && top.posterior >= THRESHOLDS.test) {
    return {
      level: "test",
      headline: `Consider a confirmatory test for ${top.name}`,
      advice: [`Posterior ${(top.posterior * 100).toFixed(0)}% exceeds the ${(THRESHOLDS.test * 100).toFixed(0)}% testing threshold.`, "Discuss the result with a healthcare professional."],
      redFlags,
      suggestedTest: topDisease.confirmatoryTest,
      confidence,
    };
  }
  if (topDisease?.isOther && top.posterior >= 0.5) {
    return { level: "clinician", headline: "Pattern is not typical of the modelled diseases", advice: ["Seek a clinician's opinion if symptoms persist or worsen."], redFlags, suggestedTest: null, confidence };
  }
  return {
    level: "monitor",
    headline: "Inconclusive: gather more information",
    advice: ["No disease is dominant. Answer the suggested next question, monitor symptoms and see a clinician if they persist or worsen."],
    redFlags,
    suggestedTest: null,
    confidence,
  };
}

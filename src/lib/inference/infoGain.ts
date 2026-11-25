import { indexModel } from "./naiveBayes";
import type { Model } from "./schema";
import type { Evidence } from "./types";

export interface NextQuestion {
  symptomId: string;
  /** Expected information gain (bits) about "which of the top two diseases is it?" */
  gainTop2: number;
  /** Expected information gain (bits) over the full disease distribution. */
  gainAll: number;
  topDiseaseId: string;
  runnerUpId: string;
  pTop: number;
  pRunnerUp: number;
}

const entropy = (dist: readonly number[]): number =>
  -dist.reduce((a, p) => (p > 1e-12 ? a + p * Math.log2(p) : a), 0);

/** H(D) − E_o[H(D | S=o)] for a distribution over classes and per-class P(S present). */
export function expectedInformationGain(dist: readonly number[], pPresent: readonly number[]): number {
  const total = dist.reduce((a, b) => a + b, 0);
  const d = dist.map((p) => p / total);
  const pYes = d.reduce((a, p, i) => a + p * pPresent[i], 0);
  const pNo = 1 - pYes;
  const post = (yes: boolean) => {
    const w = d.map((p, i) => p * (yes ? pPresent[i] : 1 - pPresent[i]));
    const s = w.reduce((a, b) => a + b, 0);
    return w.map((x) => x / s);
  };
  let expected = 0;
  if (pYes > 1e-12) expected += pYes * entropy(post(true));
  if (pNo > 1e-12) expected += pNo * entropy(post(false));
  return Math.max(0, entropy(d) - expected);
}

/** Rank still-unknown symptoms by how well they separate the two currently leading diseases. */
export function suggestNextQuestions(
  model: Model,
  posterior: Readonly<Record<string, number>>,
  evidence: Evidence,
  topN = 3,
): NextQuestion[] {
  const { diseaseIds, symptomIds, lik } = indexModel(model);
  const order = [...diseaseIds.keys()].sort((a, b) => posterior[diseaseIds[b]] - posterior[diseaseIds[a]]);
  const [i1, i2] = order;
  const full = diseaseIds.map((id) => posterior[id]);
  const questions: NextQuestion[] = [];
  symptomIds.forEach((sid, s) => {
    const st = evidence[sid];
    if (st === "present" || st === "absent") return;
    const column = lik.map((row) => row[s]);
    questions.push({
      symptomId: sid,
      gainTop2: expectedInformationGain([full[i1], full[i2]], [column[i1], column[i2]]),
      gainAll: expectedInformationGain(full, column),
      topDiseaseId: diseaseIds[i1],
      runnerUpId: diseaseIds[i2],
      pTop: column[i1],
      pRunnerUp: column[i2],
    });
  });
  return questions.sort((a, b) => b.gainTop2 - a.gainTop2 || b.gainAll - a.gainAll).slice(0, topN);
}

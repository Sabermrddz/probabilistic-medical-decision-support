import type { Evidence, RiskProfile } from "@/lib/inference";

export interface TestPatient {
  id: string;
  name: string;
  kind: "Mild" | "Classic" | "Ambiguous";
  summary: string;
  risk: RiskProfile;
  evidence: Evidence;
}

/** Three synthetic teaching cases. No real patient data. */
export const testPatients: TestPatient[] = [
  {
    id: "mild",
    name: "Alex (28)",
    kind: "Mild",
    summary: "Stuffy nose and sneezing for two days, scratchy throat, no fever, no body aches.",
    risk: { age: "adult", smoker: "no", vaccinated: "yes", season: "autumn", bmi: "normal", family: "none" },
    evidence: { runny_nose: "present", sneezing: "present", sore_throat: "present", fever: "absent", muscle_aches: "absent", itchy_eyes: "absent", cough: "absent" },
  },
  {
    id: "classic",
    name: "Maria (41)",
    kind: "Classic",
    summary: "Sudden high fever, cough, severe muscle aches, exhaustion and headache in mid-winter; not vaccinated.",
    risk: { age: "adult", smoker: "no", vaccinated: "no", season: "winter", bmi: "normal", family: "none" },
    evidence: { fever: "present", cough: "present", muscle_aches: "present", fatigue: "present", headache: "present", diarrhea: "absent", itchy_eyes: "absent" },
  },
  {
    id: "ambiguous",
    name: "Sam (58)",
    kind: "Ambiguous",
    summary: "Fever, dry cough, tiredness and a sore throat, plus a recent loss of smell. Several viral causes fit.",
    risk: { age: "adult", smoker: "yes", vaccinated: "no", season: "winter", bmi: "over", family: "none" },
    evidence: { fever: "present", dry_cough: "present", fatigue: "present", sore_throat: "present", loss_of_smell: "present", runny_nose: "absent" },
  },
];

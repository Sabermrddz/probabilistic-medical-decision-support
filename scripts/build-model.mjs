// Generates src/data/model.json from compact tables.
// Every number is emitted as { value, source, isAssumed }.
// Only a small number of values are literature-derived (isAssumed:false);
// everything else is an explicit, clearly flagged assumption.
import { writeFileSync, mkdirSync } from "node:fs";

const D = ["flu", "cold", "covid", "allergy", "strep", "bronch", "pneum", "gastro", "migraine", "t2d", "other"];

const diseases = [
  { id: "flu", name: "Influenza", description: "Seasonal viral infection with abrupt fever, aches and fatigue.", test: "Rapid influenza molecular assay / PCR", redFlag: false, ref: "https://www.cdc.gov/flu/signs-symptoms/index.html" },
  { id: "cold", name: "Common cold", description: "Mild self-limiting viral upper-respiratory infection.", test: "Usually clinical diagnosis; no test needed", redFlag: false, ref: "https://www.cdc.gov/common-cold/about/index.html" },
  { id: "covid", name: "COVID-19", description: "SARS-CoV-2 infection with highly variable presentation.", test: "Rapid antigen test or PCR", redFlag: false, ref: "https://www.cdc.gov/covid/signs-symptoms/index.html" },
  { id: "allergy", name: "Allergic rhinitis", description: "IgE-mediated nasal and ocular allergy (hay fever).", test: "Allergen skin-prick test / specific IgE", redFlag: false, ref: "https://www.niaid.nih.gov/diseases-conditions/allergic-rhinitis" },
  { id: "strep", name: "Strep throat", description: "Group A streptococcal pharyngitis.", test: "Rapid antigen detection test / throat culture", redFlag: false, ref: "https://www.cdc.gov/group-a-strep/about/strep-throat.html" },
  { id: "bronch", name: "Bronchitis", description: "Inflammation of the bronchi, dominated by cough.", test: "Clinical; chest X-ray only if pneumonia is suspected", redFlag: false, ref: "https://www.cdc.gov/antibiotic-use/chest-colds.html" },
  { id: "pneum", name: "Pneumonia", description: "Infection of the lung parenchyma; potentially serious.", test: "Chest X-ray, pulse oximetry, blood tests", redFlag: true, ref: "https://www.cdc.gov/pneumonia/about/index.html" },
  { id: "gastro", name: "Gastroenteritis", description: "Infectious inflammation of the stomach and intestines.", test: "Usually clinical; stool test if severe or prolonged", redFlag: false, ref: "https://www.cdc.gov/norovirus/about/symptoms.html" },
  { id: "migraine", name: "Migraine", description: "Recurrent neurological headache disorder, often with photophobia and nausea.", test: "Clinical diagnosis (ICHD-3 criteria)", redFlag: false, ref: "https://ichd-3.org/" },
  { id: "t2d", name: "Type 2 diabetes", description: "Chronic metabolic disorder with raised blood glucose.", test: "Fasting plasma glucose or HbA1c", redFlag: false, ref: "https://www.cdc.gov/diabetes/signs-symptoms/index.html" },
  { id: "other", name: "No disease / other", description: "Everything not covered by the ten modelled diseases, including healthy.", test: "Consult a clinician if symptoms persist", redFlag: false, isOther: true, ref: "n/a" },
];

const CARRAT = "Carrat F et al., Am J Epidemiol 2008;167(7):775-785 (influenza symptom frequencies; approximate transcription)";
const WHOCN = "WHO-China Joint Mission on COVID-19 report, Feb 2020 (hospitalised original-strain cohort; likely differs for recent variants)";
const DEF = "Case definition (condition is defined by this symptom)";
const assumedSrc = (id) => {
  const d = diseases.find((x) => x.id === id);
  return `Assumed - clinician-style estimate, not measured. Qualitative reference: ${d.ref}`;
};

// Likelihood table: symptom -> values in D order. { v, lit } marks literature-derived values.
const L = (v, lit) => ({ v, lit });
const symptoms = [
  { id: "fever", label: "Fever", system: "General", regions: ["body"], description: "Body temperature above ~38 °C (100.4 °F).",
    p: [L(.68, CARRAT), .10, L(.88, WHOCN), .02, .55, .15, .75, .30, .02, .03, .08] },
  { id: "fatigue", label: "Fatigue", system: "General", regions: ["body"], description: "Unusual tiredness or lack of energy.",
    p: [L(.94, CARRAT), .40, L(.38, WHOCN), .25, .35, .40, .60, .45, .30, .35, .18] },
  { id: "muscle_aches", label: "Muscle aches", system: "General", regions: ["body"], description: "Generalised muscle or body pain (myalgia).",
    p: [L(.94, CARRAT), .20, L(.15, WHOCN), .05, .15, .10, .30, .20, .10, .10, .08] },
  { id: "cough", label: "Cough", system: "Respiratory", regions: ["chest", "throat"], description: "Any cough, productive or not. Overlaps with dry cough (see limitations).",
    p: [L(.93, CARRAT), .50, .75, .20, .10, L(.98, DEF), .85, .03, .02, .05, .15] },
  { id: "dry_cough", label: "Dry cough", system: "Respiratory", regions: ["chest", "throat"], description: "Cough without mucus or phlegm.",
    p: [.55, .25, L(.68, WHOCN), .15, .06, .45, .40, .02, .01, .03, .07] },
  { id: "shortness_of_breath", label: "Shortness of breath", system: "Respiratory", regions: ["chest"], description: "Difficulty breathing or feeling breathless at rest or light activity.",
    p: [.25, .05, L(.186, WHOCN), .10, .02, .30, .80, .02, .01, .05, .05] },
  { id: "chest_pain", label: "Chest pain", system: "Respiratory", regions: ["chest"], description: "Pain or tightness in the chest, often worse on breathing.",
    p: [.10, .03, .10, .02, .02, .25, .50, .03, .02, .05, .05] },
  { id: "sore_throat", label: "Sore throat", system: "Ear, nose & throat", regions: ["throat", "head"], description: "Pain or scratchiness in the throat, worse when swallowing.",
    p: [L(.84, CARRAT), .55, L(.139, WHOCN), .25, .90, .20, .15, .08, .02, .02, .08] },
  { id: "runny_nose", label: "Runny / blocked nose", system: "Ear, nose & throat", regions: ["head"], description: "Nasal discharge or congestion.",
    p: [L(.91, CARRAT), .85, .20, .85, .15, .30, .15, .02, .03, .02, .08] },
  { id: "sneezing", label: "Sneezing", system: "Ear, nose & throat", regions: ["head"], description: "Repeated sneezing fits.",
    p: [.45, .70, .10, .90, .05, .10, .03, .01, .02, .01, .05] },
  { id: "loss_of_smell", label: "Loss of smell", system: "Ear, nose & throat", regions: ["head"], description: "Reduced or absent sense of smell or taste.",
    p: [.10, .15, .40, .20, .01, .01, .02, .01, .02, .02, .02] },
  { id: "itchy_eyes", label: "Itchy eyes", system: "Neurological & eyes", regions: ["head"], description: "Itchy, watery or red eyes.",
    p: [.03, .05, .03, .80, .01, .01, .01, .01, .02, .02, .02] },
  { id: "headache", label: "Headache", system: "Neurological & eyes", regions: ["head"], description: "Pain in the head, any type.",
    p: [L(.91, CARRAT), .30, L(.136, WHOCN), .35, .25, .20, .30, .20, L(.99, DEF), .15, .15] },
  { id: "light_sensitivity", label: "Light sensitivity", system: "Neurological & eyes", regions: ["head"], description: "Discomfort in bright light (photophobia).",
    p: [.10, .02, .03, .20, .02, .01, .02, .05, .80, .03, .03] },
  { id: "blurred_vision", label: "Blurred vision", system: "Neurological & eyes", regions: ["head"], description: "Difficulty focusing or hazy vision.",
    p: [.02, .01, .02, .08, .01, .01, .02, .03, .25, .35, .03] },
  { id: "nausea", label: "Nausea", system: "Digestive", regions: ["abdomen"], description: "Feeling the urge to vomit.",
    p: [.30, .05, L(.05, WHOCN), .02, .15, .05, .15, .75, .73, .08, .08] },
  { id: "vomiting", label: "Vomiting", system: "Digestive", regions: ["abdomen"], description: "Forceful emptying of the stomach.",
    p: [.15, .02, L(.05, WHOCN), .01, .10, .02, .05, .60, .30, .05, .05] },
  { id: "diarrhea", label: "Diarrhea", system: "Digestive", regions: ["abdomen"], description: "Three or more loose or watery stools per day.",
    p: [.10, .03, L(.037, WHOCN), .01, .02, .01, .05, .85, .02, .08, .06] },
  { id: "abdominal_pain", label: "Abdominal pain", system: "Digestive", regions: ["abdomen"], description: "Cramps or pain in the belly.",
    p: [.10, .03, .05, .02, .10, .08, .10, .80, .10, .10, .08] },
  { id: "excessive_thirst", label: "Excessive thirst", system: "Metabolic", regions: ["body"], description: "Persistent, unusually strong thirst (polydipsia).",
    p: [.05, .02, .03, .01, .02, .02, .05, .15, .05, .75, .03] },
  { id: "frequent_urination", label: "Frequent urination", system: "Metabolic", regions: ["body"], description: "Needing to urinate much more often than usual (polyuria).",
    p: [.02, .02, .02, .02, .01, .02, .02, .03, .03, .70, .05] },
];

const likelihoods = {};
D.forEach((dId, i) => {
  likelihoods[dId] = {};
  for (const s of symptoms) {
    const cell = s.p[i];
    if (typeof cell === "number") likelihoods[dId][s.id] = { value: cell, source: assumedSrc(dId), isAssumed: true };
    else likelihoods[dId][s.id] = { value: cell.v, source: cell.lit, isAssumed: false };
  }
});

const priorVals = { flu: .08, cold: .20, covid: .07, allergy: .08, strep: .04, bronch: .05, pneum: .015, gastro: .07, migraine: .06, t2d: .03 };
priorVals.other = +(1 - Object.values(priorVals).reduce((a, b) => a + b, 0)).toFixed(4);
const priors = {};
for (const dId of D) priors[dId] = { value: priorVals[dId], source: "Assumed - illustrative share among adults presenting with an acute complaint in primary care; NOT a measured prevalence", isAssumed: true };

const MSRC = "Assumed - qualitative epidemiology (seasonality, age, smoking, BMI, family history); multiplier magnitudes are illustrative";
const M = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, { value: v, source: MSRC, isAssumed: true }]));
const P = (v) => ({ value: v, source: "Assumed - rough population share for the Bayesian-network parent prior", isAssumed: true });

const riskFactors = [
  { id: "age", label: "Age group", description: "Age shifts the prior of most infectious and metabolic diseases.",
    levels: [{ id: "child", label: "Child / teen (<18)" }, { id: "adult", label: "Adult (18-64)" }, { id: "older", label: "Older adult (65+)" }],
    distribution: { child: P(.22), adult: P(.58), older: P(.20) },
    multipliers: {
      child: M({ flu: 1.3, cold: 1.8, covid: .9, strep: 2.5, bronch: .8, pneum: .8, gastro: 1.5, migraine: .5, t2d: .15 }),
      adult: M({}),
      older: M({ flu: 1.2, cold: .6, covid: 1.3, allergy: .6, strep: .4, bronch: 1.6, pneum: 3.0, gastro: .9, migraine: .5, t2d: 3.0 }),
    } },
  { id: "smoker", label: "Smoker", description: "Current tobacco smoking.",
    levels: [{ id: "no", label: "Non-smoker" }, { id: "yes", label: "Smoker" }],
    distribution: { no: P(.88), yes: P(.12) },
    multipliers: { no: M({}), yes: M({ flu: 1.2, cold: 1.1, covid: 1.2, allergy: .9, bronch: 3.0, pneum: 2.0, t2d: 1.4 }) } },
  { id: "vaccinated", label: "Vaccinated", description: "Up to date with seasonal influenza / COVID-19 vaccination.",
    levels: [{ id: "yes", label: "Vaccinated" }, { id: "no", label: "Not vaccinated" }],
    distribution: { yes: P(.5), no: P(.5) },
    multipliers: { yes: M({ flu: .5, covid: .6, pneum: .7 }), no: M({}) } },
  { id: "season", label: "Season", description: "Seasonality of respiratory viruses and pollen.",
    levels: [{ id: "winter", label: "Winter" }, { id: "spring", label: "Spring" }, { id: "summer", label: "Summer" }, { id: "autumn", label: "Autumn" }],
    distribution: { winter: P(.25), spring: P(.25), summer: P(.25), autumn: P(.25) },
    multipliers: {
      winter: M({ flu: 3.0, cold: 1.5, covid: 1.5, allergy: .4, strep: 1.3, bronch: 1.8, pneum: 1.6, gastro: 1.3 }),
      spring: M({ flu: .8, covid: .9, allergy: 3.0, strep: 1.1 }),
      summer: M({ flu: .15, cold: .7, allergy: 1.5, gastro: 1.2 }),
      autumn: M({ cold: 1.3, allergy: 2.0 }),
    } },
  { id: "bmi", label: "BMI category", description: "Body-mass-index category; obesity is the main modifiable risk for type 2 diabetes.",
    levels: [{ id: "under", label: "Underweight (<18.5)" }, { id: "normal", label: "Normal (18.5-24.9)" }, { id: "over", label: "Overweight (25-29.9)" }, { id: "obese", label: "Obese (30+)" }],
    distribution: { under: P(.02), normal: P(.35), over: P(.33), obese: P(.30) },
    multipliers: {
      under: M({ pneum: 1.3, t2d: .3 }),
      normal: M({}),
      over: M({ t2d: 2.0 }),
      obese: M({ flu: 1.1, covid: 1.3, pneum: 1.2, migraine: 1.1, t2d: 4.0 }),
    } },
  { id: "family", label: "Family history", description: "First-degree relative with diabetes or migraine.",
    levels: [{ id: "none", label: "None relevant" }, { id: "diabetes", label: "Diabetes" }, { id: "migraine", label: "Migraine" }],
    distribution: { none: P(.6), diabetes: P(.28), migraine: P(.12) },
    multipliers: { none: M({}), diabetes: M({ t2d: 2.5 }), migraine: M({ migraine: 2.0 }) } },
];

// Extra CPT structure that a purely factored (naive) prior cannot express.
const interactions = [
  { id: "smoker_older", description: "Smoking compounds age-related lung vulnerability.", when: { smoker: "yes", age: "older" }, multipliers: M({ bronch: 1.5, pneum: 1.5 }) },
  { id: "winter_unvaccinated", description: "Unvaccinated people are hit hardest by the winter influenza peak.", when: { season: "winter", vaccinated: "no" }, multipliers: M({ flu: 1.4 }) },
  { id: "obese_family_diabetes", description: "Obesity and a family history of diabetes act synergistically.", when: { bmi: "obese", family: "diabetes" }, multipliers: M({ t2d: 1.5 }) },
];

const model = {
  version: "1.0.0",
  title: "MediBayes educational model",
  disclaimer: "Educational prototype. Probabilities are illustrative and many are assumed. Not medical advice.",
  diseases: diseases.map(({ id, name, description, test, redFlag, isOther }) => ({ id, name, description, confirmatoryTest: test, redFlag, isOther: !!isOther })),
  symptoms: symptoms.map(({ id, label, system, regions, description }) => ({ id, label, system, regions, description })),
  priors,
  likelihoods,
  riskFactors,
  interactions,
};

mkdirSync("src/data", { recursive: true });
writeFileSync("src/data/model.json", JSON.stringify(model, null, 1));
const cells = Object.values(likelihoods).flatMap((r) => Object.values(r));
console.log(`diseases=${diseases.length} symptoms=${symptoms.length} cells=${cells.length} literature=${cells.filter((c) => !c.isAssumed).length}`);

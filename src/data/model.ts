import raw from "./model.json";
import { modelSchema, type Disease, type Model, type Symptom } from "@/lib/inference/schema";

/** model.json validated with Zod at load time: a malformed data file fails loudly. */
export const model: Model = modelSchema.parse(raw);

export const diseaseById: Record<string, Disease> = Object.fromEntries(model.diseases.map((d) => [d.id, d]));
export const symptomById: Record<string, Symptom> = Object.fromEntries(model.symptoms.map((s) => [s.id, s]));
export const SYSTEM_ORDER = ["General", "Respiratory", "Ear, nose & throat", "Neurological & eyes", "Digestive", "Metabolic"];

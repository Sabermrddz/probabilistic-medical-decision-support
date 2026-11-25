import {
  Activity, ArrowBigDownDash, ArrowBigUpDash, BatteryLow, Brain, Droplets, Eye, EyeOff, Flame, Flower2, Frown,
  GlassWater, Gauge, HeartPulse, Sparkles, Sun, Thermometer, Timer, Waves, Wind, Zap,
  type LucideIcon,
} from "lucide-react";
import type { BodyRegion } from "@/lib/inference";

export const symptomIcons: Record<string, LucideIcon> = {
  fever: Thermometer,
  fatigue: BatteryLow,
  muscle_aches: Activity,
  cough: Wind,
  dry_cough: Waves,
  shortness_of_breath: Gauge,
  chest_pain: HeartPulse,
  sore_throat: Flame,
  runny_nose: Droplets,
  sneezing: Sparkles,
  loss_of_smell: Flower2,
  itchy_eyes: Eye,
  headache: Brain,
  light_sensitivity: Sun,
  blurred_vision: EyeOff,
  nausea: Frown,
  vomiting: ArrowBigUpDash,
  diarrhea: ArrowBigDownDash,
  abdominal_pain: Zap,
  excessive_thirst: GlassWater,
  frequent_urination: Timer,
};

export const regionLabels: Record<BodyRegion, string> = {
  head: "Head, eyes & nose",
  throat: "Throat & neck",
  chest: "Chest & lungs",
  abdomen: "Abdomen",
  body: "Whole body",
};

/** Colour per disease (chart series). Chosen to stay distinguishable and readable on white backgrounds. */
export const diseaseColors: Record<string, string> = {
  flu: "#3b82f6",
  cold: "#0891b2",
  covid: "#8b5cf6",
  allergy: "#ec4899",
  strep: "#ea580c",
  bronch: "#a16207",
  pneum: "#ef4444",
  gastro: "#65a303",
  migraine: "#d946ef",
  t2d: "#0d9488",
  other: "#64748b",
};

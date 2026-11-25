import type { Metadata } from "next";
import { DiagnosisWizard } from "@/components/diagnosis/DiagnosisWizard";

export const metadata: Metadata = { title: "Diagnosis" };

export default function DiagnosisPage() {
  return <DiagnosisWizard />;
}

import type { Metadata } from "next";
import { Disclaimer } from "@/components/Disclaimer";
import { PatientReport } from "@/components/patients/PatientReport";
import { testPatients } from "@/data/patients";

export const metadata: Metadata = { title: "Test patients" };

export default function PatientsPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Test patients</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Three synthetic teaching cases (mild, classic, ambiguous) analysed by all three reasoning engines. Export any report as PNG or PDF.
        </p>
      </header>
      <Disclaimer compact />
      {testPatients.map((p) => (
        <PatientReport key={p.id} patient={p} />
      ))}
    </div>
  );
}

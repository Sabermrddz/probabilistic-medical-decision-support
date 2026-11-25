import type { Metadata } from "next";
import { SensitivityLab } from "@/components/sensitivity/SensitivityLab";

export const metadata: Metadata = { title: "Sensitivity analysis" };

export default function SensitivityPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Sensitivity analysis</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Because many parameters are assumed, it matters how much the conclusion depends on them. Move the priors and a likelihood and watch the posterior respond.
        </p>
      </header>
      <SensitivityLab />
    </div>
  );
}

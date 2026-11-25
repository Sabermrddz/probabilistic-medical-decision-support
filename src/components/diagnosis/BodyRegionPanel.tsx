"use client";

import dynamic from "next/dynamic";
import { regionLabels } from "@/lib/symptomMeta";
import type { BodyRegion } from "@/lib/inference";
import { cn } from "@/lib/utils";
import { useDiagnosisStore } from "@/store/useDiagnosisStore";

const BodySelector = dynamic(() => import("@/components/three/BodySelector"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-subtle" aria-hidden />,
});

const regions = Object.keys(regionLabels) as BodyRegion[];

/** Interactive 3D body + accessible chip list. Both set the same store filter. */
export function BodyRegionPanel() {
  const region = useDiagnosisStore((s) => s.region);
  const setRegion = useDiagnosisStore((s) => s.setRegion);
  return (
    <div className="glass rounded-2xl p-3">
      <div className="h-44 w-full" aria-hidden>
        <BodySelector region={region} onSelect={setRegion} />
      </div>
      <p className="mb-2 mt-1 text-center text-xs text-muted">Click a body part to filter symptoms</p>
      <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-label="Filter symptoms by body region">
        {regions.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={region === r}
            onClick={() => setRegion(region === r ? null : r)}
            className={cn(
              "cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition",
              region === r ? "border-accent bg-accent text-accent-foreground" : "border-border hover:bg-accent-soft",
            )}
          >
            {regionLabels[r]}
          </button>
        ))}
      </div>
    </div>
  );
}

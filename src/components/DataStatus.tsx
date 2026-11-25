import { Database } from "lucide-react";
import { model } from "@/data/model";
import { dataStatus } from "@/lib/inference";
import { Badge } from "@/components/ui/card";

const status = dataStatus(model);

/** Honest provenance summary: how much of the model is sourced vs assumed. */
export function DataStatus({ detailed = false }: { detailed?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-subtle/60 p-4 text-sm" aria-label="Data source status">
      <div className="mb-2 flex items-center gap-2 font-medium">
        <Database size={16} aria-hidden /> Data-source status
      </div>
      <div
        className="mb-2 flex h-2.5 overflow-hidden rounded-full bg-border"
        role="img"
        aria-label={`${status.sourced} sourced, ${status.assumed} assumed`}
      >
        <div className="bg-ok" style={{ width: `${(status.sourced / status.total) * 100}%` }} />
        <div className="hatch bg-warn" style={{ width: `${(status.assumed / status.total) * 100}%` }} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge tone="ok">{status.sourced} literature-derived</Badge>
        <Badge tone="warn">{status.assumed} assumed ({(status.assumedShare * 100).toFixed(0)}%)</Badge>
      </div>
      {detailed && (
        <p className="mt-3 text-muted">
          Of the {status.likelihoodTotal} P(symptom | disease) cells, {status.likelihoodSourced} cite a literature source (approximate
          transcriptions); the rest, all priors and all risk multipliers are explicitly marked <code>isAssumed: true</code>.
        </p>
      )}
      {!detailed && <p className="mt-2 text-xs text-muted">Treat all outputs as illustrative.</p>}
    </div>
  );
}

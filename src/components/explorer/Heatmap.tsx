"use client";

import { useState } from "react";
import { Badge, Card, CardDescription, CardTitle } from "@/components/ui/card";
import { diseaseById, model, symptomById } from "@/data/model";
import { cn } from "@/lib/utils";

interface Hover {
  d: string;
  s: string;
}

export function Heatmap() {
  const [hover, setHover] = useState<Hover | null>(null);
  const cell = hover ? model.likelihoods[hover.d][hover.s] : null;
  return (
    <Card>
      <CardTitle>P(symptom | disease): heatmap</CardTitle>
      <CardDescription>
        11 classes × {model.symptoms.length} symptoms. Hover or focus a cell for its source. A dashed outline means the value is <b>assumed</b>;
        a solid green outline means it cites a literature source.
      </CardDescription>
      <div className="mt-5 overflow-x-auto pb-2">
        <table className="border-separate border-spacing-0.5 text-xs" aria-label="Heatmap of symptom likelihoods per disease">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-card-solid p-1 text-left font-medium text-muted">Symptom</th>
              {model.diseases.map((d) => (
                <th key={d.id} scope="col" className={cn("h-24 w-12 align-bottom font-medium", hover?.d === d.id && "text-accent")}>
                  <span className="inline-block origin-bottom-left -rotate-45 whitespace-nowrap pl-2">{d.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.symptoms.map((s) => (
              <tr key={s.id}>
                <th scope="row" className={cn("sticky left-0 z-10 whitespace-nowrap bg-card-solid p-1 pr-3 text-left font-medium", hover?.s === s.id && "text-accent")}>
                  {s.label}
                </th>
                {model.diseases.map((d) => {
                  const p = model.likelihoods[d.id][s.id];
                  return (
                    <td key={d.id} className="p-0">
                      <button
                        type="button"
                        className={cn(
                          "heat-cell h-8 w-12 cursor-pointer rounded-md text-center font-medium tabular-nums transition hover:scale-110 focus-visible:scale-110",
                          p.isAssumed ? "outline outline-1 -outline-offset-1 outline-dashed outline-muted/60" : "outline outline-2 -outline-offset-2 outline-ok",
                        )}
                        style={{ ["--v" as string]: p.value }}
                        aria-label={`P(${s.label} | ${d.name}) = ${p.value}, ${p.isAssumed ? "assumed" : "from literature"}`}
                        onMouseEnter={() => setHover({ d: d.id, s: s.id })}
                        onFocus={() => setHover({ d: d.id, s: s.id })}
                      >
                        {p.value.toFixed(2).replace(/^0/, "")}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
        <span>0</span>
        <span className="h-2 w-40 rounded-full" style={{ background: "linear-gradient(90deg, transparent, var(--accent))", border: "1px solid var(--border)" }} aria-hidden />
        <span>1</span>
      </div>
      <div className="mt-4 min-h-24 rounded-xl bg-subtle/70 p-4 text-sm" aria-live="polite">
        {hover && cell ? (
          <>
            <p className="font-semibold">
              P({symptomById[hover.s].label} | {diseaseById[hover.d].name}) = {cell.value}{" "}
              <Badge tone={cell.isAssumed ? "warn" : "ok"}>{cell.isAssumed ? "assumed" : "literature"}</Badge>
            </p>
            <p className="mt-1 break-words text-muted">Source: {cell.source}</p>
          </>
        ) : (
          <p className="text-muted">Hover over a cell to inspect its value and provenance.</p>
        )}
      </div>
    </Card>
  );
}

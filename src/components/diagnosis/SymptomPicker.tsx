"use client";

import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useMemo } from "react";
import { model, SYSTEM_ORDER } from "@/data/model";
import { Tooltip } from "@/components/ui/tooltip";
import { symptomIcons, regionLabels } from "@/lib/symptomMeta";
import type { Presence, Symptom } from "@/lib/inference";
import { cn } from "@/lib/utils";
import { useDiagnosisStore } from "@/store/useDiagnosisStore";
import { BodyRegionPanel } from "./BodyRegionPanel";

const states: { id: Presence; label: string; active: string }[] = [
  { id: "present", label: "Present", active: "bg-accent text-accent-foreground" },
  { id: "absent", label: "Absent", active: "bg-foreground text-background" },
  { id: "unknown", label: "Unknown", active: "bg-subtle text-foreground ring-1 ring-border" },
];

function SymptomCard({ symptom }: { symptom: Symptom }) {
  const state = useDiagnosisStore((s) => s.evidence[symptom.id]) ?? "unknown";
  const setSymptom = useDiagnosisStore((s) => s.setSymptom);
  const Icon = symptomIcons[symptom.id];
  return (
    <motion.li
      layout
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -2 }}
      className={cn(
        "glass rounded-2xl p-4 transition-colors",
        state === "present" && "border-accent ring-1 ring-accent",
        state === "absent" && "border-foreground/50",
      )}
    >
      <Tooltip content={symptom.description}>
        <div className="mb-3 flex items-center gap-3">
          <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", state === "present" ? "bg-accent text-accent-foreground" : "bg-accent-soft text-accent")}>
            {Icon && <Icon size={18} aria-hidden />}
          </span>
          <span className="text-sm font-semibold leading-tight">{symptom.label}</span>
        </div>
      </Tooltip>
      <div role="radiogroup" aria-label={`${symptom.label}: present, absent or unknown`} className="grid grid-cols-3 gap-1 rounded-xl bg-subtle/80 p-1">
        {states.map((st) => (
          <button
            key={st.id}
            type="button"
            role="radio"
            aria-checked={state === st.id}
            onClick={() => setSymptom(symptom.id, st.id)}
            className={cn(
              "cursor-pointer rounded-lg px-1 py-1.5 text-xs font-medium transition active:scale-95",
              state === st.id ? st.active : "text-muted hover:text-foreground",
            )}
          >
            {st.label}
          </button>
        ))}
      </div>
    </motion.li>
  );
}

export function SymptomPicker() {
  const query = useDiagnosisStore((s) => s.query);
  const setQuery = useDiagnosisStore((s) => s.setQuery);
  const region = useDiagnosisStore((s) => s.region);
  const setRegion = useDiagnosisStore((s) => s.setRegion);
  const answered = useDiagnosisStore((s) => Object.keys(s.evidence).length);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = model.symptoms.filter(
      (s) =>
        (!region || s.regions.includes(region)) &&
        (!q || s.label.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.system.toLowerCase().includes(q)),
    );
    return SYSTEM_ORDER.map((system) => ({ system, items: filtered.filter((s) => s.system === system) })).filter((g) => g.items.length);
  }, [query, region]);

  return (
    <section aria-labelledby="symptom-title" className="space-y-5">
      <div>
        <h2 id="symptom-title" className="text-2xl font-semibold tracking-tight">
          Symptoms
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Mark each symptom <strong>Present</strong> or <strong>Absent</strong>. Leave it <strong>Unknown</strong> if you can&apos;t tell:
          unknown symptoms change nothing. Results update live.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search symptoms (e.g. cough, thirst, eyes)…"
              aria-label="Search symptoms"
              className="h-11 w-full rounded-xl border border-border bg-card-solid/70 pl-10 pr-10 text-sm placeholder:text-muted focus-visible:outline-2"
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted hover:text-foreground">
                <X size={16} />
              </button>
            )}
          </div>
          <p className="text-xs text-muted" aria-live="polite">
            {answered} answered{region ? ` · filtered to “${regionLabels[region]}”` : ""}
            {region && (
              <button type="button" onClick={() => setRegion(null)} className="ml-2 cursor-pointer font-medium text-accent underline">
                clear filter
              </button>
            )}
          </p>
        </div>
        <BodyRegionPanel />
      </div>

      {groups.length === 0 && <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted">No symptoms match your search.</p>}
      {groups.map((g) => (
        <div key={g.system + (region ?? "") + query}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">{g.system}</h3>
          <motion.ul
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.04 } } }}
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {g.items.map((s) => (
              <SymptomCard key={s.id} symptom={s} />
            ))}
          </motion.ul>
        </div>
      ))}
    </section>
  );
}

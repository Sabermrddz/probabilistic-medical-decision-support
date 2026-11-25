"use client";

import { motion } from "framer-motion";
import { forwardRef, useMemo, useState, type KeyboardEvent, type ReactNode, type SVGProps } from "react";
import { Badge, Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Popover } from "@/components/ui/popover";
import { diseaseById, model } from "@/data/model";
import { diseaseCpt, type RiskFactor } from "@/lib/inference";

const W = 900;
const ROW = 30;
const H = model.symptoms.length * ROW + 40;
const X_RF = 110;
const X_D = 450;
const X_S = 790;
const yS = (i: number) => 30 + i * ROW;
const yRF = (i: number) => H / 2 + (i - (model.riskFactors.length - 1) / 2) * 90;

const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
};

/** SVG node that behaves like a button; forwards Radix trigger props and ref to the <g>. */
const NodeButton = forwardRef<SVGGElement, SVGProps<SVGGElement> & { label: string; children: ReactNode }>(function NodeButton(
  { children, label, ...rest },
  ref,
) {
  const handle = (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.currentTarget.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
  };
  return (
    <g
      {...rest}
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={label}
      onKeyDown={handle}
      className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-[3] [&:hover>rect]:brightness-110"
    >
      {children}
    </g>
  );
});

function RiskFactorCpt({ rf }: { rf: RiskFactor }) {
  return (
    <div>
      <h4 className="font-semibold">{rf.label}: prior distribution</h4>
      <p className="mb-2 text-xs text-muted">Root node: P({rf.label}).</p>
      <table className="w-full text-xs">
        <tbody>
          {rf.levels.map((l) => {
            const p = rf.distribution[l.id];
            const eff = Object.entries(rf.multipliers[l.id] ?? {})
              .filter(([, m]) => Math.abs(m.value - 1) > 0.05)
              .sort((a, b) => b[1].value - a[1].value)
              .slice(0, 3)
              .map(([d, m]) => `${diseaseById[d].name} ×${m.value}`)
              .join(", ");
            return (
              <tr key={l.id} className="border-t border-border align-top">
                <td className="py-1.5 pr-2 font-medium">{l.label}</td>
                <td className="py-1.5 pr-2 tabular-nums">{p.value.toFixed(2)}</td>
                <td className="py-1.5 text-muted">{eff || "reference"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Badge tone="warn" className="mt-2">assumed</Badge>
    </div>
  );
}

function DiseaseCpt() {
  const [config, setConfig] = useState<Record<string, string>>({ age: "adult", smoker: "no", vaccinated: "no", season: "winter", bmi: "normal", family: "none" });
  const cpt = useMemo(() => diseaseCpt(model, config), [config]);
  const fired = model.interactions.filter((it) => Object.entries(it.when).every(([f, l]) => config[f] === l));
  const order = [...model.diseases.keys()].sort((a, b) => cpt[b] - cpt[a]);
  return (
    <div>
      <h4 className="font-semibold">CPT: P(Disease | parents)</h4>
      <p className="mb-3 text-xs text-muted">Choose a parent configuration to read its CPT column.</p>
      <div className="mb-3 grid grid-cols-2 gap-2">
        {model.riskFactors.map((rf) => (
          <label key={rf.id} className="text-xs">
            <span className="text-muted">{rf.label}</span>
            <select
              value={config[rf.id]}
              onChange={(e) => setConfig((c) => ({ ...c, [rf.id]: e.target.value }))}
              className="mt-0.5 h-8 w-full cursor-pointer rounded-md border border-border bg-card-solid px-1"
            >
              {rf.levels.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <ul className="space-y-1">
        {order.map((i) => (
          <li key={i} className="grid grid-cols-[1fr_44px] items-center gap-2 text-xs">
            <div>
              <div className="flex justify-between"><span>{model.diseases[i].name}</span></div>
              <div className="mt-0.5 h-1.5 rounded-full bg-border"><div className="h-full rounded-full bg-accent" style={{ width: `${cpt[i] * 100}%` }} /></div>
            </div>
            <span className="text-right tabular-nums">{(cpt[i] * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
      {fired.length > 0 && (
        <p className="mt-3 rounded-lg bg-accent-soft p-2 text-xs">
          Interaction active: {fired.map((f) => f.description).join(" ")}
        </p>
      )}
      <Badge tone="warn" className="mt-2">assumed multipliers</Badge>
    </div>
  );
}

function SymptomCpt({ id }: { id: string }) {
  const rows = model.diseases.map((d) => ({ d, p: model.likelihoods[d.id][id] })).sort((a, b) => b.p.value - a.p.value);
  return (
    <div>
      <h4 className="font-semibold">P({model.symptoms.find((s) => s.id === id)?.label} | Disease)</h4>
      <ul className="mt-2 space-y-1">
        {rows.map(({ d, p }) => (
          <li key={d.id} className="grid grid-cols-[1fr_72px] items-center gap-2 text-xs">
            <div>
              <span>{d.name}</span>
              <div className="mt-0.5 h-1.5 rounded-full bg-border"><div className="h-full rounded-full bg-accent" style={{ width: `${p.value * 100}%` }} /></div>
            </div>
            <span className="text-right tabular-nums">{p.value.toFixed(2)} {p.isAssumed ? "·A" : "·L"}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">A = assumed, L = literature-derived.</p>
    </div>
  );
}

export function NetworkGraph() {
  return (
    <Card>
      <CardTitle>Bayesian network structure</CardTitle>
      <CardDescription>
        Risk factors → Disease → Symptoms. Click or press Enter on any node to open its conditional probability table. Symptoms are
        conditionally independent given the disease.
      </CardDescription>
      <div className="mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto min-w-[720px]" role="group" aria-label="Bayesian network graph">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" />
            </marker>
          </defs>
          {model.riskFactors.map((rf, i) => (
            <motion.path
              key={rf.id}
              d={curve(X_RF + 70, yRF(i), X_D - 70, H / 2)}
              fill="none"
              stroke="var(--muted)"
              strokeWidth={1.6}
              markerEnd="url(#arrow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: i * 0.08 }}
            />
          ))}
          {model.symptoms.map((s, i) => (
            <motion.path
              key={s.id}
              d={curve(X_D + 70, H / 2, X_S - 62, yS(i))}
              fill="none"
              stroke="var(--muted)"
              strokeOpacity={0.55}
              strokeWidth={1}
              markerEnd="url(#arrow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.4 + i * 0.02 }}
            />
          ))}

          {model.riskFactors.map((rf, i) => (
            <Popover key={rf.id} label={`${rf.label} CPT`} trigger={
              <NodeButton label={`Risk factor node ${rf.label}`}>
                <rect x={X_RF - 70} y={yRF(i) - 20} width={140} height={40} rx={12} fill="var(--card-solid)" stroke="var(--accent)" strokeWidth={2} />
                <text x={X_RF} y={yRF(i) + 5} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--foreground)">{rf.label}</text>
              </NodeButton>
            }>
              <RiskFactorCpt rf={rf} />
            </Popover>
          ))}

          <Popover label="Disease CPT" trigger={
            <NodeButton label="Disease node: open conditional probability table">
              <rect x={X_D - 70} y={H / 2 - 34} width={140} height={68} rx={16} fill="var(--accent)" stroke="var(--accent)" strokeWidth={2} />
              <text x={X_D} y={H / 2 - 2} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--accent-foreground)">Disease</text>
              <text x={X_D} y={H / 2 + 16} textAnchor="middle" fontSize={11} fill="var(--accent-foreground)">11 classes · CPT</text>
            </NodeButton>
          }>
            <DiseaseCpt />
          </Popover>

          {model.symptoms.map((s, i) => (
            <Popover key={s.id} label={`${s.label} CPT`} trigger={
              <NodeButton label={`Symptom node ${s.label}`}>
                <rect x={X_S - 62} y={yS(i) - 11} width={124} height={22} rx={8} fill="var(--card-solid)" stroke="var(--border)" strokeWidth={1.5} />
                <text x={X_S} y={yS(i) + 4} textAnchor="middle" fontSize={11} fontWeight={500} fill="var(--foreground)">{s.label}</text>
              </NodeButton>
            }>
              <SymptomCpt id={s.id} />
            </Popover>
          ))}
        </svg>
      </div>
    </Card>
  );
}

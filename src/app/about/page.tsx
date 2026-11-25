import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DataStatus } from "@/components/DataStatus";
import { Disclaimer } from "@/components/Disclaimer";
import { Card } from "@/components/ui/card";
import { THRESHOLDS } from "@/lib/inference";

export const metadata: Metadata = { title: "Method & limitations" };

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <Card>
      <section aria-labelledby={id} className="space-y-3 text-sm leading-relaxed text-muted [&_b]:text-foreground [&_code]:rounded [&_code]:bg-subtle [&_code]:px-1">
        <h2 id={id} className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        {children}
      </section>
    </Card>
  );
}

const Formula = ({ children }: { children: ReactNode }) => (
  <p className="overflow-x-auto rounded-xl bg-subtle/80 p-3 font-mono text-xs text-foreground sm:text-sm">{children}</p>
);

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Method &amp; limitations</h1>
        <p className="mt-1 text-sm text-muted">How MediBayes reasons, what it assumes, and where it breaks.</p>
      </header>
      <Disclaimer />

      <Section id="bayes" title="1. Bayes' theorem">
        <p>Given a disease D and evidence E (the observed symptoms), the posterior is the prior re-weighted by how well D explains E:</p>
        <Formula>P(D | E) = P(D) · P(E | D) / P(E),   P(E) = Σ<sub>d</sub> P(d) · P(E | d)</Formula>
        <p>
          The eleven classes (ten diseases plus <b>No disease / other</b>) are treated as <b>mutually exclusive and exhaustive</b>, so
          the posteriors sum to 1. Worked check used in the unit tests: P(Flu) = 0.10, P(Fever | Flu) = 0.8, P(Fever | ¬Flu) = 0.1,
          P(Cough | Flu) = 0.7, P(Cough | ¬Flu) = 0.2 gives 0.056 / (0.056 + 0.018) = <b>0.7568</b>.
        </p>
      </Section>

      <Section id="nb" title="2. Naive Bayes mode">
        <p>Symptoms are assumed conditionally independent given the disease, so the likelihood factorises:</p>
        <Formula>log P(D | E) = log P(D) + Σ<sub>observed s</sub> log P(s = obs | D) − log P(E)</Formula>
        <p>
          Computed in log-space with a stable softmax to avoid underflow. A symptom marked <b>Unknown</b> is simply left out of the sum
          (it is marginalised out, which multiplies by 1). Risk factors multiply the prior odds of each disease, then the prior is
          renormalised: <code>P(D | risk) ∝ P(D) · Π m(level, D)</code>.
        </p>
      </Section>

      <Section id="bn" title="3. Bayesian-network mode">
        <p>
          Structure: six root nodes (age, smoker, vaccinated, season, BMI, family history) → <b>Disease</b> → 21 symptom leaves. The
          Disease CPT <code>P(D | parents)</code> has 576 columns generated from the multipliers <b>plus explicit interaction terms</b>{" "}
          (e.g. older smokers, unvaccinated in winter, obesity with family diabetes). Inference is exact <b>enumeration</b>: the joint is
          summed over every configuration of the <i>unobserved</i> parents, weighted by their prior distributions.
        </p>
        <p>The two modes differ in exactly two ways: interactions in the CPT, and unknown risk factors being marginalised over their priors rather than ignored. The results page shows the per-disease difference.</p>
      </Section>

      <Section id="ds" title="4. Dempster–Shafer mode (bonus)">
        <p>
          The frame of discernment is the 11 classes. Each observed symptom becomes a <b>simple support function</b>: mass <i>w</i> on the set
          A of diseases that explain the observation (consistency ≥ 50% of the best), and 1 − <i>w</i> on the whole frame Θ. The weight
          <i> w</i> measures how well A separates from its complement (capped at 0.9). This construction is a <b>heuristic</b>, not derived from data.
        </p>
        <p>
          Masses are combined with Dempster&apos;s rule, <code>m(A) = Σ<sub>B∩C=A</sub> m₁(B)m₂(C) / (1 − K)</code>, where K is the mass
          that falls on the empty set (conflict). We report belief <code>Bel</code>, plausibility <code>Pl</code>, the pignistic probability{" "}
          <code>BetP</code> and the global K. Dempster&apos;s rule produces a single K, so per-disease we show disbelief 1 − Pl. Priors are not used, so
          the Bel–Pl gap reflects genuine ignorance and the result is deliberately not equal to the Bayesian posterior.
        </p>
      </Section>

      <Section id="eig" title="5. Next-question suggestion & decision support">
        <p>
          For every unanswered symptom we compute the expected information gain (bits) about <i>which of the top two diseases is correct</i>:{" "}
          <code>H(D) − E<sub>o</sub>[H(D | S = o)]</code>, and rank by it.
        </p>
        <p>
          Decision rules: top posterior ≥ <b>{THRESHOLDS.test * 100}%</b> suggests a confirmatory test; red-flag patterns
          (breathlessness + chest pain, pneumonia ≥ {THRESHOLDS.pneumoniaUrgent * 100}% with breathlessness, fever + headache + light
          sensitivity, thirst + urination + vomiting/abdominal pain) trigger urgent-care advice regardless of probabilities. These thresholds are illustrative, not clinically validated.
        </p>
      </Section>

      <Section id="data" title="6. Data & provenance">
        <p>
          <code>src/data/model.json</code> is generated by <code>scripts/build-model.mjs</code> and validated at load time by a Zod schema. Every
          probability and multiplier is an object <code>{"{ value, source, isAssumed }"}</code>.
        </p>
        <DataStatus detailed />
        <ul className="list-disc space-y-1 pl-5">
          <li>Influenza symptom frequencies: Carrat F et al., <i>Am J Epidemiol</i> 2008;167:775–785 (approximate transcription).</li>
          <li>COVID-19 symptom frequencies: WHO-China Joint Mission on COVID-19 report, Feb 2020 (hospitalised, original strain; likely under-states upper-respiratory symptoms of recent variants).</li>
          <li>Case definitions (bronchitis → cough, migraine → headache): clinical definitions, e.g. ICHD-3.</li>
          <li>Qualitative references for assumed values: CDC symptom pages for influenza, COVID-19, strep throat, pneumonia, norovirus, diabetes; NIAID (allergic rhinitis); ICHD-3 (migraine).</li>
        </ul>
        <p><b>All priors, risk multipliers, parent-node distributions and most likelihoods are assumptions</b> chosen by the authors to be plausible. They were not fitted to data.</p>
      </Section>

      <Section id="limits" title="7. Limitations">
        <ul className="list-disc space-y-1 pl-5">
          <li><b>Conditional independence is false in reality</b>: for instance <i>cough</i> and <i>dry cough</i>, or fever and muscle aches, are correlated, so naive Bayes over-counts correlated evidence and tends to be over-confident.</li>
          <li>Closed world: exactly one condition is assumed. Co-infection, comorbidity and diseases outside the list are only represented by the catch-all “other” class.</li>
          <li>Symptoms are binary; severity, duration, onset, age-specific presentation and examination findings are not modelled.</li>
          <li>Most parameters are assumed. Use the Sensitivity page to see how much conclusions depend on them.</li>
          <li>The Dempster–Shafer mass construction is a modelling heuristic; different but equally defensible constructions give different numbers.</li>
          <li>Serious diseases that are not modelled (meningitis, myocardial infarction, sepsis…) can look like modelled ones. Red-flag rules help but are far from complete.</li>
          <li>No validation against real patient data has been performed. This is a teaching prototype.</li>
        </ul>
      </Section>
    </div>
  );
}

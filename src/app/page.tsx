import { ArrowRight, Brain, GitFork, Layers, Network, Sigma } from "lucide-react";
import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { Reveal } from "@/components/Reveal";
import { HeroCanvas } from "@/components/three/HeroCanvas";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const engines = [
  { icon: Sigma, title: "Naive Bayes", text: "P(disease | symptoms) from Bayes' theorem in log-space, with risk factors shifting the prior and unknown symptoms ignored." },
  { icon: Network, title: "Bayesian network", text: "Risk factors are parent nodes of Disease with a conditional probability table. Inference is exact enumeration over unobserved parents." },
  { icon: Layers, title: "Dempster–Shafer", text: "Symptoms become mass functions combined with Dempster's rule: belief, plausibility, pignistic probability and conflict K." },
];

const steps = [
  ["1", "Describe the patient", "Age, season, smoking, vaccination, BMI, family history, all optional."],
  ["2", "Mark symptoms", "Present, absent or unknown across 21 symptoms; results update live."],
  ["3", "Understand why", "Per-symptom evidence, the Bayes calculation, and the best next question to ask."],
];

export default function LandingPage() {
  return (
    <div className="space-y-20">
      <section className="relative grid items-center gap-8 lg:grid-cols-2">
        <div className="relative z-10 py-6">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card-solid/60 px-3 py-1 text-xs font-medium text-muted">
            <Brain size={14} className="text-accent" aria-hidden /> Knowledge Representation &amp; Reasoning · Uncertain reasoning
          </p>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Medical reasoning, <span className="text-accent">made probabilistic.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            MediBayes ranks ten diseases from symptoms and risk factors using Bayes&apos; theorem, a Bayesian network and
            Dempster–Shafer theory, and shows you exactly how every number was computed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/diagnosis" className={cn(buttonVariants({ size: "lg" }))}>
              Start diagnosis <ArrowRight size={18} aria-hidden />
            </Link>
            <Link href="/patients" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              View test patients
            </Link>
          </div>
        </div>
        <div className="relative h-[320px] sm:h-[440px] lg:h-[520px]">
          <HeroCanvas />
        </div>
      </section>

      <Disclaimer />

      <section aria-labelledby="engines">
        <h2 id="engines" className="mb-2 text-2xl font-semibold tracking-tight sm:text-3xl">Three ways to reason under uncertainty</h2>
        <p className="mb-8 max-w-2xl text-muted">Switch between them on the results page and see where they agree and where they differ.</p>
        <div className="grid gap-4 md:grid-cols-3">
          {engines.map((e, i) => (
            <Reveal key={e.title} index={i}>
              <Card className="h-full">
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent">
                  <e.icon size={22} aria-hidden />
                </span>
                <h3 className="text-lg font-semibold">{e.title}</h3>
                <p className="mt-2 text-sm text-muted">{e.text}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section aria-labelledby="how">
        <h2 id="how" className="mb-8 text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map(([n, title, text], i) => (
            <Reveal key={n} index={i}>
              <li className="glass h-full list-none rounded-2xl p-6">
                <span className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground">{n}</span>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="glass flex flex-col items-start gap-4 rounded-3xl p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <GitFork size={20} className="text-accent" aria-hidden /> Honest about its data
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Every probability carries a source and an <code>isAssumed</code> flag. Most are assumptions and the app says so everywhere.
          </p>
        </div>
        <Link href="/explorer" className={cn(buttonVariants({ variant: "outline" }))}>
          Explore the model
        </Link>
      </section>
    </div>
  );
}

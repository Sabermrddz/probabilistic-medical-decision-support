# MediBayes: probabilistic medical decision support

> **Educational prototype. Not medical advice.** Most probabilities are assumed, not measured.

MediBayes is a university mini-project for *Knowledge Representation and Reasoning* (uncertain-reasoning chapter).
It ranks 10 diseases + a "no disease / other" class from symptoms and risk factors with three reasoning engines
(Naive Bayes, a Bayesian network by enumeration, Dempster–Shafer) and explains every number.
Inference runs **entirely client-side** in a pure TypeScript module.

## Setup

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # Vitest: inference-engine unit tests (29 tests)
npm run build        # production build
npm run build:model  # regenerate src/data/model.json from scripts/build-model.mjs
```

The Next.js template also ships a Drizzle/PostgreSQL client (`src/db`) and `/api/health`. MediBayes itself does not need the database.

## Architecture

```
            ┌──────────────────────────── Browser ───────────────────────────┐
 model.json │  Zod schema ─▶ model (typed)                                    │
 (value,    │        │                                                        │
 source,    │        ▼                                                        │
 isAssumed) │  lib/inference (pure TS, no UI imports)                         │
            │   ├ naiveBayes.ts   log-space NB + risk-adjusted prior          │
            │   ├ bayesNet.ts     CPT P(D|parents) + enumeration              │
            │   ├ dempsterShafer.ts  simple support, Dempster's rule, Bel/Pl/BetP, K
            │   ├ infer.ts        posterior, prior, contributions, breakdown  │
            │   ├ infoGain.ts     expected information gain (next question)  │
            │   ├ decision.ts     thresholds + red-flag rules                 │
            │   └ overrides.ts    sensitivity-analysis overrides              │
            │        ▲                                                        │
            │  Zustand store (profile, evidence, mode)  ──▶ useAnalysis()     │
            │        ▼                                                        │
            │  Next.js App Router pages: / · /diagnosis · /explorer ·         │
            │  /sensitivity · /patients · /about                              │
            │  UI: Tailwind + shadcn-style (Radix) primitives, Framer Motion, │
            │      Recharts, react-three-fiber (lazy-loaded)                  │
            └─────────────────────────────────────────────────────────────────┘
```

```
src/app/            routes (App Router) + template.tsx page transitions
src/components/     ui/ (button, card, tooltip, popover, slider), diagnosis/, explorer/, sensitivity/, patients/, three/
src/lib/inference/  the reasoning engine (framework-independent)
src/data/           model.json (generated), model.ts (Zod-validated loader), patients.ts
src/store/          Zustand store + useAnalysis hook
tests/              Vitest tests
scripts/            build-model.mjs (data generator)
```

## Model

* **Classes**: influenza, common cold, COVID-19, allergic rhinitis, strep throat, bronchitis, pneumonia, gastroenteritis, migraine, type 2 diabetes, + "No disease / other". Mutually exclusive and exhaustive.
* **Symptoms** (21): present / absent / unknown. Unknown contributes nothing.
* **Risk factors** (6): age group, smoker, vaccinated, season, BMI category, family history. They modify the disease **prior**.
* **Naive Bayes**: `log P(D|E) = log P(D) + Σ log P(s|D) − log P(E)`, stable softmax normalisation.
* **Bayesian network**: risk factors → Disease → symptoms. CPT = factored multipliers + interaction terms; exact enumeration over unobserved parents. Differs from naive Bayes through interactions and marginalisation of unknown factors.
* **Dempster–Shafer**: one simple-support mass function per symptom, Dempster's rule, Bel / Pl / BetP and global conflict K, compared with the Bayesian posterior.
* **Explanations**: per-symptom likelihood ratio and leave-one-out log-odds, step-by-step Bayes arithmetic, sequential updating.
* **Next question**: unknown symptom with maximum expected information gain between the top two diseases.
* **Decision support**: ≥ 70 % → suggest a confirmatory test; red-flag rules → urgent care.

### Data honesty

`src/data/model.json` stores every probability as `{ value, source, isAssumed }` and is validated with Zod at load time.
Currently **19 of 231** likelihoods cite a literature source (Carrat 2008 for influenza, the WHO-China Joint Mission report for COVID-19, and
case definitions); all priors, risk multipliers and everything else are `isAssumed: true`. The UI shows this status everywhere it matters.
Please review and replace values before relying on anything.

## Deploying to Vercel

1. Push the repository to GitHub and import it in Vercel (framework preset: Next.js, defaults are fine).
2. The app is fully static/client-side. No environment variables are needed for MediBayes itself. (`DATABASE_URL` is only used by the template's `/api/health`; remove `src/db` and the health route if you deploy without a database.)
3. Deploy. 3D scenes are lazy-loaded after idle, so first paint is not blocked.

## Assets

See [`public/ASSETS.md`](public/ASSETS.md). The 3D scenes are procedural; no third-party models are used.

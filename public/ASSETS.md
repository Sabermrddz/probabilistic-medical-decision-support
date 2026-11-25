# Assets and licences

## 3D models
**No third-party 3D model files (.glb) are used.** Both 3D scenes are generated procedurally in code
(`src/components/three/HeroScene.tsx`: virus-like particles from an icosahedron + instanced spikes;
`src/components/three/BodySelector.tsx`: a body built from capsules, spheres and cylinders).
They are original work released with this project, so there is nothing to attribute and no
licence risk. If you later swap in a downloaded `.glb` (Sketchfab CC0/CC-BY, Quaternius, Poly Pizza, Kenney),
add a row to the table below with title, author, source URL and licence, and lazy-load it with `useGLTF`.

| Asset | Author | Source | Licence |
| ----- | ------ | ------ | ------- |
| *(none)* | | | |

## Icons
| Asset | Author | Licence |
| ----- | ------ | ------- |
| Lucide icons (`lucide-react`) | Lucide contributors | ISC |

## Fonts
| Asset | Author | Licence |
| ----- | ------ | ------- |
| Geist Sans / Geist Mono (`geist` npm package, self-hosted) | Vercel | SIL Open Font License 1.1 |

## Libraries (runtime)
Next.js (MIT), React (MIT), Tailwind CSS (MIT), Framer Motion (MIT), three.js (MIT), @react-three/fiber and @react-three/drei (MIT),
Recharts (MIT), Zustand (MIT), Zod (MIT), Radix UI (MIT), html-to-image (MIT), jsPDF (MIT), Vitest (MIT).

## Illustrations
No unDraw / Storyset / Lottie assets are used; visuals are CSS, SVG and WebGL generated in code.

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

/** Lightweight CSS stand-in used while the 3D chunk loads, and when WebGL is unavailable. */
function Fallback() {
  return (
    <div className="absolute inset-0 grid place-items-center" aria-hidden>
      <div className="relative h-56 w-56 animate-pulse rounded-full bg-gradient-to-br from-accent/40 to-accent/10 blur-sm sm:h-72 sm:w-72" />
    </div>
  );
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Loads the 3D scene only after the page is idle so it can never block first paint or input. */
export function HeroCanvas() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!hasWebGL()) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const start = () => setReady(true);
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(start, { timeout: 1500 });
      return () => window.cancelIdleCallback?.(id);
    }
    const t = setTimeout(start, 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="absolute inset-0" role="img" aria-label="Decorative 3D scene of floating virus particles">
      <Fallback />
      {ready && (
        <div className="absolute inset-0">
          <HeroScene />
        </div>
      )}
    </div>
  );
}

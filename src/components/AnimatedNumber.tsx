"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect } from "react";

interface Props {
  value: number;
  format?: (v: number) => string;
  className?: string;
}

/** Counts smoothly to `value`; jumps instantly when the user prefers reduced motion. */
export function AnimatedNumber({ value, format = (v) => v.toFixed(1), className }: Props) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(mv, format);
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.6, ease: "easeOut" });
    return () => controls.stop();
  }, [value, reduce, mv]);
  return <motion.span className={className}>{text}</motion.span>;
}

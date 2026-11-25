"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Fade/slide in when scrolled into view. Index staggers siblings. */
export function Reveal({ children, index = 0, className }: { children: ReactNode; index?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.09, ease: "easeOut" }}
      whileHover={{ y: -3 }}
    >
      {children}
    </motion.div>
  );
}

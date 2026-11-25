"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
    </MotionConfig>
  );
}

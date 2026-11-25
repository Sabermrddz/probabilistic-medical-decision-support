"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ReactNode } from "react";

export function Popover({ trigger, children, label }: { trigger: ReactNode; children: ReactNode; label: string }) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          aria-label={label}
          sideOffset={8}
          collisionPadding={12}
          className="z-50 max-h-[70vh] w-80 max-w-[90vw] overflow-auto rounded-2xl border border-border bg-card-solid p-4 text-sm text-foreground shadow-xl"
        >
          {children}
          <PopoverPrimitive.Arrow className="fill-card-solid" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

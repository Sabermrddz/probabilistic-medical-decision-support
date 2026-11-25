"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, Stethoscope, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/diagnosis", label: "Diagnosis" },
  { href: "/explorer", label: "Model explorer" },
  { href: "/sensitivity", label: "Sensitivity" },
  { href: "/patients", label: "Test patients" },
  { href: "/about", label: "Method" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
  }

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Stethoscope size={18} aria-hidden />
          </span>
          <span className="text-lg">MediBayes</span>
        </Link>
        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-accent-soft",
                    active ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-border bg-card-solid/60 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.ul
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-background/95 px-4 lg:hidden"
          >
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block rounded-lg px-3 py-3 text-base font-medium hover:bg-accent-soft">
                  {l.label}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </header>
  );
}

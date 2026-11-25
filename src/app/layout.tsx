import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { ReactNode } from "react";
import { Disclaimer } from "@/components/Disclaimer";
import { Nav } from "@/components/Nav";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MediBayes: probabilistic medical decision support", template: "%s · MediBayes" },
  description:
    "Educational Bayesian, Bayesian-network and Dempster–Shafer reasoning over symptoms and risk factors. Not medical advice.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground"
          >
            Skip to content
          </a>
          <Nav />
          <main id="main" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
            {children}
          </main>
          <footer className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
            <Disclaimer compact />
            <p className="mt-4 text-center text-xs text-muted">
              MediBayes · university mini-project on uncertain reasoning · Bayes&apos; theorem, Bayesian networks, Dempster–Shafer
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}

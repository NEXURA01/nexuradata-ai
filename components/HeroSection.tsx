"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { OrbitalDiagram } from "./OrbitalDiagram";
import { motion } from "framer-motion";

export function HeroSection() {
  const t = useTranslations("hero");
  const pillars = t.raw("pillars") as string[];

  return (
    <section className="relative min-h-screen flex items-center pt-16">
      {/* Technical frame overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-6 font-mono text-[10px] text-muted/50 tracking-widest">
          NXR · 0001 — QUIET MECHANISM
        </div>
        <div className="absolute top-20 right-6 font-mono text-[10px] text-muted/50 tracking-widest">
          MMXXVI / FIG. I
        </div>
        {/* Corner marks */}
        <div className="absolute top-24 left-6 w-4 h-4 border-l border-t border-foreground/10" />
        <div className="absolute top-24 right-6 w-4 h-4 border-r border-t border-foreground/10" />
      </div>

      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-mono text-xs text-muted tracking-[0.2em] uppercase mb-6">
              {t("tagline")}
            </p>

            <h1 className="mb-2">
              <span className="font-serif text-6xl md:text-7xl lg:text-8xl tracking-tight block">
                {t("title")}
              </span>
              <span className="font-serif text-3xl md:text-4xl lg:text-5xl text-muted-foreground tracking-wide">
                {t("subtitle")}
              </span>
            </h1>

            <p className="font-serif text-xl md:text-2xl italic text-muted-foreground mt-6 mb-4">
              {t("slogan")}
            </p>

            <p className="text-lg text-muted-foreground max-w-md mb-8">
              {t("description")}
            </p>

            {/* Pillars */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 mb-10">
              {pillars.map((pillar, i) => (
                <span
                  key={pillar}
                  className="font-mono text-xs tracking-widest text-muted"
                >
                  {pillar}
                  {i < pillars.length - 1 && (
                    <span className="ml-6 text-accent">·</span>
                  )}
                </span>
              ))}
            </div>

            {/* CTA */}
            <Link
              href="/tarifs"
              className="inline-flex items-center gap-3 px-6 py-3 bg-foreground text-background font-mono text-sm uppercase tracking-wider hover:bg-foreground/90 transition-colors"
            >
              {t("cta")}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>

            {/* Established date */}
            <p className="font-mono text-xs text-muted/50 tracking-widest mt-10">
              EST. 2026
            </p>
          </motion.div>

          {/* Right: Orbital Diagram */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="w-full aspect-square max-w-[500px] mx-auto">
              <OrbitalDiagram />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom technical annotation */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <div className="font-mono text-[10px] text-muted/40 tracking-widest">
          AI AUTOMATION ATELIER
        </div>
      </div>
    </section>
  );
}

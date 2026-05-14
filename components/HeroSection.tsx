"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { OrbitalDiagram } from "./OrbitalDiagram";
import { motion } from "framer-motion";

export function HeroSection() {
  const t = useTranslations("hero");
  const pillars = t.raw("pillars") as string[];

  return (
    <section className="relative min-h-screen flex items-center pt-16 technical-grid">
      {/* Technical frame - top */}
      <div className="absolute top-0 left-0 right-0 h-16 border-b border-foreground/10 flex items-center justify-between px-6">
        <span className="ref-number">NXR · 0001 — QUIET MECHANISM</span>
        <span className="ref-number">MMXXVI / FIG. I</span>
      </div>

      {/* Corner registration marks */}
      <div className="absolute top-20 left-6 flex gap-1">
        <div className="w-3 h-px bg-foreground/20" />
        <div className="w-px h-3 bg-foreground/20 -mt-1" />
      </div>
      <div className="absolute top-20 right-6 flex gap-1">
        <div className="w-px h-3 bg-foreground/20 -mt-1" />
        <div className="w-3 h-px bg-foreground/20" />
      </div>

      <div className="max-w-5xl mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <span className="ref-number block mb-6">
              {t("tagline")}
            </span>

            <h1 className="mb-1">
              <span className="heading-austere text-5xl md:text-6xl lg:text-7xl block">
                {t("title")}
              </span>
              <span className="font-serif text-2xl md:text-3xl text-muted-foreground tracking-wide">
                {t("subtitle")}
              </span>
            </h1>

            <p className="font-serif text-lg italic text-muted-foreground mt-4 mb-3">
              {t("slogan")}
            </p>

            <p className="text-dense text-muted-foreground max-w-md mb-8">
              {t("description")}
            </p>

            {/* Pillars - horizontal rule style */}
            <div className="border-t border-b border-foreground/10 py-3 mb-8">
              <div className="flex flex-wrap gap-x-8 gap-y-1">
                {pillars.map((pillar, i) => (
                  <span key={pillar} className="ref-number">
                    {pillar}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA - stark, no rounding */}
            <Link
              href="/evaluation"
              className="inline-flex items-center gap-3 border-y border-foreground/60 px-1 py-2.5 font-mono text-xs uppercase tracking-wider text-foreground hover:border-accent transition-colors"
            >
              {t("cta")}
              <span className="text-accent">→</span>
            </Link>

            <span className="ref-number block mt-8 opacity-40">
              EST. 2026 · MONTRÉAL
            </span>
          </motion.div>

          {/* Right: Orbital Diagram */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hidden lg:block relative"
          >
            {/* Diagram frame */}
            <div className="relative border border-foreground/10 p-4">
              <div className="absolute -top-2 left-4 bg-background px-2">
                <span className="ref-number">ORCHESTRATION</span>
              </div>
              <div className="w-full aspect-square max-w-[420px] mx-auto">
                <OrbitalDiagram />
              </div>
              <div className="absolute -bottom-2 right-4 bg-background px-2">
                <span className="ref-number opacity-50">851 × 315</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom technical annotation */}
      <div className="absolute bottom-0 left-0 right-0 h-12 border-t border-foreground/10 flex items-center justify-between px-6">
        <span className="ref-number opacity-40">AI AUTOMATION ATELIER</span>
        <span className="ref-number opacity-40">COVER PLATE</span>
      </div>
    </section>
  );
}

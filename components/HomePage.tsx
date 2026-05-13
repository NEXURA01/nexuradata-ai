"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { OrbitalDiagram } from "@/components/OrbitalDiagram";

export function HomePage() {
  const t = useTranslations();

  return (
    <main className="min-h-screen">
      {/* Hero - Plate I */}
      <section className="relative min-h-screen flex flex-col">
        {/* Technical frame - top */}
        <div className="absolute top-0 left-0 right-0 h-12 border-b border-foreground/10 flex items-center justify-between px-6">
          <span className="font-mono text-[10px] tracking-[0.2em] text-foreground/50">
            NXR · 0001 — QUIET MECHANISM
          </span>
          <span className="font-mono text-[10px] tracking-[0.2em] text-foreground/50">
            MMXXVI / FIG. I
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center pt-12">
          <div className="w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Typography */}
            <div className="lg:border-l-2 border-foreground/20 lg:pl-8">
              <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-foreground/60 mb-6">
                {t("hero.tagline")}
              </p>
              
              <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-normal tracking-tight text-foreground leading-[0.9] mb-2">
                Nexura
              </h1>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light italic text-foreground/70 mb-1">
                Analytics
              </h2>
              <p className="font-serif text-lg md:text-xl italic text-foreground/60 mb-8">
                AI automation, quietly engineered.
              </p>

              <div className="flex flex-wrap gap-4 font-mono text-[9px] tracking-[0.2em] uppercase text-foreground/50 mb-12">
                <span>EST. 2026</span>
                <span>·</span>
                <span>AGENTS</span>
                <span>·</span>
                <span>PIPELINES</span>
                <span>·</span>
                <span>OBSERVABILITY</span>
              </div>

              <Link
                href="/operational-assessment"
                className="inline-flex items-center justify-center px-8 py-4 bg-foreground text-background font-mono text-[10px] tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors"
              >
                {t("hero.cta")} →
              </Link>
            </div>

            {/* Right: Orbital Diagram */}
            <div className="relative">
              <div className="font-mono text-[9px] tracking-[0.2em] text-foreground/50 text-center mb-4">
                FIG. II · ORCHESTRATION OF AGENTS
              </div>
              <OrbitalDiagram />
            </div>
          </div>
        </div>

        {/* Technical frame - bottom */}
        <div className="h-12 border-t border-foreground/10 flex items-center justify-between px-6">
          <span className="font-mono text-[10px] tracking-[0.2em] text-foreground/50">
            AI AUTOMATION ATELIER
          </span>
          <span className="font-mono text-[10px] tracking-[0.2em] text-foreground/50">
            COVER PLATE
          </span>
        </div>
      </section>

      {/* Dark Section - "Sovereign data" */}
      <section className="bg-foreground text-background py-32">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-background/50 mb-8">
            CANADA — EST. 2026
          </p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal leading-tight mb-8">
            Sovereign data,<br />
            engineered<br />
            in silence.
          </h2>
          <p className="font-sans text-lg md:text-xl text-background/60 max-w-xl">
            Private infrastructure for organizations that operate beyond the visible layer.
          </p>
        </div>
      </section>

      {/* Problem */}
      <section className="py-24 border-t border-foreground/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-baseline gap-4 mb-16">
            <span className="font-mono text-[10px] tracking-[0.2em] text-foreground/50">01</span>
            <h2 className="font-mono text-[11px] tracking-[0.25em] uppercase text-foreground">
              {t("problem.title")}
            </h2>
          </div>
          <div className="grid md:grid-cols-5 gap-8">
            {(t.raw("problem.items") as Array<{ label: string; desc: string }>).map(
              (item, i) => (
                <div key={i} className="border-t border-foreground/15 pt-6">
                  <div className="font-mono text-[9px] tracking-[0.2em] text-foreground/50 mb-3">
                    P-0{i + 1}
                  </div>
                  <h3 className="font-serif text-xl mb-2 text-foreground">{item.label}</h3>
                  <p className="text-sm leading-relaxed text-foreground/70">{item.desc}</p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section id="platform" className="py-24 border-t border-foreground/10 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-baseline gap-4 mb-16">
            <span className="font-mono text-[10px] tracking-[0.2em] text-foreground/50">02</span>
            <h2 className="font-mono text-[11px] tracking-[0.25em] uppercase text-foreground">
              {t("solution.title")}
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {(t.raw("solution.items") as Array<{ label: string; desc: string }>).map(
              (item, i) => (
                <div key={i} className="border-l-2 border-foreground/20 pl-6">
                  <div className="font-mono text-[9px] tracking-[0.2em] text-foreground/50 mb-3">
                    S-0{i + 1}
                  </div>
                  <h3 className="font-serif text-xl mb-2 text-foreground">{item.label}</h3>
                  <p className="text-sm leading-relaxed text-foreground/70">{item.desc}</p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 border-t border-foreground/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-baseline gap-4 mb-16">
            <span className="font-mono text-[10px] tracking-[0.2em] text-foreground/50">03</span>
            <h2 className="font-mono text-[11px] tracking-[0.25em] uppercase text-foreground">
              {t("howItWorks.title")}
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-12">
            {(
              t.raw("howItWorks.steps") as Array<{
                num: string;
                label: string;
                desc: string;
              }>
            ).map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="font-serif text-6xl text-foreground/10 mb-4">
                  {step.num}
                </div>
                <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3 text-foreground">
                  {step.label}
                </h3>
                <p className="text-sm leading-relaxed text-foreground/70">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark CTA - "l'accès se mérite" */}
      <section className="bg-foreground text-background py-32">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="font-mono text-[10px] tracking-[0.2em] text-background/40 mb-8">
            NEXURA
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light italic leading-tight mb-4">
            {t("finalCta.headline")}
          </h2>
          <p className="text-background/50 text-sm mb-12">
            {t("finalCta.subheadline")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/operational-assessment"
              className="inline-flex items-center justify-center px-8 py-4 border border-background/30 text-background font-mono text-[10px] tracking-[0.2em] uppercase hover:bg-background/10 transition-colors"
            >
              {t("finalCta.cta")}
            </Link>
            <span className="font-mono text-[10px] tracking-[0.2em] text-background/30">
              — NEXURA.CA
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

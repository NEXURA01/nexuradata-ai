"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { OrbitalDiagram } from "@/components/OrbitalDiagram";

export function HomePage() {
  const t = useTranslations();

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center technical-grid">
        <div className="absolute top-4 left-6 ref-number">NXR · 0001</div>
        <div className="absolute top-4 right-6 ref-number">FIG. I</div>

        <div className="w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="heading-austere text-5xl md:text-6xl lg:text-7xl text-foreground mb-4">
              {t("hero.title1")}
              <br />
              <span className="text-accent">{t("hero.title2")}</span>
            </h1>
            <p className="text-dense text-muted-foreground max-w-lg mt-6 mb-8">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/operational-assessment"
                className="inline-flex items-center justify-center px-6 py-3 bg-foreground text-background font-mono text-xs tracking-widest uppercase hover:bg-accent transition-colors"
              >
                {t("hero.cta")}
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center px-6 py-3 border border-foreground/20 font-mono text-xs tracking-widest uppercase hover:border-foreground/40 transition-colors"
              >
                {t("hero.secondary")}
              </a>
            </div>
          </div>
          <div className="relative flex justify-center">
            <OrbitalDiagram />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-baseline gap-4 mb-12">
            <span className="ref-number">01</span>
            <h2 className="font-mono text-sm tracking-widest uppercase text-muted-foreground">
              {t("problem.title")}
            </h2>
          </div>
          <div className="grid md:grid-cols-5 gap-px bg-border">
            {(t.raw("problem.items") as Array<{ label: string; desc: string }>).map(
              (item, i) => (
                <div key={i} className="bg-background p-6">
                  <div className="ref-number mb-2">P-0{i + 1}</div>
                  <h3 className="font-serif text-lg mb-2">{item.label}</h3>
                  <p className="text-dense text-muted-foreground">{item.desc}</p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section id="platform" className="py-24 border-t border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-baseline gap-4 mb-12">
            <span className="ref-number">02</span>
            <h2 className="font-mono text-sm tracking-widest uppercase text-muted-foreground">
              {t("solution.title")}
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-px bg-border">
            {(t.raw("solution.items") as Array<{ label: string; desc: string }>).map(
              (item, i) => (
                <div key={i} className="bg-surface p-6 border-l-2 border-accent">
                  <div className="ref-number mb-2">S-0{i + 1}</div>
                  <h3 className="font-serif text-lg mb-2">{item.label}</h3>
                  <p className="text-dense text-muted-foreground">{item.desc}</p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-baseline gap-4 mb-12">
            <span className="ref-number">03</span>
            <h2 className="font-mono text-sm tracking-widest uppercase text-muted-foreground">
              {t("howItWorks.title")}
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
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
                <div className="text-6xl font-serif text-accent/20 mb-2">
                  {step.num}
                </div>
                <h3 className="font-mono text-sm tracking-wide uppercase mb-2">
                  {step.label}
                </h3>
                <p className="text-dense text-muted-foreground">{step.desc}</p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 right-0 w-1/2 h-px bg-border" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Preview */}
      <section className="py-24 border-t border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-baseline gap-4 mb-12">
            <span className="ref-number">04</span>
            <h2 className="font-mono text-sm tracking-widest uppercase text-muted-foreground">
              {t("workflowPreview.title")}
            </h2>
          </div>
          <div className="max-w-md mx-auto border border-border bg-background p-6">
            <div className="ref-number mb-4">WORKFLOW STATUS</div>
            {(
              t.raw("workflowPreview.items") as Array<{
                status: string;
                label: string;
              }>
            ).map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-3 border-b border-border last:border-0"
              >
                <div
                  className={`w-2 h-2 ${
                    item.status === "complete" ? "bg-accent" : "bg-muted"
                  }`}
                />
                <span
                  className={`text-dense ${
                    item.status === "pending"
                      ? "text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {item.label}
                </span>
                {item.status === "complete" && (
                  <span className="ml-auto ref-number">DONE</span>
                )}
                {item.status === "pending" && (
                  <span className="ml-auto ref-number text-accent">PENDING</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="heading-austere text-4xl md:text-5xl text-foreground mb-8">
            {t("finalCta.title")}
          </h2>
          <Link
            href="/operational-assessment"
            className="inline-flex items-center justify-center px-8 py-4 bg-accent text-accent-foreground font-mono text-xs tracking-widest uppercase hover:bg-foreground transition-colors"
          >
            {t("finalCta.cta")}
          </Link>
        </div>
      </section>
    </main>
  );
}

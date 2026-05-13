"use client";

import { useTranslations } from "next-intl";
import { SectionReveal } from "./SectionReveal";

export function EvaluationContent() {
  const t = useTranslations("evaluation");
  const benefits = t.raw("benefits") as string[];

  return (
    <section className="pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <SectionReveal>
            <div>
              <span className="font-mono text-[10px] text-muted tracking-widest block mb-4">
                NXR · ASSESSMENT
              </span>
              <h1 className="font-serif text-4xl md:text-5xl mb-4">
                {t("title")}
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                {t("subtitle")}
              </p>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {t("description")}
              </p>

              {/* Benefits */}
              <ul className="space-y-4 mb-10">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-accent mt-0.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <a
                href="mailto:contact@nexuradata.ca?subject=Demande d'évaluation"
                className="inline-flex items-center gap-3 border-y border-accent/70 px-1 py-3 font-mono text-xs uppercase tracking-[0.24em] text-foreground hover:border-foreground transition-colors"
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
              </a>
            </div>
          </SectionReveal>

          {/* Right: Visual placeholder */}
          <SectionReveal delay={0.2}>
            <div className="hidden md:block">
              <div className="aspect-square bg-surface border border-border p-8 flex items-center justify-center">
                {/* Simple orbital graphic */}
                <svg viewBox="0 0 200 200" className="w-full h-full opacity-50">
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    opacity="0.3"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    opacity="0.3"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    opacity="0.3"
                  />
                  <circle cx="100" cy="100" r="3" fill="currentColor" />
                  <circle cx="100" cy="20" r="4" className="fill-accent" />
                </svg>
              </div>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}

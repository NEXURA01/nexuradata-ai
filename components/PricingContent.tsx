"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SectionReveal } from "./SectionReveal";

export function PricingContent() {
  const t = useTranslations("pricing");

  const tiers = ["assessment", "implementation", "support"] as const;

  return (
    <section className="pt-32 pb-24">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <SectionReveal>
          <div className="text-center mb-16">
            <span className="font-mono text-[10px] text-muted tracking-widest block mb-4">
              NXR · 0003
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-4">
              {t("title")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              {t("subtitle")}
            </p>
          </div>
        </SectionReveal>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier, index) => {
            const features = t.raw(`${tier}.features`) as string[];
            const isHighlighted = tier === "implementation";

            return (
              <SectionReveal key={tier} delay={index * 0.1}>
                <div
                  className={`relative p-8 border transition-colors h-full flex flex-col ${
                    isHighlighted
                      ? "border-accent bg-surface/50"
                      : "border-border bg-background hover:border-accent/30"
                  }`}
                >
                  {/* Tier number */}
                  <span className="font-mono text-[10px] text-muted tracking-widest">
                    N-0{index + 1}
                  </span>

                  {/* Title */}
                  <h2 className="font-serif text-2xl mt-2 mb-2">
                    {t(`${tier}.title`)}
                  </h2>

                  {/* Price */}
                  <p className="font-serif text-3xl md:text-4xl text-accent mb-4">
                    {t(`${tier}.price`)}
                  </p>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    {t(`${tier}.description`)}
                  </p>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <svg
                          className="w-4 h-4 text-accent mt-0.5 shrink-0"
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
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={tier === "support" ? "/contact" : "/evaluation"}
                    className={`block text-center px-6 py-3 font-mono text-sm uppercase tracking-wider transition-colors ${
                      isHighlighted
                        ? "bg-accent text-accent-foreground hover:opacity-90"
                        : "bg-foreground text-background hover:bg-foreground/90"
                    }`}
                  >
                    {t(`${tier}.cta`)}
                  </Link>

                  {/* Accent line for highlighted */}
                  {isHighlighted && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />
                  )}
                </div>
              </SectionReveal>
            );
          })}
        </div>

        {/* Note */}
        <SectionReveal delay={0.3}>
          <p className="text-center text-sm text-muted font-mono">
            {t("note")}
          </p>
        </SectionReveal>
      </div>
    </section>
  );
}

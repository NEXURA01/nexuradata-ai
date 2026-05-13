"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SectionReveal } from "./SectionReveal";

export function PricingContent() {
  const t = useTranslations("pricing");

  const tiers = ["assessment", "implementation", "support"] as const;

  return (
    <section className="pt-28 pb-20 technical-grid">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header - technical style */}
        <SectionReveal>
          <div className="border-b border-foreground/10 pb-4 mb-12">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="ref-number block mb-2">FIG. III — PRICING</span>
                <h1 className="heading-austere text-3xl md:text-4xl">{t("title")}</h1>
              </div>
              <span className="ref-number hidden md:block">PLATE III / MMXXVI</span>
            </div>
            <p className="text-dense text-muted-foreground mt-3 max-w-lg">
              {t("subtitle")}
            </p>
          </div>
        </SectionReveal>

        {/* Pricing Grid - technical spec style */}
        <div className="grid md:grid-cols-3 gap-px bg-foreground/10 mb-8">
          {tiers.map((tier, index) => {
            const features = t.raw(`${tier}.features`) as string[];
            const isHighlighted = tier === "implementation";

            return (
              <SectionReveal key={tier} delay={index * 0.05}>
                <div
                  className={`bg-background p-6 h-full flex flex-col ${
                    isHighlighted ? "border-t-2 border-t-accent" : ""
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <span className="ref-number">N-0{index + 1}</span>
                    <span className="ref-number text-accent">
                      {tier.toUpperCase()}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="font-serif text-xl mb-1">{t(`${tier}.title`)}</h2>

                  {/* Price */}
                  <p className="font-serif text-2xl text-accent mb-4">
                    {t(`${tier}.price`)}
                  </p>

                  {/* Description */}
                  <p className="text-dense text-muted-foreground mb-6">
                    {t(`${tier}.description`)}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-dense">
                        <span className="text-accent">+</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={tier === "support" ? "/contact" : "/evaluation"}
                    className={`block text-center px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                      isHighlighted
                        ? "bg-accent text-accent-foreground hover:opacity-90"
                        : "bg-foreground text-background hover:bg-accent"
                    }`}
                  >
                    {t(`${tier}.cta`)}
                  </Link>

                  {/* Bottom ref */}
                  <div className="flex items-center gap-2 mt-6 pt-4 border-t border-foreground/5">
                    <div className="tick-mark" />
                    <div className="tick-mark" />
                    <span className="ref-number ml-auto opacity-50">
                      REF.{(index + 1).toString().padStart(3, "0")}
                    </span>
                  </div>
                </div>
              </SectionReveal>
            );
          })}
        </div>

        {/* Note */}
        <SectionReveal delay={0.15}>
          <p className="text-center ref-number opacity-50">{t("note")}</p>
        </SectionReveal>
      </div>
    </section>
  );
}

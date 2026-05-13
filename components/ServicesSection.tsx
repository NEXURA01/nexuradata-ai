"use client";

import { useTranslations } from "next-intl";
import { SectionReveal } from "./SectionReveal";

export function ServicesSection() {
  const t = useTranslations("services");

  const services = ["agents", "pipelines", "observability", "governance"] as const;

  return (
    <section className="py-20 md:py-28 technical-grid">
      <div className="max-w-5xl mx-auto px-6">
        {/* Section header - technical style */}
        <SectionReveal>
          <div className="flex items-baseline justify-between border-b border-foreground/10 pb-4 mb-12">
            <div>
              <span className="ref-number block mb-2">FIG. II — CAPABILITIES</span>
              <h2 className="heading-austere text-3xl md:text-4xl">{t("title")}</h2>
            </div>
            <span className="ref-number hidden md:block">PLATE II / MMXXVI</span>
          </div>
        </SectionReveal>

        {/* Services grid - technical spec layout */}
        <div className="grid md:grid-cols-2 gap-px bg-foreground/10">
          {services.map((service, index) => (
            <SectionReveal key={service} delay={index * 0.05}>
              <div className="bg-background p-6 md:p-8 group">
                {/* Header row */}
                <div className="flex items-start justify-between mb-4">
                  <span className="ref-number">N-0{index + 1}</span>
                  <span className="ref-number text-accent">
                    {service.toUpperCase()}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-serif text-xl mb-3 group-hover:text-accent transition-colors">
                  {t(`items.${service}.title`)}
                </h3>

                {/* Description - dense text */}
                <p className="text-dense text-muted-foreground">
                  {t(`items.${service}.description`)}
                </p>

                {/* Bottom reference line */}
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-foreground/5">
                  <div className="tick-mark" />
                  <div className="tick-mark" />
                  <div className="tick-mark" />
                  <span className="ref-number ml-auto opacity-50">
                    REF.{(index + 1).toString().padStart(3, "0")}
                  </span>
                </div>
              </div>
            </SectionReveal>
          ))}
        </div>

        {/* Bottom annotation */}
        <div className="flex justify-center mt-8">
          <span className="ref-number opacity-50">
            NEXURA ANALYTICS · OPERATIONAL INTELLIGENCE
          </span>
        </div>
      </div>
    </section>
  );
}

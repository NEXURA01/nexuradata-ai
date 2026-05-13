"use client";

import { useTranslations } from "next-intl";
import { SectionReveal } from "./SectionReveal";

const serviceIcons = {
  agents: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  pipelines: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  observability: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  governance: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
};

export function ServicesSection() {
  const t = useTranslations("services");

  const services = ["agents", "pipelines", "observability", "governance"] as const;

  return (
    <section className="py-24 md:py-32 bg-surface/30">
      <div className="max-w-6xl mx-auto px-6">
        <SectionReveal>
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl mb-4">{t("title")}</h2>
            <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
          </div>
        </SectionReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <SectionReveal key={service} delay={index * 0.1}>
              <div className="group p-6 bg-background border border-border hover:border-accent/30 transition-colors">
                {/* Icon */}
                <div className="text-muted-foreground group-hover:text-accent transition-colors mb-4">
                  {serviceIcons[service]}
                </div>

                {/* Number */}
                <span className="font-mono text-[10px] text-muted tracking-widest">
                  N-0{index + 1}
                </span>

                {/* Title */}
                <h3 className="font-serif text-xl mt-2 mb-3">
                  {t(`items.${service}.title`)}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`items.${service}.description`)}
                </p>

                {/* Bottom line accent */}
                <div className="mt-6 h-px bg-border group-hover:bg-accent/30 transition-colors" />
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

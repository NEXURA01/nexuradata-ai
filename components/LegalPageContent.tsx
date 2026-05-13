"use client";

import { useTranslations } from "next-intl";
import { SectionReveal } from "./SectionReveal";

interface LegalPageContentProps {
  pageKey: "privacy" | "terms";
}

const sectionKeys = {
  privacy: ["collection", "use", "sharing", "retention", "rights", "contact"],
  terms: ["services", "obligations", "payment", "liability", "ip", "termination"],
};

export function LegalPageContent({ pageKey }: LegalPageContentProps) {
  const t = useTranslations(pageKey);

  return (
    <section className="pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <SectionReveal>
          <div className="mb-12">
            <span className="font-mono text-[10px] text-muted tracking-widest block mb-4">
              NXR · LEGAL
            </span>
            <h1 className="font-serif text-4xl md:text-5xl mb-4">
              {t("title")}
            </h1>
            <p className="font-mono text-sm text-muted">{t("lastUpdated")}</p>
          </div>
        </SectionReveal>

        {/* Introduction */}
        <SectionReveal delay={0.1}>
          <p className="text-lg text-muted-foreground leading-relaxed mb-12">
            {t("intro")}
          </p>
        </SectionReveal>

        {/* Sections */}
        <div className="space-y-10">
          {sectionKeys[pageKey].map((section, index) => (
            <SectionReveal key={section} delay={0.1 + index * 0.05}>
              <div className="border-t border-border pt-8">
                <h2 className="font-serif text-2xl mb-4">
                  {t(`sections.${section}.title`)}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t(`sections.${section}.content`)}
                </p>
              </div>
            </SectionReveal>
          ))}
        </div>

        {/* Footer note */}
        <SectionReveal delay={0.5}>
          <div className="mt-16 pt-8 border-t border-border">
            <p className="font-mono text-xs text-muted text-center">
              © 2026 NEXURA ANALYTICS · MONTRÉAL, QUÉBEC
            </p>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

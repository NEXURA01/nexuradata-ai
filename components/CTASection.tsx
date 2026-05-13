"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SectionReveal } from "./SectionReveal";

export function CTASection() {
  const t = useTranslations("cta");

  return (
    <section className="py-24 md:py-32">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <SectionReveal>
          {/* Technical frame number */}
          <span className="font-mono text-[10px] text-muted tracking-widest block mb-6">
            NXR · 0002
          </span>

          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-6 text-balance">
            {t("title")}
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t("description")}
          </p>

          <Link
            href="/tarifs"
            className="inline-flex items-center gap-3 px-8 py-4 bg-accent text-accent-foreground font-mono text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            {t("button")}
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
        </SectionReveal>
      </div>
    </section>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";

type PricingItem = {
  title: string;
  range: string;
  desc: string;
};

export function PricingContent() {
  const t = useTranslations("pricing");
  const items = t.raw("items") as PricingItem[];

  return (
    <main className="min-h-screen pt-20 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-16">
          <div className="ref-number mb-4">NXR · PRICING</div>
          <h1 className="heading-austere text-4xl md:text-5xl text-foreground mb-4">
            {t("title")}
          </h1>
          <p className="text-dense text-muted-foreground max-w-lg">
            {t("subtitle")}
          </p>
        </div>

        {/* Pricing Table */}
        <div className="border border-border overflow-x-auto">
          {/* Header Row */}
          <div className="grid grid-cols-3 gap-0 p-4 bg-surface border-b border-border sticky top-0 min-w-min">
            <div className="ref-number whitespace-nowrap">SERVICE</div>
            <div className="ref-number whitespace-nowrap">PRIX</div>
            <div className="ref-number whitespace-nowrap">DESCRIPTION</div>
          </div>

          {/* Pricing Rows */}
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="grid grid-cols-3 gap-0 p-4 border-b border-border last:border-0 hover:bg-surface/50 transition-colors min-w-min"
            >
              <div className="font-serif text-sm line-clamp-2">{item.title}</div>
              <div className="font-mono text-accent text-sm">{item.range}</div>
              <div className="text-dense text-muted-foreground text-sm line-clamp-2">{item.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Note */}
        <p className="ref-number text-center mt-8 opacity-60">{t("note")}</p>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/operational-assessment"
            className="inline-flex items-center justify-center border-y border-foreground/70 px-1 py-3 font-mono text-xs tracking-widest uppercase text-foreground hover:border-accent transition-colors"
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </main>
  );
}

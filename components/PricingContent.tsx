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
        <div className="border border-border">
          {/* Header Row */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-surface border-b border-border">
            <div className="ref-number">SERVICE</div>
            <div className="ref-number">RANGE</div>
            <div className="ref-number">DESCRIPTION</div>
          </div>

          {/* Pricing Rows */}
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="grid grid-cols-3 gap-4 p-4 border-b border-border last:border-0 hover:bg-surface/50 transition-colors"
            >
              <div className="font-serif">{item.title}</div>
              <div className="font-mono text-accent">{item.range}</div>
              <div className="text-dense text-muted-foreground">{item.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Note */}
        <p className="ref-number text-center mt-8 opacity-60">{t("note")}</p>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/operational-assessment"
            className="inline-flex items-center justify-center px-8 py-4 bg-foreground text-background font-mono text-xs tracking-widest uppercase hover:bg-accent transition-colors"
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </main>
  );
}

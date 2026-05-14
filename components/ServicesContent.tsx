"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";

type ServiceItem = {
  id: string;
  title: string;
  desc: string;
};

export function ServicesContent() {
  const t = useTranslations("services");
  const items = t.raw("items") as ServiceItem[];

  return (
    <main className="min-h-screen pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-16">
          <div className="ref-number mb-4">NXR · SERVICES</div>
          <h1 className="heading-austere text-4xl md:text-5xl text-foreground mb-4">
            {t("title")}
          </h1>
          <p className="text-dense text-muted-foreground max-w-lg">
            {t("subtitle")}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-px bg-border">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-background p-8 group"
            >
              <div className="ref-number mb-4">SRV-0{i + 1}</div>
              <h2 className="font-serif text-2xl mb-4">{item.title}</h2>
              <p className="text-dense text-muted-foreground mb-6">
                {item.desc}
              </p>
              <Link
                href={`/operational-assessment?type=${item.id}`}
                className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-accent hover:text-foreground transition-colors"
              >
                {t("cta")}
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}

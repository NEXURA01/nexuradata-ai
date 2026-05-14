"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";

export function PaymentSuccessContent() {
  const t = useTranslations("paymentSuccess");

  const items = t.raw("items") as Array<{ status: string; label: string }>;

  return (
    <main className="min-h-screen pt-20 pb-24 flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="border border-border bg-surface p-8"
        >
          <div className="ref-number mb-6 text-accent">CONFIRMED</div>
          
          <h1 className="heading-austere text-3xl text-foreground mb-8">
            {t("title")}
          </h1>

          <div className="text-left mb-8">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-3 border-b border-border last:border-0"
              >
                <div
                  className={`w-2 h-2 ${
                    item.status === "complete" ? "bg-accent" : "bg-muted"
                  }`}
                />
                <span
                  className={`text-dense ${
                    item.status === "pending"
                      ? "text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <p className="text-dense text-muted-foreground mb-8">
            {t("nextStep")}
          </p>

          <Link
            href="/portal"
            className="inline-flex items-center justify-center w-full border-y border-foreground/70 px-6 py-4 font-mono text-xs tracking-widest uppercase text-foreground hover:border-accent transition-colors"
          >
            {t("cta")}
          </Link>
        </motion.div>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { SectionReveal } from "./SectionReveal";

export function NewsletterSection() {
  const t = useTranslations("newsletter");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });

      if (response.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="py-24 md:py-32 bg-surface/50 border-t border-border">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <SectionReveal>
          <h2 className="font-serif text-3xl md:text-4xl mb-4">{t("title")}</h2>
          <p className="text-muted-foreground mb-8">{t("description")}</p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("placeholder")}
              required
              className="flex-1 px-4 py-3 bg-background border border-border font-mono text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              disabled={status === "loading"}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-6 py-3 bg-foreground text-background font-mono text-sm uppercase tracking-wider hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {status === "loading" ? "..." : t("button")}
            </button>
          </form>

          {status === "success" && (
            <p className="mt-4 text-sm text-accent font-mono">{t("success")}</p>
          )}
          {status === "error" && (
            <p className="mt-4 text-sm text-red-600 font-mono">{t("error")}</p>
          )}
        </SectionReveal>
      </div>
    </section>
  );
}

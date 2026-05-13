"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SectionReveal } from "./SectionReveal";

export function ContactContent() {
  const t = useTranslations("contact");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    // TODO: Implement contact form submission
    // For now, simulate success
    await new Promise((r) => setTimeout(r, 1000));
    setStatus("success");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <section className="pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16">
          {/* Left: Info */}
          <SectionReveal>
            <div>
              <span className="font-mono text-[10px] text-muted tracking-widest block mb-4">
                NXR · CONTACT
              </span>
              <h1 className="font-serif text-4xl md:text-5xl mb-4">
                {t("title")}
              </h1>
              <p className="text-muted-foreground mb-8">{t("subtitle")}</p>

              <div className="space-y-6">
                <div>
                  <span className="font-mono text-xs text-muted tracking-widest block mb-2">
                    COURRIEL
                  </span>
                  <a
                    href={`mailto:${t("email")}`}
                    className="text-lg hover:text-accent transition-colors"
                  >
                    {t("email")}
                  </a>
                </div>

                <div>
                  <span className="font-mono text-xs text-muted tracking-widest block mb-2">
                    LOCATION
                  </span>
                  <p className="text-lg">{t("location")}</p>
                </div>
              </div>
            </div>
          </SectionReveal>

          {/* Right: Form */}
          <SectionReveal delay={0.1}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest block mb-2">
                  {t("form.name")}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-surface border border-border font-mono text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="font-mono text-xs text-muted tracking-widest block mb-2">
                  {t("form.email")}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-surface border border-border font-mono text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="font-mono text-xs text-muted tracking-widest block mb-2">
                  {t("form.message")}
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-surface border border-border font-mono text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full px-6 py-4 bg-foreground text-background font-mono text-sm uppercase tracking-wider hover:bg-foreground/90 transition-colors disabled:opacity-50"
              >
                {status === "loading" ? "..." : t("form.submit")}
              </button>

              {status === "success" && (
                <p className="text-sm text-accent font-mono text-center">
                  {t("form.success")}
                </p>
              )}
              {status === "error" && (
                <p className="text-sm text-red-600 font-mono text-center">
                  {t("form.error")}
                </p>
              )}
            </form>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}

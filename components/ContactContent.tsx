"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export function ContactContent() {
  const t = useTranslations("contact");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    await new Promise((r) => setTimeout(r, 1000));
    setStatus("success");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <main className="min-h-screen pt-20 pb-24">
      <div className="max-w-xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="ref-number mb-4">NXR · CONTACT</div>
          <h1 className="heading-austere text-4xl md:text-5xl text-foreground mb-4">
            {t("title")}
          </h1>
          <p className="text-dense text-muted-foreground">{t("subtitle")}</p>
        </div>

        {status === "success" ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-border bg-surface p-8 text-center"
          >
            <div className="ref-number text-accent mb-4">SENT</div>
            <p className="text-dense">{t("success")}</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="contact-name" className="ref-number block mb-2">{t("form.name")}</label>
              <input
                id="contact-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 bg-surface border border-border text-foreground focus:border-accent focus:outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="contact-email" className="ref-number block mb-2">{t("form.email")}</label>
              <input
                id="contact-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 bg-surface border border-border text-foreground focus:border-accent focus:outline-none"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="contact-message" className="ref-number block mb-2">{t("form.message")}</label>
              <textarea
                id="contact-message"
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-3 bg-surface border border-border text-foreground focus:border-accent focus:outline-none resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full px-6 py-4 bg-foreground text-background font-mono text-xs tracking-widest uppercase hover:bg-accent transition-colors disabled:opacity-50"
            >
              {status === "loading" ? "..." : t("form.submit")}
            </button>
          </form>
        )}

        {/* Email Alternative */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <span className="ref-number text-muted-foreground block mb-2">
            OR EMAIL DIRECTLY
          </span>
          <a
            href={`mailto:${t("email")}`}
            className="font-mono text-accent hover:underline"
          >
            {t("email")}
          </a>
        </div>
      </div>
    </main>
  );
}

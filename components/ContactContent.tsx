"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";

export function ContactContent() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const isFr = locale === "fr";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });

      if (!response.ok) {
        throw new Error("contact-failed");
      }

      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen pt-20 pb-24">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="ref-number mb-4">NXR · CONTACT</div>
          <h1 className="font-serif text-5xl leading-[0.98] text-foreground mb-6 md:text-7xl">
            {t("title")}
          </h1>
          <p className="max-w-xl text-xl leading-relaxed text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="mb-12 border-y border-border py-8">
          <span className="ref-number text-muted-foreground block mb-4">
            {isFr ? "ÉCRIRE DIRECTEMENT" : "EMAIL DIRECTLY"}
          </span>
          <a
            href={`mailto:${t("email")}`}
            className="break-all font-serif text-4xl leading-none text-foreground transition-opacity hover:opacity-70 md:text-6xl"
          >
            {t("email")}
          </a>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {isFr
              ? "C'est le chemin le plus simple. Pour un projet ou une question, envoyez un courriel et l'équipe vous répond."
              : "This is the simplest path. For a project or question, send an email and the team will reply."}
          </p>
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
            <div className="ref-number text-muted-foreground">
              {isFr ? "OU UTILISER LE FORMULAIRE" : "OR USE THE FORM"}
            </div>
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
              className="w-full border-y border-foreground/70 px-6 py-4 font-mono text-xs tracking-widest uppercase text-foreground hover:border-accent transition-colors disabled:opacity-50"
            >
              {status === "loading" ? "..." : t("form.submit")}
            </button>
            {status === "error" && (
              <p className="text-sm leading-relaxed text-accent">
                {isFr
                  ? "Le formulaire n'a pas pu envoyer le message. Écrivez directement à contact@nexuradata.ca."
                  : "The form could not send the message. Email contact@nexuradata.ca directly."}
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}

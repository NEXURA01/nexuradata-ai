"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

type EstimateResult = {
  complexity: string;
  scope: string;
  range: string;
  nextStep: string;
};

export function AssessmentForm() {
  const t = useTranslations("assessment");
  const locale = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [formData, setFormData] = useState({
    company: "",
    name: "",
    email: "",
    problem: "",
    tools: "",
    teams: "",
    urgency: "Medium",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, locale }),
      });

      if (!response.ok) throw new Error("Failed to submit");

      const data = await response.json();
      setEstimate(data.estimate);
    } catch (error) {
      console.error("Assessment error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: "operational-review",
          email: formData.email,
          locale,
        }),
      });

      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const urgencyOptions = t.raw("form.urgencyOptions") as string[];

  return (
    <main className="min-h-screen pt-20 pb-24">
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="ref-number mb-4">NXR · ASSESSMENT</div>
          <h1 className="heading-austere text-4xl md:text-5xl text-foreground mb-4">
            {t("title")}
          </h1>
          <p className="text-dense text-muted-foreground">{t("subtitle")}</p>
        </div>

        <AnimatePresence mode="wait">
          {!estimate ? (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Company */}
              <div>
                <label htmlFor="assessment-company" className="ref-number block mb-2">{t("form.company")}</label>
                <input
                  id="assessment-company"
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-border text-foreground focus:border-accent focus:outline-none"
                />
              </div>

              {/* Name */}
              <div>
                <label htmlFor="assessment-name" className="ref-number block mb-2">{t("form.name")}</label>
                <input
                  id="assessment-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-border text-foreground focus:border-accent focus:outline-none"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="assessment-email" className="ref-number block mb-2">{t("form.email")}</label>
                <input
                  id="assessment-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-border text-foreground focus:border-accent focus:outline-none"
                />
              </div>

              {/* Problem */}
              <div>
                <label htmlFor="assessment-problem" className="ref-number block mb-2">{t("form.problem")}</label>
                <textarea
                  id="assessment-problem"
                  required
                  rows={4}
                  value={formData.problem}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                  placeholder={t("form.problemPlaceholder")}
                  className="w-full px-4 py-3 bg-surface border border-border text-foreground focus:border-accent focus:outline-none resize-none"
                />
              </div>

              {/* Tools */}
              <div>
                <label htmlFor="assessment-tools" className="ref-number block mb-2">{t("form.tools")}</label>
                <input
                  id="assessment-tools"
                  type="text"
                  value={formData.tools}
                  onChange={(e) => setFormData({ ...formData, tools: e.target.value })}
                  placeholder={t("form.toolsPlaceholder")}
                  className="w-full px-4 py-3 bg-surface border border-border text-foreground focus:border-accent focus:outline-none"
                />
              </div>

              {/* Teams + Urgency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="assessment-teams" className="ref-number block mb-2">{t("form.teams")}</label>
                  <input
                    id="assessment-teams"
                    type="number"
                    min="1"
                    value={formData.teams}
                    onChange={(e) => setFormData({ ...formData, teams: e.target.value })}
                    className="w-full px-4 py-3 bg-surface border border-border text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="assessment-urgency" className="ref-number block mb-2">{t("form.urgency")}</label>
                  <select
                    id="assessment-urgency"
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="w-full px-4 py-3 bg-surface border border-border text-foreground focus:border-accent focus:outline-none"
                  >
                    {urgencyOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-4 bg-foreground text-background font-mono text-xs tracking-widest uppercase hover:bg-accent transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "..." : t("form.submit")}
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-border bg-surface p-8"
            >
              <div className="ref-number mb-6">{t("result.title")}</div>

              <div className="space-y-6">
                <div className="border-b border-border pb-4">
                  <div className="ref-number text-muted-foreground mb-1">
                    {t("result.complexity")}
                  </div>
                  <div className="font-serif text-xl">{estimate.complexity}</div>
                </div>

                <div className="border-b border-border pb-4">
                  <div className="ref-number text-muted-foreground mb-1">
                    {t("result.scope")}
                  </div>
                  <div className="font-serif text-xl">{estimate.scope}</div>
                </div>

                <div className="border-b border-border pb-4">
                  <div className="ref-number text-muted-foreground mb-1">
                    {t("result.range")}
                  </div>
                  <div className="font-serif text-2xl text-accent">{estimate.range}</div>
                </div>

                <div className="pb-4">
                  <div className="ref-number text-muted-foreground mb-1">
                    {t("result.nextStep")}
                  </div>
                  <div className="text-dense">{estimate.nextStep}</div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full mt-8 px-6 py-4 bg-accent text-accent-foreground font-mono text-xs tracking-widest uppercase hover:bg-foreground transition-colors disabled:opacity-50"
              >
                {checkoutLoading ? "..." : t("result.cta")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

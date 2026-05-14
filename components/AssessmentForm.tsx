"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "@/i18n/navigation";

type EstimateResult = {
  complexity: string;
  scope: string;
  range: string;
  nextStep: string;
};

type CheckoutDelivery = {
  client?: string;
  team?: string;
};

export function AssessmentForm() {
  const t = useTranslations("assessment");
  const locale = useLocale();
  const isFr = locale === "fr";
  const pathname = usePathname();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [checkoutDelivery, setCheckoutDelivery] = useState<CheckoutDelivery | null>(null);
  const [checkoutError, setCheckoutError] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const [formData, setFormData] = useState({
    company: "",
    name: "",
    email: "",
    problem: "",
    tools: "",
    teams: "",
    urgency: "Medium",
    website: "",
    followUpConsent: true,
  });

  const leadCopy = isFr
    ? {
        eyebrow: "NXR · DIAGNOSTIC",
        headline: "Recevez une premiere lecture utile, pas un courriel generique.",
        body: "L'auto-evaluation transforme vos frictions en priorites: points de rupture, portee probable, prix indicatif et prochaine action.",
        items: [
          "Rapport envoye au client par courriel",
          "Notification equipe pour suivi rapide",
          "Source et campagne suivies automatiquement",
          "Relance operationnelle si vous demandez le suivi",
        ],
        consent: "J'accepte de recevoir le rapport et les suivis operationnels lies a cette demande.",
        sent: "Le rapport initial est envoye par courriel. L'equipe a aussi recu le signal.",
        error: "Impossible de generer le rapport pour le moment. Ecrivez directement a contact@nexuradata.ca.",
        paymentReady: "Lien Stripe pret",
        paymentOpen: "Ouvrir le paiement securise",
        paymentFallback: "Le lien reste visible ici meme si le courriel n'arrive pas.",
        paymentEmailSent: "Courriel de paiement envoye au client.",
        paymentEmailIssue: "Courriel de paiement non confirme. Utilisez le lien ci-dessous.",
        paymentTeamSent: "Notification equipe envoyee.",
        paymentError: "Impossible de creer le lien Stripe pour le moment.",
      }
    : {
        eyebrow: "NXR · DIAGNOSTIC",
        headline: "Get a useful first read, not a generic email.",
        body: "The self-assessment turns operational friction into priorities: failure points, likely scope, indicative pricing, and next action.",
        items: [
          "Client report delivered by email",
          "Team notification for fast follow-up",
          "Source and campaign tracked automatically",
          "Operational follow-up when requested",
        ],
        consent: "I agree to receive the report and operational follow-ups related to this request.",
        sent: "The initial report was sent by email. The team also received the signal.",
        error: "Could not generate the report right now. Email contact@nexuradata.ca directly.",
        paymentReady: "Stripe link ready",
        paymentOpen: "Open secure payment",
        paymentFallback: "The link stays visible here even if the email does not arrive.",
        paymentEmailSent: "Payment email sent to the client.",
        paymentEmailIssue: "Payment email was not confirmed. Use the link below.",
        paymentTeamSent: "Team notification sent.",
        paymentError: "Could not create the Stripe link right now.",
      };

  const getTrackingPayload = () => ({
    sourcePath: pathname,
    sourceLabel: "assessment_form",
    utmSource: typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("utm_source") || "",
    utmMedium: typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("utm_medium") || "",
    utmCampaign: typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("utm_campaign") || "",
    referrer: typeof document === "undefined" ? "" : document.referrer,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(false);

    try {
      const response = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, ...getTrackingPayload(), locale }),
      });

      if (!response.ok) throw new Error("Failed to submit");

      const data = await response.json();
      setEstimate(data.estimate);
      setCheckoutUrl("");
      setCheckoutDelivery(null);
      setCheckoutError(false);
    } catch (error) {
      console.error("Assessment error:", error);
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError(false);
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

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      setCheckoutUrl(data.url);
      setCheckoutDelivery(data.delivery || null);
    } catch (error) {
      console.error("Checkout error:", error);
      setCheckoutError(true);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const urgencyOptions = t.raw("form.urgencyOptions") as string[];

  return (
    <main className="min-h-screen pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12 max-w-3xl">
          <div className="ref-number mb-4">NXR · ASSESSMENT</div>
          <h1 className="heading-austere text-4xl md:text-5xl text-foreground mb-4">
            {t("title")}
          </h1>
          <p className="text-dense text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <aside className="border-y border-border py-8 lg:sticky lg:top-28">
            <div className="ref-number mb-5 text-accent">{leadCopy.eyebrow}</div>
            <h2 className="mb-5 max-w-[13ch] font-serif text-4xl leading-[0.98] text-foreground md:text-5xl">
              {leadCopy.headline}
            </h2>
            <p className="mb-8 max-w-[34ch] text-dense text-muted-foreground">
              {leadCopy.body}
            </p>
            <div className="space-y-4">
              {leadCopy.items.map((item, index) => (
                <div key={item} className="grid grid-cols-[3rem_1fr] gap-4 border-t border-border pt-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                    0{index + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground/70">{item}</span>
                </div>
              ))}
            </div>
          </aside>

          <div>
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
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="hidden"
                aria-hidden="true"
              />
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

              <label className="flex items-start gap-3 border-y border-border py-4 text-sm leading-relaxed text-muted-foreground">
                <input
                  type="checkbox"
                  checked={formData.followUpConsent}
                  onChange={(e) => setFormData({ ...formData, followUpConsent: e.target.checked })}
                  className="mt-1 h-4 w-4 border border-border bg-surface accent-[var(--nx-copper)]"
                />
                <span>{leadCopy.consent}</span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !formData.followUpConsent}
                className="w-full border-y border-foreground/70 px-6 py-4 font-mono text-xs tracking-widest uppercase text-foreground hover:border-accent transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "..." : t("form.submit")}
              </button>
              {submitError && (
                <p className="text-sm leading-relaxed text-accent">{leadCopy.error}</p>
              )}
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

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {leadCopy.sent}
              </p>

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full mt-8 border-y border-accent/70 px-6 py-4 font-mono text-xs tracking-widest uppercase text-foreground hover:border-foreground transition-colors disabled:opacity-50"
              >
                {checkoutLoading ? "..." : t("result.cta")}
              </button>
              {checkoutError && (
                <p className="mt-4 text-sm leading-relaxed text-accent">{leadCopy.paymentError}</p>
              )}
              {checkoutUrl && (
                <div className="mt-6 border-y border-border py-5">
                  <div className="ref-number mb-3 text-accent">{leadCopy.paymentReady}</div>
                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block border-y border-foreground/70 px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] text-foreground transition-colors hover:border-accent"
                  >
                    {leadCopy.paymentOpen}
                  </a>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {leadCopy.paymentFallback}
                  </p>
                  <p className="mt-3 break-all font-mono text-[11px] leading-relaxed text-muted-foreground">
                    {checkoutUrl}
                  </p>
                  <div className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <p>
                      {checkoutDelivery?.client === "sent"
                        ? leadCopy.paymentEmailSent
                        : `${leadCopy.paymentEmailIssue}${checkoutDelivery?.client ? ` (${checkoutDelivery.client})` : ""}`}
                    </p>
                    {checkoutDelivery?.team === "sent" && <p>{leadCopy.paymentTeamSent}</p>}
                  </div>
                </div>
              )}
            </motion.div>
          )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}

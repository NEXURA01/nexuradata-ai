"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { LogoMark } from "./Logo";

export function Footer() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const isFr = locale === "fr";
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const switchLocale = () => {
    const newLocale = locale === "fr" ? "en" : "fr";
    router.replace(pathname, { locale: newLocale });
  };

  const submitNewsletter = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newsletterEmail.trim()) return;

    setNewsletterStatus("loading");

    try {
      const response = await fetch("/api/lead-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newsletterEmail,
          locale,
          consent: true,
          offer: "operational_notes",
          sourcePath: pathname,
          sourceLabel: "footer_notes",
          referrer: typeof document === "undefined" ? "" : document.referrer,
        }),
      });

      if (!response.ok) {
        throw new Error("newsletter-failed");
      }

      setNewsletterEmail("");
      setNewsletterStatus("success");
    } catch {
      setNewsletterStatus("error");
    }
  };

  const primaryLinks = isFr
    ? [
        { href: "/operational-assessment", label: "Auto-évaluation" },
        { href: "/services", label: "Systèmes" },
        { href: "/pricing", label: "Tarifs" },
      ]
    : [
        { href: "/operational-assessment", label: "Assessment" },
        { href: "/services", label: "Systems" },
        { href: "/pricing", label: "Pricing" },
      ];

  const legalLinks = isFr
    ? [
        { href: "/confidentialite", label: "Confidentialité" },
        { href: "/conditions", label: "Conditions" },
      ]
    : [
        { href: "/confidentialite", label: "Privacy" },
        { href: "/conditions", label: "Terms" },
      ];

  return (
    <footer className="border-t border-[rgba(11,13,16,0.12)] bg-[var(--os)] text-[var(--noir)]">
      <div className="mx-auto max-w-[1480px] px-6 md:px-8">
        <div className="grid gap-12 border-b border-[rgba(11,13,16,0.10)] py-12 md:grid-cols-12 lg:py-16">
          <div className="md:col-span-5">
            <Link href="/" className="mb-8 inline-flex items-center gap-4 text-[var(--noir)] transition-opacity hover:opacity-70" aria-label="Nexura">
              <LogoMark size={48} />
              <span className="font-serif text-[42px] leading-none tracking-[-0.01em]">Nexura</span>
            </Link>
            <p className="max-w-[13ch] font-serif text-5xl leading-[0.96] tracking-[-0.01em] text-[var(--noir)] md:text-6xl">
              {isFr ? "Clarté opérationnelle." : "Operational clarity."}
            </p>
          </div>

          <div className="md:col-span-3 md:col-start-7">
            <span className="mb-7 block font-mono text-[10px] uppercase tracking-[0.28em] text-[rgba(11,13,16,0.42)]">
              {isFr ? "Commencer" : "Start"}
            </span>
            <div className="flex flex-col gap-5">
              {primaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-sans text-xl leading-none text-[rgba(11,13,16,0.64)] transition-colors hover:text-[var(--noir)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="md:col-span-4">
            <span className="mb-7 block font-mono text-[10px] uppercase tracking-[0.28em] text-[rgba(11,13,16,0.42)]">
              {isFr ? "Contact direct" : "Direct contact"}
            </span>
            <div className="flex flex-col gap-6">
              <a href="mailto:contact@nexuradata.ca" className="break-all font-serif text-3xl leading-none tracking-[-0.01em] text-[var(--noir)] transition-opacity hover:opacity-70 md:text-4xl">
                contact@nexuradata.ca
              </a>
              <Link
                href="/contact"
                className="w-fit border-y border-[rgba(11,13,16,0.22)] px-1 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[rgba(11,13,16,0.62)] transition-colors hover:border-[var(--noir)] hover:text-[var(--noir)]"
              >
                {isFr ? "Formulaire court" : "Short form"}
              </Link>
              <span className="max-w-[26ch] text-sm leading-relaxed text-[rgba(11,13,16,0.46)]">
                {isFr
                  ? "Pour une demande, une évaluation ou une question simple."
                  : "For a request, assessment, or simple question."}
              </span>
              <form onSubmit={submitNewsletter} className="mt-3 max-w-[420px] border-t border-[rgba(11,13,16,0.12)] pt-6">
                <label htmlFor="footer-newsletter" className="mb-3 block font-mono text-[10px] uppercase tracking-[0.24em] text-[rgba(11,13,16,0.42)]">
                  {isFr ? "Diagnostic express" : "Express diagnostic"}
                </label>
                <div className="flex border border-[rgba(11,13,16,0.18)]">
                  <input
                    id="footer-newsletter"
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(event) => setNewsletterEmail(event.target.value)}
                    placeholder={isFr ? "courriel" : "email"}
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--noir)] outline-none placeholder:text-[rgba(11,13,16,0.34)]"
                    disabled={newsletterStatus === "loading"}
                  />
                  <button
                    type="submit"
                    disabled={newsletterStatus === "loading"}
                    className="border-l border-[rgba(11,13,16,0.18)] px-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(11,13,16,0.62)] transition-colors hover:bg-[var(--noir)] hover:text-[var(--os)] disabled:opacity-40"
                  >
                    {newsletterStatus === "loading" ? "..." : isFr ? "Recevoir" : "Get"}
                  </button>
                </div>
                {newsletterStatus === "success" && (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(11,13,16,0.56)]">
                    {isFr ? "Diagnostic envoyé." : "Diagnostic sent."}
                  </p>
                )}
                {newsletterStatus === "error" && (
                  <p className="mt-3 text-sm text-[rgba(11,13,16,0.58)]">
                    {isFr ? "Impossible d'inscrire ce courriel pour le moment." : "Could not subscribe this email right now."}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-5 py-5 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[rgba(11,13,16,0.42)]">© 2026 NEXURA</span>
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(11,13,16,0.42)] transition-colors hover:text-[var(--noir)]">
                {link.label}
              </Link>
            ))}
            <Link href="/employe" className="border border-accent/45 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-accent transition-colors hover:border-[var(--noir)] hover:bg-[var(--noir)] hover:text-[var(--os)]">
              EMPLOYE
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-5">
              <div className="h-3 w-3 bg-[#00c766]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[rgba(11,13,16,0.42)]">
                {isFr ? "SYSTÈMES OPÉRATIONNELS" : "SYSTEMS OPERATIONAL"}
              </span>
            </div>
            <button
              onClick={switchLocale}
              className="font-mono text-[10px] uppercase tracking-[0.28em] text-[rgba(11,13,16,0.42)] transition-colors hover:text-[var(--noir)]"
            >
              {locale === "fr" ? "EN" : "FR"}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

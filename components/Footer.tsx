"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { LogoMark } from "./Logo";
import { SealStamp } from "./SealStamp";

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

  const openCookiePreferences = () => {
    window.dispatchEvent(new Event("nexura:open-cookie-preferences"));
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
        {/* Main content grid */}
        <div className="grid gap-16 border-b border-[rgba(11,13,16,0.10)] py-16 md:grid-cols-12 lg:gap-20 lg:py-24">
          {/* Branding section */}
          <div className="md:col-span-5">
            <Link href="/" className="mb-12 inline-flex items-center gap-4 text-[var(--noir)] transition-opacity hover:opacity-70" aria-label="Nexura">
              <LogoMark size={48} />
              <span className="font-serif text-[42px] leading-none tracking-[-0.01em]">Nexura</span>
            </Link>
            <p className="max-w-[13ch] font-serif text-5xl leading-[0.96] tracking-[-0.01em] text-[var(--noir)] md:text-6xl">
              {isFr ? "Clarté opérationnelle." : "Operational clarity."}
            </p>
          </div>

          {/* Navigation section */}
          <div className="md:col-span-3 md:col-start-7">
            <span className="mb-8 block font-mono text-[9px] uppercase tracking-[0.32em] text-[rgba(11,13,16,0.48)]">
              {isFr ? "Commencer" : "Start"}
            </span>
            <div className="flex flex-col gap-6">
              {primaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-sans text-lg leading-none text-[rgba(11,13,16,0.72)] transition-colors hover:text-[var(--copper)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact section */}
          <div className="md:col-span-4">
            <span className="mb-8 block font-mono text-[9px] uppercase tracking-[0.32em] text-[rgba(11,13,16,0.48)]">
              {isFr ? "Contact direct" : "Direct contact"}
            </span>
            <div className="flex flex-col gap-8">
              {/* Email CTA */}
              <a 
                href="mailto:contact@nexuradata.ca" 
                className="group border-b border-[var(--copper)]/40 pb-6 transition-all hover:border-[var(--copper)]"
              >
                <span className="block font-mono text-[9px] uppercase tracking-[0.24em] text-[rgba(11,13,16,0.52)] mb-3 group-hover:text-[var(--copper)] transition-colors">
                  {isFr ? "Écrire" : "Write"}
                </span>
                <span className="break-all font-serif text-2xl leading-tight tracking-[-0.01em] text-[var(--noir)] group-hover:text-[var(--copper)] transition-colors md:text-3xl">
                  contact@nexuradata.ca
                </span>
              </a>

              {/* Form section */}
              <div className="border-t border-[rgba(11,13,16,0.12)] pt-8">
                <label htmlFor="footer-newsletter" className="mb-4 block font-mono text-[9px] uppercase tracking-[0.24em] text-[rgba(11,13,16,0.48)]">
                  {isFr ? "Diagnostic express" : "Express diagnostic"}
                </label>
                <form onSubmit={submitNewsletter} className="max-w-[420px]">
                  <div className="flex border-2 border-[rgba(11,13,16,0.22)] bg-transparent transition-colors focus-within:border-[var(--copper)]">
                    <input
                      id="footer-newsletter"
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(event) => setNewsletterEmail(event.target.value)}
                      placeholder={isFr ? "courriel" : "email"}
                      className="min-w-0 flex-1 bg-transparent px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--noir)] outline-none placeholder:text-[rgba(11,13,16,0.32)]"
                      disabled={newsletterStatus === "loading"}
                    />
                    <button
                      type="submit"
                      disabled={newsletterStatus === "loading"}
                      className="border-l border-[rgba(11,13,16,0.22)] px-5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--noir)] transition-all hover:bg-[var(--copper)] hover:text-[var(--os)] hover:border-[var(--copper)] disabled:opacity-40"
                    >
                      {newsletterStatus === "loading" ? "..." : isFr ? "GO" : "GO"}
                    </button>
                  </div>
                  {newsletterStatus === "success" && (
                    <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--copper)]">
                      {isFr ? "✓ Diagnostic envoyé" : "✓ Diagnostic sent"}
                    </p>
                  )}
                  {newsletterStatus === "error" && (
                    <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-[rgba(11,13,16,0.62)]">
                      {isFr ? "Erreur — réessayer plus tard" : "Error — try again later"}
                    </p>
                  )}
                </form>
              </div>

              {/* Short form link */}
              <Link
                href="/contact"
                className="group w-fit border-b border-[rgba(11,13,16,0.22)] pb-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[rgba(11,13,16,0.62)] transition-all hover:border-[var(--noir)] hover:text-[var(--noir)]"
              >
                {isFr ? "+ Formulaire complet" : "+ Full form"}
              </Link>
            </div>
          </div>
        </div>

        {/* Seal section with divider */}
        <div className="flex flex-col items-center gap-10 py-16 lg:py-20">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-[var(--copper)]/30 to-transparent" />
          <div className="opacity-75 hover:opacity-100 transition-opacity">
            <SealStamp />
          </div>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-[rgba(11,13,16,0.12)] to-transparent" />
        </div>

        {/* Footer bottom - organized grid */}
        <div className="border-t border-[rgba(11,13,16,0.10)] py-8">
          <div className="grid gap-8 md:grid-cols-3 md:gap-12">
            {/* Copyright and legal */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[rgba(11,13,16,0.52)]">
                © 2026 NEXURA
              </span>
              {legalLinks.map((link, idx) => (
                <span key={link.href} className="flex items-center gap-4">
                  {idx > 0 && <span className="h-1 w-1 bg-[rgba(11,13,16,0.22)]" />}
                  <Link href={link.href} className="font-mono text-[9px] uppercase tracking-[0.2em] text-[rgba(11,13,16,0.52)] transition-colors hover:text-[var(--noir)]">
                    {link.label}
                  </Link>
                </span>
              ))}
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-3 md:justify-center">
              <div className="h-2 w-2 rounded-full bg-[#00c766] animate-pulse" />
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[rgba(11,13,16,0.52)]">
                {isFr ? "SYSTÈMES OPÉRATIONNELS" : "SYSTEMS OPERATIONAL"}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-end gap-6">
              <button
                onClick={switchLocale}
                className="font-mono text-[9px] uppercase tracking-[0.24em] text-[rgba(11,13,16,0.52)] transition-colors hover:text-[var(--noir)]"
              >
                {locale === "fr" ? "EN" : "FR"}
              </button>
              <button
                type="button"
                onClick={openCookiePreferences}
                className="font-mono text-[9px] uppercase tracking-[0.24em] text-[rgba(11,13,16,0.52)] transition-colors hover:text-[var(--noir)]"
              >
                {isFr ? "Témoins" : "Cookies"}
              </button>
              <Link 
                href="/employe" 
                className="border border-[var(--copper)]/50 px-2.5 py-1.5 font-mono text-[8px] font-semibold uppercase tracking-[0.2em] text-[var(--copper)] transition-all hover:bg-[var(--copper)] hover:text-[var(--os)]"
              >
                EMPLOYE
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { LogoWordmark } from "./Logo";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const switchLocale = () => {
    const newLocale = locale === "fr" ? "en" : "fr";
    router.replace(pathname, { locale: newLocale });
  };

  const navLinks = [
    { href: "/#platform", label: t("platform") },
    { href: "/services", label: t("services") },
    { href: "/pricing", label: t("pricing") },
    { href: "/operational-assessment", label: t("assessment") },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[rgba(11,13,16,0.16)] bg-[var(--os)] text-[var(--noir)]">
      <nav className="max-w-[1480px] mx-auto px-5 md:px-8 h-24 flex items-center justify-between">
        {/* Logo + Language */}
        <div className="flex items-center gap-12">
          <Link href="/" className="text-[var(--noir)] hover:opacity-70 transition-opacity" aria-label="Nexura — Home">
            <LogoWordmark size={36} />
          </Link>
          <div className="hidden md:flex items-center border-l border-[rgba(11,13,16,0.16)] pl-8">
            <button
              onClick={switchLocale}
              className="font-mono text-[14px] font-semibold tracking-[0.18em] uppercase text-[var(--noir)] transition-opacity hover:opacity-60"
            >
              {locale === "fr" ? "FR" : "EN"}
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-[15px] font-semibold tracking-[0.18em] uppercase text-[var(--noir)] transition-opacity hover:opacity-60"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="border border-[rgba(11,13,16,0.24)] px-4 py-3 font-mono text-[14px] font-semibold uppercase tracking-[0.18em] text-[var(--noir)] transition-colors hover:border-[var(--noir)] hover:bg-[var(--noir)] hover:text-[var(--os)]"
          >
            {t("contact")}
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden font-mono text-2xl leading-none tracking-wider text-[var(--noir)]"
          aria-label="Menu"
        >
          {mobileMenuOpen ? "×" : "☰"}
        </button>
      </nav>
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[rgba(11,13,16,0.12)] bg-[var(--os)]">
          <div className="px-8 py-8 flex flex-col gap-6">
            <Link
              href="/contact"
              className="border border-[rgba(11,13,16,0.24)] px-4 py-4 font-mono text-sm font-semibold uppercase tracking-wider text-[var(--noir)] transition-colors hover:border-[var(--noir)]"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("contact")}
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-sm tracking-wider uppercase text-[rgba(11,13,16,0.7)] hover:text-[var(--noir)] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-[rgba(11,13,16,0.12)] pt-6 mt-4">
              <button onClick={switchLocale} className="font-mono text-sm tracking-wider uppercase text-[rgba(11,13,16,0.6)] hover:text-[var(--noir)] transition-colors">
                {locale === "fr" ? "ENGLISH" : "FRANÇAIS"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

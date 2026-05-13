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
    { href: "/contact", label: t("contact") },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-foreground/10">
      <nav className="max-w-6xl mx-auto px-8 h-20 flex items-center justify-between">
        {/* Logo + Language */}
        <div className="flex items-center gap-12">
          <Link href="/" className="text-foreground hover:opacity-80 transition-opacity" aria-label="Nexura Analytics — Home">
            <LogoWordmark size={30} />
          </Link>
          <div className="hidden md:flex items-center border-l-2 border-foreground/30 pl-8">
            <button
              onClick={switchLocale}
              className="font-mono text-sm font-medium tracking-wide uppercase text-foreground hover:text-foreground/70 transition-colors"
            >
              {locale === "fr" ? "FR" : "EN"}
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-sm font-medium tracking-wide uppercase text-foreground hover:text-foreground/70 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden font-mono text-sm tracking-wider"
          aria-label="Menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-foreground/10 bg-background">
          <div className="px-8 py-8 flex flex-col gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-sm tracking-wider uppercase text-foreground hover:text-foreground/60 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-foreground/10 pt-6 mt-4">
              <button onClick={switchLocale} className="font-mono text-sm tracking-wider uppercase text-foreground/70 hover:text-foreground transition-colors">
                {locale === "fr" ? "ENGLISH" : "FRANÇAIS"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

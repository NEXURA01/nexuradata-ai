"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useState } from "react";

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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-xl tracking-tight">Nexura</span>
          <span className="font-mono text-xs text-muted uppercase tracking-widest">
            Analytics
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/tarifs"
            className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("pricing")}
          </Link>
          <Link
            href="/contact"
            className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("contact")}
          </Link>
        </div>

        {/* Language Switcher + Mobile Menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={switchLocale}
            className="font-mono text-xs uppercase tracking-wider text-muted hover:text-foreground transition-colors px-2 py-1 border border-transparent hover:border-border rounded"
          >
            {locale === "fr" ? "EN" : "FR"}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-6 py-4 flex flex-col gap-4">
            <Link
              href="/tarifs"
              className="font-mono text-sm uppercase tracking-wider text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("pricing")}
            </Link>
            <Link
              href="/contact"
              className="font-mono text-sm uppercase tracking-wider text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("contact")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

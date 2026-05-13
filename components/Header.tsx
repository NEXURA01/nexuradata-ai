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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 border-b border-foreground/10">
      <nav className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo - stark */}
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-lg tracking-tight">Nexura</span>
          <span className="ref-number">Analytics</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/tarifs"
            className="ref-number hover:text-accent transition-colors"
          >
            {t("pricing")}
          </Link>
          <Link
            href="/evaluation"
            className="ref-number hover:text-accent transition-colors"
          >
            {t("evaluate")}
          </Link>
          <Link
            href="/contact"
            className="ref-number hover:text-accent transition-colors"
          >
            {t("contact")}
          </Link>
          
          {/* Divider */}
          <div className="w-px h-4 bg-foreground/10" />
          
          {/* Language */}
          <button
            onClick={switchLocale}
            className="ref-number hover:text-accent transition-colors"
          >
            {locale === "fr" ? "EN" : "FR"}
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden ref-number"
          aria-label="Menu"
        >
          {mobileMenuOpen ? "CLOSE" : "MENU"}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-foreground/10 bg-background">
          <div className="px-6 py-6 flex flex-col gap-4">
            <Link
              href="/tarifs"
              className="ref-number"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("pricing")}
            </Link>
            <Link
              href="/evaluation"
              className="ref-number"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("evaluate")}
            </Link>
            <Link
              href="/contact"
              className="ref-number"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("contact")}
            </Link>
            <div className="border-t border-foreground/10 pt-4 mt-2">
              <button onClick={switchLocale} className="ref-number">
                {locale === "fr" ? "ENGLISH" : "FRANÇAIS"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

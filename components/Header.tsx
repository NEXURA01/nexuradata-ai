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
    { href: "/#services", label: t("platform") },
    { href: "/services", label: t("services") },
    { href: "/pricing", label: t("pricing") },
    { href: "/operational-assessment", label: t("assessment") },
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#17181c]/18 bg-[#ece7db]/95 text-[#17181c] backdrop-blur-md">
      <div className="hidden border-b border-[#17181c]/10 px-5 py-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#17181c]/46 md:block">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between">
          <span>NXR · 0000 — Quiet Mechanism</span>
          <span>Operational Intelligence Atelier · MMXXVI</span>
        </div>
      </div>

      <nav className="mx-auto flex h-20 max-w-[1480px] items-center justify-between px-5 md:h-24 md:px-8">
        <div className="flex items-center gap-8 md:gap-12">
          <Link href="/" className="text-[#17181c] transition-opacity hover:opacity-70" aria-label="Nexura — Home">
            <LogoWordmark size={36} />
          </Link>
          <div className="hidden items-center border-l border-[#17181c]/16 pl-8 md:flex">
            <button
              onClick={switchLocale}
              className="font-mono text-[12px] font-semibold uppercase tracking-[0.22em] text-[#17181c]/65 transition-colors hover:text-[#17181c]"
              aria-label={locale === "fr" ? "Switch to English" : "Passer en français"}
            >
              {locale === "fr" ? "EN" : "FR"}
            </button>
          </div>
        </div>

        <div className="hidden items-center gap-9 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#17181c]/62 transition-colors hover:text-[#17181c]"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="border border-[#17181c]/28 px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#17181c] transition-colors hover:border-[#17181c] hover:bg-[#17181c] hover:text-[#ece7db]"
          >
            {t("contact")} ↗
          </Link>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="font-mono text-2xl leading-none tracking-wider text-[#17181c] md:hidden"
          aria-label="Menu"
        >
          {mobileMenuOpen ? "×" : "☰"}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-[#17181c]/12 bg-[#ece7db] md:hidden">
          <div className="flex flex-col gap-6 px-8 py-8">
            <Link
              href="/contact"
              className="border border-[#17181c]/28 px-4 py-4 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[#17181c] transition-colors hover:border-[#17181c]"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("contact")} ↗
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-sm uppercase tracking-[0.18em] text-[#17181c]/68 transition-colors hover:text-[#17181c]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 border-t border-[#17181c]/12 pt-6">
              <button onClick={switchLocale} className="font-mono text-sm uppercase tracking-[0.18em] text-[#17181c]/62 transition-colors hover:text-[#17181c]">
                {locale === "fr" ? "English" : "Français"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

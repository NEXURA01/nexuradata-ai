"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Logo } from "./Logo";

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = () => {
    const newLocale = locale === "fr" ? "en" : "fr";
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <footer className="border-t border-[rgba(11,13,16,0.12)] bg-[var(--os)] text-[var(--noir)]">
      <div className="mx-auto max-w-[1480px] px-6 md:px-8">
        <div className="grid gap-14 border-b border-[rgba(11,13,16,0.10)] py-14 md:grid-cols-12 lg:py-20">
          <div className="md:col-span-6">
            <Logo size={62} className="mb-8 text-[var(--noir)]" />
            <p className="max-w-[46ch] font-sans text-xl leading-relaxed text-[rgba(11,13,16,0.62)]">
              {t("description")}
            </p>
          </div>

          <div className="md:col-span-3 md:col-start-8">
            <span className="mb-9 block font-mono text-[11px] uppercase tracking-[0.28em] text-[rgba(11,13,16,0.48)]">{t("services")}</span>
            <div className="flex flex-col gap-6">
              <Link
                href="/services"
                className="font-sans text-2xl leading-none text-[rgba(11,13,16,0.62)] transition-colors hover:text-[var(--noir)]"
              >
                Services
              </Link>
              <Link
                href="/pricing"
                className="font-sans text-2xl leading-none text-[rgba(11,13,16,0.62)] transition-colors hover:text-[var(--noir)]"
              >
                Pricing
              </Link>
              <Link
                href="/operational-assessment"
                className="font-sans text-2xl leading-none text-[rgba(11,13,16,0.62)] transition-colors hover:text-[var(--noir)]"
              >
                Assessment
              </Link>
            </div>
          </div>

          <div className="md:col-span-3">
            <span className="mb-9 block font-mono text-[11px] uppercase tracking-[0.28em] text-[rgba(11,13,16,0.48)]">{t("legal")}</span>
            <div className="flex flex-col gap-6">
              <Link
                href="/confidentialite"
                className="font-sans text-2xl leading-none text-[rgba(11,13,16,0.62)] transition-colors hover:text-[var(--noir)]"
              >
                {t("privacy")}
              </Link>
              <Link
                href="/conditions"
                className="font-sans text-2xl leading-none text-[rgba(11,13,16,0.62)] transition-colors hover:text-[var(--noir)]"
              >
                {t("terms")}
              </Link>
              <Link
                href="/contact"
                className="font-sans text-2xl leading-none text-[rgba(11,13,16,0.62)] transition-colors hover:text-[var(--noir)]"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>

        <div className="border-b border-[rgba(11,13,16,0.10)] py-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[rgba(11,13,16,0.42)]">{t("law25")}</span>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[rgba(11,13,16,0.50)]">
            {t("law25Notice")}
          </p>
          <a
            href={`mailto:${t("privacyEmail")}`}
            className="mt-3 inline-block font-mono text-[10px] uppercase tracking-[0.28em] text-[rgba(11,13,16,0.46)] hover:text-[var(--noir)]"
          >
            {t("privacyEmail")}
          </a>
        </div>

        <div className="flex flex-col items-start justify-between gap-5 py-5 md:flex-row md:items-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[rgba(11,13,16,0.42)]">© 2026 NEXURA. ALL RIGHTS RESERVED.</span>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-5">
              <div className="h-3 w-3 bg-[#00c766]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[rgba(11,13,16,0.42)]">ALL SYSTEMS OPERATIONAL</span>
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

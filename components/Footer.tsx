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
    <footer className="border-t border-border bg-surface">
      <div className="max-w-6xl mx-auto px-6">
        {/* Main footer content */}
        <div className="py-12 grid md:grid-cols-4 gap-8 border-b border-border">
          {/* Brand column */}
          <div className="md:col-span-2">
            <Logo size={44} className="mb-4 text-foreground" />
            <p className="text-dense text-muted-foreground max-w-sm">
              {t("description")}
            </p>
          </div>

          {/* Services column */}
          <div>
            <span className="ref-number block mb-4">{t("services")}</span>
            <div className="flex flex-col gap-2">
              <Link
                href="/services"
                className="text-dense text-muted-foreground hover:text-accent transition-colors"
              >
                Services
              </Link>
              <Link
                href="/pricing"
                className="text-dense text-muted-foreground hover:text-accent transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/operational-assessment"
                className="text-dense text-muted-foreground hover:text-accent transition-colors"
              >
                Assessment
              </Link>
            </div>
          </div>

          {/* Legal column */}
          <div>
            <span className="ref-number block mb-4">{t("legal")}</span>
            <div className="flex flex-col gap-2">
              <Link
                href="/privacy"
                className="text-dense text-muted-foreground hover:text-accent transition-colors"
              >
                {t("privacy")}
              </Link>
              <Link
                href="/terms"
                className="text-dense text-muted-foreground hover:text-accent transition-colors"
              >
                {t("terms")}
              </Link>
              <Link
                href="/contact"
                className="text-dense text-muted-foreground hover:text-accent transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>

        {/* Law 25 Notice */}
        <div className="py-6 border-b border-border">
          <div className="flex items-start gap-2">
            <span className="ref-number text-accent flex-shrink-0">{t("law25")}</span>
          </div>
          <p className="text-dense text-muted-foreground mt-2 max-w-2xl">
            {t("law25Notice")}
          </p>
          <a
            href={`mailto:${t("privacyEmail")}`}
            className="ref-number text-accent hover:underline mt-2 inline-block"
          >
            {t("privacyEmail")}
          </a>
        </div>

        {/* Bottom bar */}
        <div className="py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="ref-number opacity-60">{t("copyright")}</span>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500" />
              <span className="ref-number opacity-60">{t("statusOk")}</span>
            </div>
            <button
              onClick={switchLocale}
              className="ref-number opacity-60 hover:opacity-100 transition-opacity"
            >
              {locale === "fr" ? "EN" : "FR"}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

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
    <footer className="border-t border-foreground/10">
      <div className="max-w-5xl mx-auto px-6">
        {/* Main footer content */}
        <div className="py-12 grid md:grid-cols-3 gap-8 border-b border-foreground/5">
          {/* Brand column */}
          <div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-serif text-lg">Nexura</span>
              <span className="ref-number">Analytics</span>
            </div>
            <p className="text-dense text-muted-foreground mb-4">
              {t("tagline")}
            </p>
            <span className="ref-number opacity-50">{t("location")}</span>
          </div>

          {/* Legal column */}
          <div>
            <span className="ref-number block mb-4">LEGAL</span>
            <div className="flex flex-col gap-2">
              <Link
                href="/confidentialite"
                className="text-dense text-muted-foreground hover:text-accent transition-colors"
              >
                {t("links.privacy")}
              </Link>
              <Link
                href="/conditions"
                className="text-dense text-muted-foreground hover:text-accent transition-colors"
              >
                {t("links.terms")}
              </Link>
            </div>
          </div>

          {/* Language column */}
          <div>
            <span className="ref-number block mb-4">LANGUAGE</span>
            <button
              onClick={switchLocale}
              className="text-dense text-muted-foreground hover:text-accent transition-colors"
            >
              {locale === "fr" ? "English" : "Français"}
            </button>
          </div>
        </div>

        {/* Bottom bar - technical reference style */}
        <div className="py-4 flex flex-col md:flex-row justify-between items-center gap-2">
          <span className="ref-number opacity-50">{t("copyright")}</span>
          <div className="flex items-center gap-4">
            <span className="ref-number opacity-30">NXR · 0001</span>
            <span className="ref-number opacity-30">MMXXVI</span>
            <span className="ref-number opacity-30">QC/CA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

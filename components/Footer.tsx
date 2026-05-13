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
    <footer className="border-t border-border bg-surface/50">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Top section */}
        <div className="flex flex-col md:flex-row justify-between gap-12 mb-16">
          {/* Brand */}
          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-serif text-2xl tracking-tight">Nexura</span>
              <span className="font-mono text-xs text-muted uppercase tracking-widest">
                Analytics
              </span>
            </div>
            <p className="font-serif text-lg italic text-muted-foreground mb-4">
              {t("tagline")}
            </p>
            <p className="font-mono text-xs text-muted uppercase tracking-wider">
              {t("location")}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col md:flex-row gap-12">
            <div>
              <h4 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
                Legal
              </h4>
              <div className="flex flex-col gap-3">
                <Link
                  href="/confidentialite"
                  className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("links.privacy")}
                </Link>
                <Link
                  href="/conditions"
                  className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("links.terms")}
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
                Language
              </h4>
              <button
                onClick={switchLocale}
                className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {locale === "fr" ? "English" : "Français"}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-mono text-xs text-muted">{t("copyright")}</p>

          {/* Technical frame reference */}
          <div className="font-mono text-xs text-muted/50 tracking-widest">
            NXR · MMXXVI
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

const CONSENT_STORAGE_KEY = "nexuradata_cookie_consent_v1";
const CONSENT_VERSION = 1;
const GA_MEASUREMENT_ID = "G-TC31YSS01P";
const META_PIXEL_ID = "751859640106935";

type ConsentChoice = {
  version: number;
  analytics: boolean;
  marketing: boolean;
};

type TrackingWindow = Window &
  typeof globalThis & {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    nexuraApplyTrackingConsent?: (consent: ConsentChoice | null) => void;
    metaPixelLoaded?: boolean;
  } & Record<`ga-disable-${string}`, boolean | undefined>;

const readConsent = (): ConsentChoice | null => {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as Partial<ConsentChoice>;
    if (parsed.version !== CONSENT_VERSION) return null;

    return {
      version: CONSENT_VERSION,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
    };
  } catch {
    return null;
  }
};

const getCanonicalPageLocation = () => {
  const canonicalHref = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
  if (!canonicalHref) return window.location.href;

  try {
    const canonicalUrl = new URL(canonicalHref);
    const currentUrl = new URL(window.location.href);
    canonicalUrl.hash = currentUrl.hash;
    return canonicalUrl.href;
  } catch {
    return window.location.href;
  }
};

const getCanonicalPagePath = () => {
  try {
    const canonicalUrl = new URL(getCanonicalPageLocation());
    return `${canonicalUrl.pathname}${canonicalUrl.search}${canonicalUrl.hash}`;
  } catch {
    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
  }
};

const applyGoogleAnalyticsConsent = (consent: ConsentChoice | null) => {
  const trackingWindow = window as TrackingWindow;
  trackingWindow[`ga-disable-${GA_MEASUREMENT_ID}`] = consent?.analytics !== true;

  trackingWindow.dataLayer = trackingWindow.dataLayer || [];
  trackingWindow.gtag = trackingWindow.gtag || ((...args: unknown[]) => trackingWindow.dataLayer?.push(args));

  if (consent?.analytics !== true) return;

  const existingScript = document.querySelector(`script[src*="${GA_MEASUREMENT_ID}"]`);
  if (!existingScript) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }

  trackingWindow.gtag("js", new Date());
  trackingWindow.gtag("config", GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    page_location: getCanonicalPageLocation(),
    page_path: getCanonicalPagePath(),
    transport_type: "beacon",
  });
};

const applyMetaConsent = (consent: ConsentChoice | null) => {
  const trackingWindow = window as TrackingWindow;

  if (typeof trackingWindow.fbq === "function") {
    trackingWindow.fbq("consent", consent?.marketing === true ? "grant" : "revoke");
  }

  if (consent?.marketing !== true || trackingWindow.metaPixelLoaded) return;

  if (!trackingWindow.fbq) {
    const fbq = (...args: unknown[]) => {
      fbq.queue.push(args);
    };
    fbq.queue = [] as unknown[];
    fbq.loaded = true;
    fbq.version = "2.0";
    trackingWindow.fbq = fbq;
    trackingWindow._fbq = fbq;
  }

  const existingScript = document.querySelector('script[src="https://connect.facebook.net/en_US/fbevents.js"]');
  if (!existingScript) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }

  trackingWindow.fbq?.("consent", "grant");
  trackingWindow.fbq?.("init", META_PIXEL_ID);
  trackingWindow.fbq?.("track", "PageView", {
    page_location: getCanonicalPageLocation(),
    page_path: getCanonicalPagePath(),
    current_location: window.location.href,
  });
  trackingWindow.metaPixelLoaded = true;
};

const applyTrackingConsent = (consent: ConsentChoice | null) => {
  applyGoogleAnalyticsConsent(consent);
  applyMetaConsent(consent);
};

export function CookieConsent() {
  const locale = useLocale();
  const isFr = locale === "fr";
  const [isVisible, setIsVisible] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const storedConsent = readConsent();
    applyTrackingConsent(storedConsent);

    if (!storedConsent) {
      setIsVisible(true);
    } else {
      setAnalytics(storedConsent.analytics);
      setMarketing(storedConsent.marketing);
    }

    const openPreferences = () => {
      const currentConsent = readConsent();
      setAnalytics(currentConsent?.analytics === true);
      setMarketing(currentConsent?.marketing === true);
      setIsVisible(true);
    };

    window.addEventListener("nexura:open-cookie-preferences", openPreferences);
    return () => window.removeEventListener("nexura:open-cookie-preferences", openPreferences);
  }, []);

  const saveConsent = (choice: { analytics: boolean; marketing: boolean }) => {
    const consent = {
      version: CONSENT_VERSION,
      analytics: choice.analytics,
      marketing: choice.marketing,
    };

    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
    applyTrackingConsent(consent);
    setAnalytics(consent.analytics);
    setMarketing(consent.marketing);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-[80] border-t border-foreground/10 bg-background/96 px-5 py-4 text-foreground shadow-2xl shadow-black/50 backdrop-blur md:px-8"
      aria-label={isFr ? "Préférences témoins" : "Cookie preferences"}
    >
      <div className="mx-auto grid max-w-[1420px] gap-5 md:grid-cols-[1.1fr_0.9fr_auto] md:items-end">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-accent">NEXURA</p>
          <h2 className="font-serif text-2xl leading-none text-foreground">{isFr ? "Préférences témoins" : "Cookie preferences"}</h2>
          <p className="mt-3 max-w-[58ch] text-sm leading-relaxed text-foreground/64">
            {isFr
              ? "Le stockage essentiel garde le site fonctionnel. Google Analytics et Meta Pixel restent désactivés sans votre consentement."
              : "Essential storage keeps the site working. Google Analytics and Meta Pixel stay off unless you accept optional measurement."} {" "}
            <Link href={isFr ? "/confidentialite" : "/confidentialite"} className="border-b border-accent/60 text-accent transition-colors hover:text-foreground">
              {isFr ? "Politique de confidentialité" : "Privacy policy"}
            </Link>
            .
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-12 items-center gap-3 border border-foreground/10 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/72">
            <input
              type="checkbox"
              checked={analytics}
              onChange={(event) => setAnalytics(event.target.checked)}
              className="h-4 w-4 accent-[var(--nx-copper)]"
            />
            <span>Google Analytics</span>
          </label>
          <label className="flex min-h-12 items-center gap-3 border border-foreground/10 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/72">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(event) => setMarketing(event.target.checked)}
              className="h-4 w-4 accent-[var(--nx-copper)]"
            />
            <span>Meta Pixel</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <button
            type="button"
            onClick={() => saveConsent({ analytics: false, marketing: false })}
            className="border border-foreground/14 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/64 transition-colors hover:border-accent hover:text-accent"
          >
            {isFr ? "Refuser l'optionnel" : "Reject optional"}
          </button>
          <button
            type="button"
            onClick={() => saveConsent({ analytics, marketing })}
            className="border border-foreground/14 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/72 transition-colors hover:border-foreground hover:text-foreground"
          >
            {isFr ? "Enregistrer" : "Save choices"}
          </button>
          <button
            type="button"
            onClick={() => saveConsent({ analytics: true, marketing: true })}
            className="border border-accent bg-accent px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-background transition-colors hover:bg-foreground hover:text-background"
          >
            {isFr ? "Accepter l'optionnel" : "Accept optional"}
          </button>
        </div>
      </div>
    </aside>
  );
}

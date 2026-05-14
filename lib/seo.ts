import type { Metadata, MetadataRoute } from "next";

import { routing } from "@/i18n/routing";

export const SITE_URL = "https://nexuradata.ca";
export const SITE_NAME = "Nexura";
const ogImageUrlByLocale: Record<Locale, string> = {
  fr: "/assets/icons/og-default.png",
  en: "/assets/icons/og-en.png",
};

type Locale = (typeof routing.locales)[number];

export type SeoPage =
  | "home"
  | "services"
  | "pricing"
  | "tarifs"
  | "evaluation"
  | "operational-assessment"
  | "contact"
  | "employe"
  | "conditions"
  | "confidentialite"
  | "portal"
  | "payment-success";

const localeNames: Record<Locale, string> = {
  fr: "fr-CA",
  en: "en-CA",
};

const openGraphLocales: Record<Locale, string> = {
  fr: "fr_CA",
  en: "en_CA",
};

const pagePaths: Record<SeoPage, string> = {
  home: "",
  services: "services",
  pricing: "pricing",
  tarifs: "tarifs",
  evaluation: "evaluation",
  "operational-assessment": "operational-assessment",
  contact: "contact",
  employe: "employe",
  conditions: "conditions",
  confidentialite: "confidentialite",
  portal: "portal",
  "payment-success": "payment-success",
};

const indexedPages: SeoPage[] = [
  "home",
  "services",
  "pricing",
  "tarifs",
  "evaluation",
  "operational-assessment",
  "contact",
  "conditions",
  "confidentialite",
];

const pageMeta: Record<SeoPage, Record<Locale, { title: string; description: string }>> = {
  home: {
    fr: {
      title: "NEXURA | Infrastructure d'intelligence opérationnelle",
      description:
        "NEXURA conçoit des systèmes sécurisés d'intelligence opérationnelle pour centraliser les workflows, automatiser l'exécution et clarifier les décisions d'équipe.",
    },
    en: {
      title: "NEXURA | Operational Intelligence Infrastructure",
      description:
        "NEXURA designs secure operational intelligence systems that centralize workflows, automate execution, and give teams clearer control layers.",
    },
  },
  services: {
    fr: {
      title: "Services d'intelligence opérationnelle | NEXURA",
      description:
        "Conception de workflows automatisés, tableaux de bord, analyses assistées par IA et couches de contrôle privées pour opérations en croissance.",
    },
    en: {
      title: "Operational Intelligence Services | NEXURA",
      description:
        "Workflow automation, dashboards, AI-assisted analysis, and private control layers for growing operational teams.",
    },
  },
  pricing: {
    fr: {
      title: "Prix indicatifs des systèmes opérationnels | NEXURA",
      description:
        "Consultez les fourchettes de prix indicatives pour l'évaluation, la conception et la mise en place de systèmes opérationnels sécurisés.",
    },
    en: {
      title: "Operational Systems Pricing | NEXURA",
      description:
        "Indicative pricing ranges for assessment, design, and implementation of secure operational intelligence systems.",
    },
  },
  tarifs: {
    fr: {
      title: "Tarifs des systèmes opérationnels | NEXURA",
      description:
        "Fourchettes de tarifs pour les évaluations opérationnelles, l'automatisation de workflows et les systèmes de contrôle privés.",
    },
    en: {
      title: "System Pricing | NEXURA",
      description:
        "Pricing ranges for operational assessments, workflow automation, and private control systems.",
    },
  },
  evaluation: {
    fr: {
      title: "Évaluation opérationnelle | NEXURA",
      description:
        "Démarrez une évaluation structurée pour identifier les frictions, les workflows critiques et les opportunités d'automatisation.",
    },
    en: {
      title: "Operational Assessment | NEXURA",
      description:
        "Start a structured assessment to identify friction, critical workflows, and automation opportunities across your operations.",
    },
  },
  "operational-assessment": {
    fr: {
      title: "Auto-évaluation opérationnelle | NEXURA",
      description:
        "Soumettez votre contexte opérationnel et recevez une première lecture des priorités, de la portée et du prix indicatif.",
    },
    en: {
      title: "Operational Self-Assessment | NEXURA",
      description:
        "Submit your operational context and receive an initial view of priorities, scope, and indicative pricing.",
    },
  },
  contact: {
    fr: {
      title: "Contact | NEXURA",
      description:
        "Contactez NEXURA pour discuter d'une évaluation opérationnelle, d'une automatisation de workflow ou d'une infrastructure IA sécurisée.",
    },
    en: {
      title: "Contact | NEXURA",
      description:
        "Contact NEXURA to discuss operational assessment, workflow automation, or secure AI infrastructure.",
    },
  },
  employe: {
    fr: {
      title: "EMPLOYE | NEXURA",
      description: "Point d'accès employé NEXURA pour ouvrir les dossiers, paiements, soumissions et relances internes.",
    },
    en: {
      title: "EMPLOYE | NEXURA",
      description: "NEXURA employee access point for internal cases, payments, quotes, and follow-ups.",
    },
  },
  conditions: {
    fr: {
      title: "Conditions d'intervention et de paiement | NEXURA",
      description:
        "Conditions applicables aux interventions, paiements, évaluations et livrables de NEXURA.",
    },
    en: {
      title: "Service and Payment Terms | NEXURA",
      description: "Terms covering NEXURA engagements, payments, assessments, and deliverables.",
    },
  },
  confidentialite: {
    fr: {
      title: "Politique de confidentialité | NEXURA",
      description:
        "Politique de confidentialité de NEXURA pour les renseignements transmis dans les formulaires, évaluations et communications.",
    },
    en: {
      title: "Privacy Policy | NEXURA",
      description:
        "NEXURA privacy policy for information submitted through forms, assessments, and communications.",
    },
  },
  portal: {
    fr: {
      title: "Portail client | NEXURA",
      description: "Accès au portail client NEXURA.",
    },
    en: {
      title: "Client Portal | NEXURA",
      description: "Access the NEXURA client portal.",
    },
  },
  "payment-success": {
    fr: {
      title: "Paiement confirmé | NEXURA",
      description: "Confirmation de paiement NEXURA.",
    },
    en: {
      title: "Payment Confirmed | NEXURA",
      description: "NEXURA payment confirmation.",
    },
  },
};

function normalizeLocale(locale: string): Locale {
  return routing.locales.includes(locale as Locale) ? (locale as Locale) : routing.defaultLocale;
}

export function getLocalizedPath(page: SeoPage, locale: string): string {
  const normalizedLocale = normalizeLocale(locale);
  const path = pagePaths[page];
  return path ? `/${normalizedLocale}/${path}` : `/${normalizedLocale}`;
}

export function getAbsoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

function getLanguageAlternates(page: SeoPage): Record<string, string> {
  return {
    "fr-CA": getAbsoluteUrl(getLocalizedPath(page, "fr")),
    "en-CA": getAbsoluteUrl(getLocalizedPath(page, "en")),
    "x-default": getAbsoluteUrl(getLocalizedPath(page, routing.defaultLocale)),
  };
}

export function buildPageMetadata(page: SeoPage, locale: string): Metadata {
  const normalizedLocale = normalizeLocale(locale);
  const meta = pageMeta[page][normalizedLocale];
  const canonicalPath = getLocalizedPath(page, normalizedLocale);
  const isIndexed = indexedPages.includes(page);
  const ogImageUrl = ogImageUrlByLocale[normalizedLocale];

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: canonicalPath,
      languages: getLanguageAlternates(page),
    },
    openGraph: {
      type: "website",
      url: canonicalPath,
      siteName: SITE_NAME,
      title: meta.title,
      description: meta.description,
      locale: openGraphLocales[normalizedLocale],
      alternateLocale: routing.locales
        .filter((availableLocale) => availableLocale !== normalizedLocale)
        .map((availableLocale) => openGraphLocales[availableLocale]),
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "NEXURA operational intelligence infrastructure",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [ogImageUrl],
    },
    robots: isIndexed
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : {
          index: false,
          follow: false,
        },
  };
}

export function getSitemapEntries(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return indexedPages.flatMap((page) =>
    routing.locales.map((locale) => ({
      url: getAbsoluteUrl(getLocalizedPath(page, locale)),
      lastModified,
      changeFrequency: page === "home" ? "weekly" : "monthly",
      priority: page === "home" ? 1 : page === "operational-assessment" ? 0.9 : 0.7,
      alternates: {
        languages: getLanguageAlternates(page),
      },
    })),
  );
}

export function getOrganizationJsonLd(locale: string) {
  const normalizedLocale = normalizeLocale(locale);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: "NEXURA",
        url: SITE_URL,
        email: "contact@nexuradata.ca",
        areaServed: ["Canada", "Québec", "Montréal"],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "business inquiries",
          email: "contact@nexuradata.ca",
          availableLanguage: ["fr-CA", "en-CA"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: localeNames[normalizedLocale],
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/#operational-intelligence-service`,
        name:
          normalizedLocale === "fr"
            ? "Infrastructure d'intelligence opérationnelle"
            : "Operational intelligence infrastructure",
        provider: {
          "@id": `${SITE_URL}/#organization`,
        },
        areaServed: "Canada",
        serviceType: [
          "Workflow automation",
          "Operational dashboards",
          "AI-assisted operational analysis",
          "Secure private control systems",
        ],
      },
    ],
  };
}

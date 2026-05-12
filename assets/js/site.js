const yearTarget = document.querySelector("[data-year]");
const documentLanguage = document.documentElement.lang?.toLowerCase() || "fr-ca";
const isEnglishDocument = documentLanguage.startsWith("en");
const CONSENT_STORAGE_KEY = "nexuradata_cookie_consent_v1";
const CONSENT_VERSION = 1;
const META_PIXEL_ID = "751859640106935";

const readTrackingConsent = () => {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed?.version !== CONSENT_VERSION) return null;
    return {
      version: CONSENT_VERSION,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true
    };
  } catch {
    return null;
  }
};

let trackingConsent = readTrackingConsent();
let metaPixelLoaded = false;

const getCanonicalPageLocation = () => {
  const canonicalHref = document.querySelector('link[rel="canonical"]')?.href;
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

const getMetaEventPayload = (extra = {}) => ({
  page_location: getCanonicalPageLocation(),
  page_path: getCanonicalPagePath(),
  current_location: window.location.href,
  ...extra
});

const loadMetaPixel = () => {
  if (metaPixelLoaded || trackingConsent?.marketing !== true) return;

  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
    t = b.createElement(e); t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js"));

  fbq("consent", "grant");
  fbq("init", META_PIXEL_ID);
  fbq("track", "PageView", getMetaEventPayload());
  metaPixelLoaded = true;
};

const applyTrackingConsent = () => {
  if (typeof window.nexuraApplyTrackingConsent === "function") {
    window.nexuraApplyTrackingConsent(trackingConsent);
  }

  if (typeof fbq === "function") {
    fbq("consent", trackingConsent?.marketing ? "grant" : "revoke");
  }

  loadMetaPixel();
};

const saveTrackingConsent = (choices) => {
  trackingConsent = {
    version: CONSENT_VERSION,
    analytics: choices.analytics === true,
    marketing: choices.marketing === true
  };

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(trackingConsent));
  } catch {
    // Consent still applies for the current page even if persistence is unavailable.
  }

  applyTrackingConsent();
};

const cookieI18n = isEnglishDocument
  ? {
    title: "Cookie preferences",
    copy: "NEXURA uses essential site storage and, only with consent, analytics or marketing measurement to improve operational reliability and communication paths.",
    analytics: "Analytics measurement",
    marketing: "Marketing measurement",
    reject: "Reject optional",
    save: "Save choices",
    accept: "Accept optional",
    privacy: "Privacy policy"
  }
  : {
    title: "Préférences témoins",
    copy: "NEXURA utilise le stockage essentiel du site et, seulement avec consentement, des mesures analytiques ou marketing afin d'améliorer la fiabilité opérationnelle et les parcours de communication.",
    analytics: "Mesure analytique",
    marketing: "Mesure marketing",
    reject: "Refuser l'optionnel",
    save: "Enregistrer",
    accept: "Accepter l'optionnel",
    privacy: "Politique de confidentialité"
  };

const renderCookieConsent = (force = false) => {
  const existing = document.querySelector("[data-cookie-consent]");
  if (existing) existing.remove();
  if (trackingConsent && !force) return;

  const privacyHref = isEnglishDocument ? "/en/politique-confidentialite.html" : "/politique-confidentialite.html";
  const banner = document.createElement("aside");
  banner.className = "cookie-consent";
  banner.setAttribute("data-cookie-consent", "");
  banner.setAttribute("aria-label", cookieI18n.title);
  banner.innerHTML = `
    <div class="cookie-consent-panel">
      <div class="cookie-consent-copy">
        <p class="cookie-kicker">NEXURA</p>
        <h2>${cookieI18n.title}</h2>
        <p>${cookieI18n.copy} <a href="${privacyHref}">${cookieI18n.privacy}</a>.</p>
      </div>
      <div class="cookie-consent-options">
        <label><input type="checkbox" name="analytics" ${trackingConsent?.analytics ? "checked" : ""}> <span>${cookieI18n.analytics}</span></label>
        <label><input type="checkbox" name="marketing" ${trackingConsent?.marketing ? "checked" : ""}> <span>${cookieI18n.marketing}</span></label>
      </div>
      <div class="cookie-consent-actions">
        <button type="button" class="button button-outline" data-cookie-choice="reject">${cookieI18n.reject}</button>
        <button type="button" class="button button-secondary" data-cookie-choice="save">${cookieI18n.save}</button>
        <button type="button" class="button button-primary" data-cookie-choice="accept">${cookieI18n.accept}</button>
      </div>
    </div>`;

  banner.querySelectorAll("[data-cookie-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = button.dataset.cookieChoice;
      const form = banner.querySelector(".cookie-consent-options");
      const choices = choice === "accept"
        ? { analytics: true, marketing: true }
        : choice === "reject"
          ? { analytics: false, marketing: false }
          : {
            analytics: form.querySelector('[name="analytics"]')?.checked === true,
            marketing: form.querySelector('[name="marketing"]')?.checked === true
          };
      saveTrackingConsent(choices);
      banner.remove();
    });
  });

  document.body.appendChild(banner);
};

const bindCookiePreferenceTriggers = () => {
  document.querySelectorAll("[data-cookie-preferences]").forEach((button) => {
    button.addEventListener("click", () => renderCookieConsent(true));
  });
};

applyTrackingConsent();
renderCookieConsent();
bindCookiePreferenceTriggers();

const trackContactIntent = (method) => {
  if (trackingConsent?.marketing === true && typeof fbq === "function") {
    fbq("track", "Contact", getMetaEventPayload({ content_name: method }));
  }

  if (trackingConsent?.analytics === true && typeof window.gtag === "function") {
    window.gtag("event", "generate_lead", {
      method,
      event_category: "contact"
    });
  }
};

// ── WhatsApp floating button ──────────────────────────────────
(function () {
  // Skip on operator console
  if (window.location.pathname.startsWith("/operations")) return;

  const waNumber = "14388130592"; // digits only, no +
  const waLabel = isEnglishDocument ? "Chat on WhatsApp" : "Écrire sur WhatsApp";
  const waAriaLabel = isEnglishDocument ? "Contact us on WhatsApp" : "Nous contacter sur WhatsApp";
  const waMsg = isEnglishDocument
    ? "Hello, I found you on nexadura.com and I have a question."
    : "Bonjour, j'ai trouvé votre site nexadura.com et j'ai une question.";

  const btn = document.createElement("a");
  btn.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}`;
  btn.className = "whatsapp-fab";
  btn.setAttribute("target", "_blank");
  btn.setAttribute("rel", "noopener noreferrer");
  btn.setAttribute("aria-label", waAriaLabel);
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="28" height="28" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.12 1.533 5.849L.057 23.5a.5.5 0 0 0 .611.61l5.701-1.464A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.878 9.878 0 0 1-5.031-1.374l-.36-.214-3.733.959.987-3.64-.235-.374A9.868 9.868 0 0 1 2.1 12c0-5.468 4.432-9.9 9.9-9.9 5.467 0 9.9 4.432 9.9 9.9 0 5.467-4.433 9.9-9.9 9.9z"/></svg><span>${waLabel}</span>`;
  document.body.appendChild(btn);

  btn.addEventListener("click", function () {
    trackContactIntent("whatsapp_floating_button");
  });
}());

document.querySelectorAll("[data-contact-intent]").forEach((link) => {
  link.addEventListener("click", () => {
    trackContactIntent(link.dataset.contactIntent || "contact_link");
  });
});

const escapeHtml = (text) => {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
};

const publicI18n = isEnglishDocument
  ? {
    locale: "en-CA",
    navOpen: "Open navigation",
    navClose: "Close navigation",
    navMenu: "Menu",
    navCloseLabel: "Close",
    intakeSubjectPrefix: "NEXURA inquiry",
    fieldName: "Name",
    fieldEmail: "Email",
    fieldPhone: "Phone",
    fieldSupport: "Support",
    fieldUrgency: "Urgency",
    fieldProfile: "Requester profile",
    fieldImpact: "Business impact",
    fieldSensitivity: "Case sensitivity",
    fieldDescription: "Issue description",
    intakeRequired: "Complete the required fields before opening a case.",
    intakeBusy: "Opening...",
    intakeOpening: "Opening your case...",
    intakeOpenedSent: (caseId) => `Case ${caseId} opened. The access code was sent to the client.`,
    intakeOpenedQueued: (caseId) => `Case ${caseId} opened. The lab can now review the request.`,
    intakeFallback: "The backend is unavailable. Your email application is opening with a prefilled message.",
    intakeError: "The request could not be processed.",
    intakeOffline: "The backend is unreachable. Your email application is opening with a prefilled message.",
    statusRequired: "Enter a valid case number and access code.",
    statusNotFound: "No case matched this access. Check the credentials provided by NEXURA or request an update.",
    statusFound: "Case found.",
    statusBusy: "Searching...",
    statusSearching: "Searching for your case...",
    statusOffline: "The status portal is currently unavailable.",
    paymentKindDeposit: "Deposit",
    paymentKindFinal: "Balance",
    paymentKindCustom: "Payment",
    paymentStatusPaid: "Paid",
    paymentStatusExpired: "Expired",
    paymentStatusFailed: "Retry needed",
    paymentStatusOpen: "Open",
    paymentConfirmedOn: (timestamp) => `Payment confirmed on ${timestamp}`,
    paymentAvailableUntil: (timestamp) => `Link available until ${timestamp}`,
    paymentSentOn: (timestamp) => `Link sent on ${timestamp}`,
    paymentReference: (reference) => `Reference ${reference}`,
    paymentAction: "Pay online",
    authorizationReady: "Awaiting client approval",
    authorizationApproved: "Approved",
    authorizationNoAmount: "Amount shown in the transmitted scope",
    authorizationRequired: "Enter the authorizing name and confirm consent.",
    authorizationBusy: "Approving...",
    authorizationSending: "Approving the intervention request...",
    authorizationSuccess: "Authorization approved. The case has been updated.",
    authorizationError: "The authorization could not be confirmed.",
    authorizationOffline: "The authorization service is currently unavailable.",
    workroomLocked: "The lab is still qualifying the case. The guided workroom opens after payment or authorization.",
    workroomOpen: "Workroom open",
    workroomAwaiting: "Awaiting payment or authorization",
    workroomMailSubject: (caseId) => `NEXURA workroom - ${caseId}`,
    demoCaseOne: {
      status: "Assessment in progress",
      updatedAt: "April 4, 2026 11:40 AM",
      support: "USB external drive",
      nextStep: "Initial assessment update",
      summary: "The support was received and logged. Initial assessment is in progress before the quote or next steps are sent.",
      steps: [
        { title: "Case received", note: "Support received and logged.", state: "complete" },
        { title: "Assessment in progress", note: "Initial review and case qualification.", state: "active" },
        { title: "Quote", note: "To be issued after assessment.", state: "pending" },
        { title: "Recovery work", note: "Starts after authorization.", state: "pending" }
      ],
      payments: [],
      authorization: {
        available: false,
        approved: false,
        quoteStatus: "none",
        quoteAmountFormatted: "",
        quoteSentAt: "",
        quoteApprovedAt: ""
      }
    },
    demoCaseTwo: {
      status: "Quote sent",
      updatedAt: "April 4, 2026 10:15 AM",
      support: "RAID / NAS",
      nextStep: "Awaiting client authorization",
      summary: "Initial assessment is complete. The quote and intervention framework were sent to the client for approval.",
      steps: [
        { title: "Case received", note: "Support received and logged.", state: "complete" },
        { title: "Assessment complete", note: "Initial technical review completed.", state: "complete" },
        { title: "Quote sent", note: "Awaiting acceptance.", state: "active" },
        { title: "Recovery work", note: "Begins after authorization.", state: "pending" }
      ],
      payments: [
        {
          paymentRequestId: "PAY-20260404-A1B2C3",
          paymentKind: "deposit",
          status: "open",
          label: "Intervention deposit",
          description: "Opens the recovery work once the intervention is authorized.",
          amountCents: 65000,
          amountFormatted: "$650.00",
          currency: "cad",
          checkoutUrl: "https://checkout.stripe.com/pay/demo",
          createdAt: "2026-04-04T14:10:00.000Z",
          sentAt: "2026-04-04T14:11:00.000Z",
          paidAt: "",
          expiresAt: "2026-04-11T14:10:00.000Z"
        }
      ],
      authorization: {
        available: true,
        approved: false,
        quoteStatus: "sent",
        quoteAmountFormatted: "$650.00",
        quoteSentAt: "2026-04-04T14:10:00.000Z",
        quoteApprovedAt: ""
      }
    }
  }
  : {
    locale: "fr-CA",
    navOpen: "Ouvrir la navigation",
    navClose: "Fermer la navigation",
    navMenu: "Menu",
    navCloseLabel: "Fermer",
    intakeSubjectPrefix: "Demande NEXURA",
    fieldName: "Nom",
    fieldEmail: "Courriel",
    fieldPhone: "Téléphone",
    fieldSupport: "Support",
    fieldUrgency: "Urgence",
    fieldProfile: "Profil du demandeur",
    fieldImpact: "Impact d'affaires",
    fieldSensitivity: "Sensibilité du dossier",
    fieldDescription: "Description du problème",
    intakeRequired: "Complétez les champs requis avant d'ouvrir un dossier.",
    intakeBusy: "Ouverture...",
    intakeOpening: "Ouverture du dossier en cours...",
    intakeOpenedSent: (caseId) => `Dossier ${caseId} ouvert. Le code d'accès a été envoyé au client.`,
    intakeOpenedQueued: (caseId) => `Dossier ${caseId} ouvert. Le laboratoire peut maintenant qualifier le cas.`,
    intakeFallback: "Le backend n'est pas disponible. Votre application courriel s'ouvre avec un message prérempli.",
    intakeError: "La demande n'a pas pu être traitée.",
    intakeOffline: "Le backend n'est pas joignable. Votre application courriel s'ouvre avec un message prérempli.",
    statusRequired: "Entrez un numéro de dossier et un code d'accès valides.",
    statusNotFound: "Aucun dossier n'a été trouvé avec cet accès. Vérifiez les identifiants transmis par NEXURA ou demandez une mise à jour.",
    statusFound: "Dossier trouvé.",
    statusBusy: "Recherche...",
    statusSearching: "Recherche du dossier en cours...",
    statusOffline: "Le portail de suivi n'est pas joignable pour le moment.",
    paymentKindDeposit: "Acompte",
    paymentKindFinal: "Solde",
    paymentKindCustom: "Paiement",
    paymentStatusPaid: "Payé",
    paymentStatusExpired: "Expiré",
    paymentStatusFailed: "À reprendre",
    paymentStatusOpen: "Ouvert",
    paymentConfirmedOn: (timestamp) => `Paiement confirmé le ${timestamp}`,
    paymentAvailableUntil: (timestamp) => `Lien disponible jusqu'au ${timestamp}`,
    paymentSentOn: (timestamp) => `Lien transmis le ${timestamp}`,
    paymentReference: (reference) => `Référence ${reference}`,
    paymentAction: "Régler en ligne",
    authorizationReady: "En attente d'autorisation client",
    authorizationApproved: "Approuvée",
    authorizationNoAmount: "Montant indiqué dans le cadre transmis",
    authorizationRequired: "Inscrivez le nom de la personne qui autorise et confirmez le consentement.",
    authorizationBusy: "Approbation...",
    authorizationSending: "Approbation de la demande d'intervention...",
    authorizationSuccess: "Autorisation approuvée. Le dossier a été mis à jour.",
    authorizationError: "L'autorisation n'a pas pu être confirmée.",
    authorizationOffline: "Le service d'autorisation n'est pas joignable pour le moment.",
    workroomLocked: "Le laboratoire qualifie encore le dossier. L'espace guidé s'ouvre après paiement ou autorisation.",
    workroomOpen: "Espace de travail ouvert",
    workroomAwaiting: "En attente du paiement ou de l'autorisation",
    workroomMailSubject: (caseId) => `Espace de travail NEXURA - ${caseId}`,
    demoCaseOne: {
      status: "Évaluation en cours",
      updatedAt: "4 avril 2026 à 11 h 40",
      support: "Disque externe USB",
      nextStep: "Communication de l'évaluation initiale",
      summary: "Le support a été reçu et enregistré. L'évaluation initiale est en cours avant l'envoi de la soumission ou des prochaines étapes.",
      steps: [
        { title: "Dossier reçu", note: "Support reçu et pris en charge.", state: "complete" },
        { title: "Évaluation en cours", note: "Lecture initiale et qualification du cas.", state: "active" },
        { title: "Soumission", note: "À transmettre après évaluation.", state: "pending" },
        { title: "Traitement", note: "Commence après autorisation.", state: "pending" }
      ],
      payments: [],
      authorization: {
        available: false,
        approved: false,
        quoteStatus: "none",
        quoteAmountFormatted: "",
        quoteSentAt: "",
        quoteApprovedAt: ""
      }
    },
    demoCaseTwo: {
      status: "Soumission envoyée",
      updatedAt: "4 avril 2026 à 10 h 15",
      support: "RAID / NAS",
      nextStep: "Attente de l'autorisation client",
      summary: "L'évaluation initiale a été complétée. La soumission et le cadre d'intervention ont été transmis au client pour acceptation.",
      steps: [
        { title: "Dossier reçu", note: "Support reçu et enregistré.", state: "complete" },
        { title: "Évaluation", note: "Analyse initiale terminée.", state: "complete" },
        { title: "Soumission envoyée", note: "En attente d'acceptation.", state: "active" },
        { title: "Traitement", note: "Débute après autorisation.", state: "pending" }
      ],
      payments: [
        {
          paymentRequestId: "PAY-20260404-A1B2C3",
          paymentKind: "deposit",
          status: "open",
          label: "Acompte d'intervention",
          description: "Ouverture du traitement après autorisation et prise en charge du dossier.",
          amountCents: 65000,
          amountFormatted: "650,00 $",
          currency: "cad",
          checkoutUrl: "https://checkout.stripe.com/pay/demo",
          createdAt: "2026-04-04T14:10:00.000Z",
          sentAt: "2026-04-04T14:11:00.000Z",
          paidAt: "",
          expiresAt: "2026-04-11T14:10:00.000Z"
        }
      ],
      authorization: {
        available: true,
        approved: false,
        quoteStatus: "sent",
        quoteAmountFormatted: "650,00 $",
        quoteSentAt: "2026-04-04T14:10:00.000Z",
        quoteApprovedAt: ""
      }
    }
  };

if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

// Copyright footer — inject on all public pages that have .footer-note
const footerNote = document.querySelector(".footer-note");
if (footerNote) {
  const copyrightDiv = document.createElement("div");
  copyrightDiv.className = "footer-bottom";
  const year = new Date().getFullYear();
  copyrightDiv.innerHTML = isEnglishDocument
    ? `<p>&copy; ${year} NEXURA. All rights reserved.</p>`
    : `<p>&copy; ${year} NEXURA. Tous droits r\u00e9serv\u00e9s.</p>`;
  footerNote.insertAdjacentElement("afterend", copyrightDiv);
}

// Public header logo — normalize to the locked master asset on public pages.
document.querySelectorAll(".site-nav .brand-logo").forEach((logo) => {
  if (logo.getAttribute("src")?.includes("logo-petit.svg")) {
    logo.setAttribute("src", "/assets/nexuradata-master.svg");
  }
});

const revealElements = document.querySelectorAll("[data-reveal]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const initializeMobileNav = () => {
  const navbars = document.querySelectorAll(".navbar, .site-nav");

  if (navbars.length === 0) {
    return;
  }

  const mobileNavQuery = window.matchMedia("(max-width: 720px)");

  navbars.forEach((navbar, index) => {
    const navLinks = navbar.querySelector(".nav-links");

    if (!navLinks) {
      return;
    }

    const navId = navLinks.id || `site-navigation-${index + 1}`;
    navLinks.id = navId;
    navbar.classList.add("nav-enhanced");

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "nav-toggle";
    toggle.setAttribute("aria-controls", navId);

    const setOpen = (open) => {
      const isOpen = Boolean(open) && mobileNavQuery.matches;
      navbar.classList.toggle("is-nav-open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      toggle.setAttribute("aria-label", isOpen ? publicI18n.navClose : publicI18n.navOpen);
      toggle.textContent = isOpen ? publicI18n.navCloseLabel : publicI18n.navMenu;
    };

    setOpen(false);
    navbar.insertBefore(toggle, navLinks);

    toggle.addEventListener("click", () => {
      setOpen(!navbar.classList.contains("is-nav-open"));
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (mobileNavQuery.matches) {
          setOpen(false);
        }
      });
    });

    document.addEventListener("click", (event) => {
      if (!mobileNavQuery.matches || !navbar.classList.contains("is-nav-open")) {
        return;
      }

      if (navbar.contains(event.target)) {
        return;
      }

      setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    });

    const syncNavState = (event) => {
      if (!event.matches) {
        setOpen(false);
      }
    };

    if (typeof mobileNavQuery.addEventListener === "function") {
      mobileNavQuery.addEventListener("change", syncNavState);
    } else if (typeof mobileNavQuery.addListener === "function") {
      mobileNavQuery.addListener(syncNavState);
    }
  });
};

initializeMobileNav();

const showAllReveals = () => {
  revealElements.forEach((element) => element.classList.add("is-visible"));
};

if (!("IntersectionObserver" in window) || prefersReducedMotion.matches) {
  showAllReveals();
} else if (revealElements.length > 0) {
  const observer = new IntersectionObserver(
    (entries, activeObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");

        // Stagger direct children for grid containers
        if (entry.target.classList.contains("stagger-parent")) {
          Array.from(entry.target.children).forEach((child, i) => {
            child.style.transitionDelay = `${i * 68}ms`;
          });
        }

        activeObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px"
    }
  );

  revealElements.forEach((element) => observer.observe(element));
}

// Counter animation for [data-count] elements (hero panel stats)
const counterElements = document.querySelectorAll("[data-count]");
if (counterElements.length > 0 && "IntersectionObserver" in window && !prefersReducedMotion.matches) {
  const counterObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.countSuffix || "";
        const locale = document.documentElement.lang?.startsWith("en") ? "en-CA" : "fr-CA";
        const duration = 1400;
        const startTime = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(eased * target).toLocaleString(locale) + suffix;
          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            el.textContent = target.toLocaleString(locale) + suffix;
          }
        };
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  counterElements.forEach((el) => counterObserver.observe(el));
}

// Smooth FAQ open/close animation via Web Animations API
document.querySelectorAll(".faq-item").forEach((details) => {
  const summary = details.querySelector("summary");
  const content = details.querySelector("p");
  if (!summary || !content) return;

  summary.addEventListener("click", (e) => {
    if (prefersReducedMotion.matches) return;
    e.preventDefault();

    if (!details.open) {
      details.open = true;
      const h = content.scrollHeight;
      content.animate(
        [
          { maxHeight: "0", opacity: "0", paddingBottom: "0" },
          { maxHeight: h + "px", opacity: "1", paddingBottom: "1.4rem" }
        ],
        { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
      );
    } else {
      const h = content.scrollHeight;
      const anim = content.animate(
        [
          { maxHeight: h + "px", opacity: "1", paddingBottom: "1.4rem" },
          { maxHeight: "0", opacity: "0", paddingBottom: "0" }
        ],
        { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
      );
      anim.onfinish = () => {
        details.open = false;
        anim.cancel();
      };
    }
  });
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const href = anchor.getAttribute("href");

    if (!href || href === "#") {
      return;
    }

    const target = document.querySelector(href);

    if (!target) {
      return;
    }

    event.preventDefault();

    target.scrollIntoView({
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
      block: "start"
    });
  });
});

const paymentFeedback = document.querySelector("[data-payment-feedback]");

if (paymentFeedback) {
  const params = new URLSearchParams(window.location.search);
  const caseId = params.get("caseId") || "";
  const activationId = params.get("activationId") || "";
  const paymentRequestId = params.get("paymentRequestId") || activationId;
  const caseTarget = paymentFeedback.querySelector("[data-payment-feedback-case]");
  const requestTarget = paymentFeedback.querySelector("[data-payment-feedback-request]");
  const followLink = paymentFeedback.querySelector("[data-payment-feedback-follow]");
  const mailLink = paymentFeedback.querySelector("[data-payment-feedback-mail]");

  if (caseTarget) {

document.querySelectorAll("[data-paid-path-app]").forEach((app) => {
  const form = app.querySelector("[data-paid-path-form]");
  const titleTarget = app.querySelector("[data-paid-path-title]");
  const priceTarget = app.querySelector("[data-paid-path-price]");
  const summaryTarget = app.querySelector("[data-paid-path-summary]");
  const stepsTarget = app.querySelector("[data-paid-path-steps]");
  const startLink = app.querySelector("[data-paid-path-start]");

  if (!form || !titleTarget || !priceTarget || !summaryTarget || !stepsTarget) {
    return;
  }

  const copy = isEnglishDocument
    ? {
      guided: {
        title: "Paid guided review",
        price: "From $149",
        summary: "A lab-guided sequence for software issues, clean restores, account-side recovery steps or safe preparation before a deeper intervention.",
        steps: ["Pay for the guided review.", "Send screenshots, symptoms, logs or file lists.", "Receive the validated steps and limits to follow."]
      },
      recovery: {
        title: "Media intervention deposit",
        price: "From $350",
        summary: "For physical media, NEXURA confirms the safest handling path before work begins and tells you exactly what to send or avoid doing.",
        steps: ["Open the case and confirm the deposit.", "Prepare the media using the reception instructions.", "Receive the next handling or lab treatment step."]
      },
      forensic: {
        title: "Sensitive case authorization",
        price: "Quoted",
        summary: "For evidence, incidents or disputes, the authorization confirms scope, confidentiality expectations and the next controlled action.",
        steps: ["Open the request with the relevant context.", "Review the transmitted scope.", "Authorize the controlled intervention through the client portal."]
      },
      enterprise: {
        title: "Operational intervention path",
        price: "Priority quote",
        summary: "For RAID, NAS, servers or blocked operations, the first decision is about risk, continuity and the cleanest route to restore activity.",
        steps: ["Share the system context and business impact.", "Receive the intervention frame.", "Approve the request before production-facing work begins."]
      }
    }
    : {
      guided: {
        title: "Revue guidée payante",
        price: "À partir de 149 $",
        summary: "Une séquence guidée par le laboratoire pour les problèmes logiciels, restaurations propres, accès ou préparation sécurisée avant une intervention plus lourde.",
        steps: ["Payer la revue guidée.", "Envoyer les captures, symptômes, journaux ou listes de fichiers.", "Recevoir les étapes validées et les limites à respecter."]
      },
      recovery: {
        title: "Acompte d'intervention support",
        price: "À partir de 350 $",
        summary: "Pour un support physique, NEXURA confirme la voie de manipulation la plus sûre avant le traitement et indique exactement quoi transmettre ou éviter.",
        steps: ["Ouvrir le dossier et confirmer l'acompte.", "Préparer le support selon les consignes de réception.", "Recevoir la prochaine étape de manipulation ou de traitement."]
      },
      forensic: {
        title: "Autorisation de dossier sensible",
        price: "Sur soumission",
        summary: "Pour une preuve, un incident ou un litige, l'autorisation confirme le périmètre, la confidentialité et la prochaine action contrôlée.",
        steps: ["Ouvrir la demande avec le contexte pertinent.", "Réviser le cadre transmis.", "Autoriser l'intervention contrôlée dans le portail client."]
      },
      enterprise: {
        title: "Parcours d'intervention opérationnelle",
        price: "Soumission prioritaire",
        summary: "Pour RAID, NAS, serveurs ou opérations bloquées, la première décision porte sur le risque, la continuité et la voie de reprise la plus propre.",
        steps: ["Partager le contexte système et l'impact d'affaires.", "Recevoir le cadre d'intervention.", "Approuver la demande avant le travail touchant la production."]
      }
    };

  const updateRecommendation = () => {
    const formData = new FormData(form);
    const objective = `${formData.get("objective") || "guided"}`;
    const urgency = `${formData.get("urgency") || "standard"}`;
    const recommendation = copy[objective] || copy.guided;

    titleTarget.textContent = recommendation.title;
    priceTarget.textContent = urgency === "critical" && objective !== "guided"
      ? (isEnglishDocument ? "Priority quote" : "Soumission prioritaire")
      : recommendation.price;
    summaryTarget.textContent = recommendation.summary;
    stepsTarget.replaceChildren(...recommendation.steps.map((step) => {
      const item = document.createElement("li");
      item.textContent = step;
      return item;
    }));

    if (startLink) {
      const label = encodeURIComponent(recommendation.title);
      startLink.href = isEnglishDocument ? `/en/?path=${label}#contact` : `index.html?path=${label}#contact`;
    }
  };

  form.addEventListener("change", updateRecommendation);
  updateRecommendation();
});
    caseTarget.textContent = caseId || (activationId ? "Activation opérationnelle" : "Non précisé");
  }

  if (requestTarget) {
    requestTarget.textContent = paymentRequestId || "Non précisée";
  }

  if (followLink && caseId) {
    followLink.href = `suivi-dossier-client-montreal.html?caseId=${encodeURIComponent(caseId)}`;
  }

  if (mailLink) {
    const subject = caseId
      ? `Dossier ${caseId} - suivi paiement`
      : "Suivi activation NEXURA";
    const body = [
      caseId ? `Numéro de dossier: ${caseId}` : "",
      paymentRequestId ? `Référence d'activation: ${paymentRequestId}` : "",
      "",
      "Message:"
    ].filter(Boolean).join("\n");

    mailLink.href = `mailto:contact@nexuradata.ca?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
}

const setMessage = (target, state, text) => {
  if (!target) {
    return;
  }

  target.dataset.state = state;
  target.textContent = text;
};

const setButtonBusy = (button, busy, busyLabel) => {
  if (!button) {
    return;
  }

  if (busy) {
    if (!button.dataset.defaultLabel) {
      button.dataset.defaultLabel = button.textContent || "";
    }

    if (busyLabel) {
      button.textContent = busyLabel;
    }

    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    return;
  }

  if (button.dataset.defaultLabel) {
    button.textContent = button.dataset.defaultLabel;
  }

  button.disabled = false;
  button.removeAttribute("aria-busy");
};

const initializeWorkflowSimulator = () => {
  const simulator = document.querySelector("[data-workflow-simulator]");
  if (!simulator) return;

  const states = isEnglishDocument
    ? {
      lead: {
        classification: "Form: operational problem received",
        routing: "AI: complexity and solution recommended",
        task: "Stripe: assessment ready to activate",
        dashboard: "Dashboard: workflow and progress visible",
        status: "Workflow active",
        metrics: [18, 7, 42],
        feed: ["Client problem analyzed by AI", "AI estimate generated", "Workflow created in dashboard"]
      },
      task: {
        classification: "Task: repetitive internal work detected",
        routing: "Workflow: owner and next step assigned",
        task: "Automation: reminder and follow-up created",
        dashboard: "Dashboard: internal task visible",
        status: "Task routed",
        metrics: [21, 9, 47],
        feed: ["Task captured", "Owner assigned", "Follow-up automated"]
      },
      client: {
        classification: "Request: client follow-up needed",
        routing: "Workflow: support + account owner",
        task: "Automation: response path and SLA created",
        dashboard: "Dashboard: client queue synchronized",
        status: "Client request tracked",
        metrics: [16, 5, 38],
        feed: ["Client request structured", "SLA path assigned", "Queue synchronized"]
      },
      support: {
        classification: "Support: issue categorized",
        routing: "Workflow: support + escalation rule",
        task: "Automation: context collected and follow-up triggered",
        dashboard: "Dashboard: support load visible",
        status: "Support workflow active",
        metrics: [24, 11, 53],
        feed: ["Support issue categorized", "Escalation rule checked", "Follow-up triggered"]
      }
    }
    : {
      lead: {
        classification: "Formulaire: probleme operationnel recu",
        routing: "AI: complexite et solution recommandees",
        task: "Stripe: assessment pret a activer",
        dashboard: "Dashboard: workflow et progression visibles",
        status: "Workflow actif",
        metrics: [18, 7, 42],
        feed: ["Probleme client analyse par AI", "Estimation AI generee", "Workflow cree dans le dashboard"]
      },
      task: {
        classification: "Tache: travail repetitif detecte",
        routing: "Workflow: responsable et prochaine etape assignes",
        task: "Automatisation: rappel et suivi crees",
        dashboard: "Dashboard: tache interne visible",
        status: "Tache routee",
        metrics: [21, 9, 47],
        feed: ["Tache capturee", "Responsable assigne", "Suivi automatise"]
      },
      client: {
        classification: "Demande: suivi client requis",
        routing: "Workflow: support + responsable compte",
        task: "Automatisation: parcours de reponse et SLA crees",
        dashboard: "Dashboard: file client synchronisee",
        status: "Demande client suivie",
        metrics: [16, 5, 38],
        feed: ["Demande client structuree", "Parcours SLA assigne", "File synchronisee"]
      },
      support: {
        classification: "Support: probleme categorise",
        routing: "Workflow: support + regle d'escalade",
        task: "Automatisation: contexte collecte et suivi declenche",
        dashboard: "Dashboard: charge support visible",
        status: "Workflow support actif",
        metrics: [24, 11, 53],
        feed: ["Probleme support categorise", "Regle d'escalade verifiee", "Suivi declenche"]
      }
    };

  const targets = {
    classification: simulator.querySelector("[data-sim-classification]"),
    routing: simulator.querySelector("[data-sim-routing]"),
    task: simulator.querySelector("[data-sim-task]"),
    dashboard: simulator.querySelector("[data-sim-dashboard]"),
    status: document.querySelector("[data-dashboard-state]"),
    workflows: document.querySelector("[data-metric-workflows]"),
    tasks: document.querySelector("[data-metric-tasks]"),
    events: document.querySelector("[data-metric-events]"),
    feed: document.querySelector("[data-activity-feed]")
  };

  const applyState = (type) => {
    const state = states[type] || states.lead;
    targets.classification.textContent = state.classification;
    targets.routing.textContent = state.routing;
    targets.task.textContent = state.task;
    targets.dashboard.textContent = state.dashboard;
    if (targets.status) targets.status.textContent = state.status;
    if (targets.workflows) targets.workflows.textContent = state.metrics[0];
    if (targets.tasks) targets.tasks.textContent = state.metrics[1];
    if (targets.events) targets.events.textContent = state.metrics[2];
    if (targets.feed) {
      targets.feed.replaceChildren(...state.feed.map((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        return li;
      }));
    }

    simulator.classList.remove("is-updating");
    void simulator.offsetWidth;
    simulator.classList.add("is-updating");
  };

  simulator.querySelectorAll("[data-sim-type]").forEach((button) => {
    button.addEventListener("click", () => {
      simulator.querySelectorAll("[data-sim-type]").forEach((option) => option.classList.remove("is-active"));
      button.classList.add("is-active");
      applyState(button.dataset.simType);
    });
  });
};

initializeWorkflowSimulator();

const parseJsonResponse = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const operationalCheckoutCopy = isEnglishDocument
  ? {
    busy: "Initializing...",
    opening: "Opening the secure activation layer...",
    unavailable: "Secure activation is temporarily unavailable. Operations can issue the activation link manually.",
    failed: "The secure activation could not be initialized."
  }
  : {
    busy: "Initialisation...",
    opening: "Ouverture de la couche d'activation sécurisée...",
    unavailable: "L'activation sécurisée est temporairement indisponible. Les opérations peuvent émettre le lien manuellement.",
    failed: "L'activation sécurisée n'a pas pu être initialisée."
  };

async function startOperationalCheckout(options = {}) {
  const trigger = options.trigger || null;
  const panel = trigger?.closest("[data-operational-checkout-panel]") || document;
  const statusTarget = panel.querySelector("[data-operational-checkout-status]");

  setButtonBusy(trigger, true, operationalCheckoutCopy.busy);
  setMessage(statusTarget, "success", operationalCheckoutCopy.opening);

  try {
    const response = await fetch("/api/create-checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify({
        amount: 25000,
        source: "operational_assessment",
        page: window.location.pathname,
        ...(options.payload || {})
      })
    });
    const data = await parseJsonResponse(response);

    if (response.ok && data?.url) {
      if (trackingConsent?.analytics === true && typeof window.gtag === "function") {
        window.gtag("event", "begin_checkout", {
          event_category: "operational_activation",
          currency: "CAD",
          value: ((Number(options.payload?.amount) || 25000) / 100)
        });
      }

      window.location.href = data.url;
      return;
    }

    setMessage(statusTarget, "error", data?.message || operationalCheckoutCopy.failed);
  } catch {
    setMessage(statusTarget, "error", operationalCheckoutCopy.unavailable);
  } finally {
    setButtonBusy(trigger, false);
  }
}

window.startOperationalCheckout = startOperationalCheckout;

document.querySelectorAll("[data-operational-checkout]").forEach((button) => {
  button.addEventListener("click", () => startOperationalCheckout({ trigger: button }));
});

const estimateForm = document.getElementById("estimate-form");

if (estimateForm) {
  const statusTarget = document.querySelector("[data-estimate-status]");
  const resultPanel = document.querySelector("[data-estimate-result]");
  const scopeTarget = document.querySelector("[data-estimate-scope]");
  const rangeTarget = document.querySelector("[data-estimate-range]");
  const complexityTarget = document.querySelector("[data-estimate-complexity]");
  const orchestrationTarget = document.querySelector("[data-estimate-orchestration]");
  const integrationTarget = document.querySelector("[data-estimate-integration]");
  const urgencyTarget = document.querySelector("[data-estimate-urgency]");
  const workflowCountTarget = document.querySelector("[data-estimate-workflow-count]");
  const teamComplexityTarget = document.querySelector("[data-estimate-team-complexity]");
  const dashboardNeedTarget = document.querySelector("[data-estimate-dashboard-need]");
  const analysisNeedTarget = document.querySelector("[data-estimate-analysis-need]");
  const summaryTarget = document.querySelector("[data-estimate-summary]");
  const missingTarget = document.querySelector("[data-estimate-missing]");
  const confidenceTarget = document.querySelector("[data-estimate-confidence]");
  const paymentButton = document.querySelector("[data-estimate-payment]");
  const submitButton = estimateForm.querySelector('button[type="submit"]');
  let latestEstimate = null;

  const copy = isEnglishDocument
    ? {
      required: "Complete the operational estimate fields.",
      busy: "Analyzing...",
      running: "Analyzing operational scope...",
      ready: "NEXURA estimate prepared. Human validation remains required.",
      error: "The estimate could not be generated.",
      paymentBusy: "Initializing...",
      scopeFallback: "Estimated operational scope",
      missingPrefix: "Missing details",
      humanValidation: "Human validation required before final proposal.",
      confidenceLabel: "confidence"
    }
    : {
      required: "Completez les champs d'estimation operationnelle.",
      busy: "Analyse...",
      running: "Analyse du perimetre operationnel...",
      ready: "Estimation NEXURA preparee. Une validation humaine reste requise.",
      error: "L'estimation n'a pas pu etre generee.",
      paymentBusy: "Initialisation...",
      scopeFallback: "Perimetre operationnel estime",
      missingPrefix: "Details manquants",
      humanValidation: "Validation humaine requise avant la proposition finale.",
      confidenceLabel: "confiance"
    };

  const renderEstimate = (data) => {
    const estimate = data?.estimate;

    if (!estimate) return;

    const assessmentAmount = Math.min(
      150000,
      Math.max(25000, Number(estimate.estimated_min) || 75000)
    );

    latestEstimate = {
      leadId: data?.lead?.id || "",
      email: data?.lead?.email || "",
      amount: assessmentAmount
    };

    if (scopeTarget) scopeTarget.textContent = estimate.recommended_scope || copy.scopeFallback;
    if (rangeTarget) {
      rangeTarget.textContent = `${formatCurrency(estimate.estimated_min)} - ${formatCurrency(estimate.estimated_max)}`;
    }
    if (workflowCountTarget) workflowCountTarget.textContent = `${estimate.scores?.workflow_count || 1}/5`;
    if (integrationTarget) integrationTarget.textContent = `${estimate.scores?.integration_count || 1}/5`;
    if (teamComplexityTarget) teamComplexityTarget.textContent = `${estimate.scores?.team_complexity || 1}/5`;
    if (orchestrationTarget) orchestrationTarget.textContent = `${estimate.scores?.automation_depth || 1}/5`;
    if (dashboardNeedTarget) dashboardNeedTarget.textContent = `${estimate.scores?.dashboard_need || 1}/5`;
    if (analysisNeedTarget) analysisNeedTarget.textContent = `${estimate.scores?.ai_need || 1}/5`;
    if (urgencyTarget) urgencyTarget.textContent = `${estimate.scores?.urgency_risk || 1}/5`;
    if (complexityTarget) complexityTarget.textContent = `${estimate.scores?.total || "-"}/35`;
    if (summaryTarget) summaryTarget.textContent = estimate.client_facing_summary || estimate.ai_summary || "";
    if (missingTarget) {
      const missing = Array.isArray(estimate.missing_information) ? estimate.missing_information : [];
      missingTarget.textContent = missing.length ? `${copy.missingPrefix}: ${missing.join(", ")}` : copy.humanValidation;
    }
    if (confidenceTarget) {
      confidenceTarget.textContent = estimate.confidence ? `${estimate.confidence} ${copy.confidenceLabel}` : "Draft";
    }
    if (paymentButton) paymentButton.hidden = false;
    if (resultPanel) resultPanel.hidden = false;
  };

  estimateForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!estimateForm.checkValidity()) {
      estimateForm.reportValidity();
      setMessage(statusTarget, "error", copy.required);
      return;
    }

    const formData = new FormData(estimateForm);
    const payload = {
      organization: `${formData.get("organization") || ""}`.trim(),
      contact_name: `${formData.get("contact_name") || ""}`.trim(),
      email: `${formData.get("email") || ""}`.trim(),
      workflow_summary: `${formData.get("workflow_summary") || ""}`.trim(),
      current_tools: `${formData.get("current_tools") || ""}`.trim(),
      workflow_count: `${formData.get("workflow_count") || ""}`.trim(),
      teams_involved: `${formData.get("teams_involved") || ""}`.trim(),
      dashboard_visibility: `${formData.get("dashboard_visibility") || ""}`.trim(),
      ai_routing: `${formData.get("ai_routing") || ""}`.trim(),
      payment_portal: `${formData.get("payment_portal") || ""}`.trim(),
      urgency: `${formData.get("urgency") || ""}`.trim(),
      budget_expectation: `${formData.get("budget_expectation") || ""}`.trim(),
      preferred_language: `${formData.get("preferred_language") || ""}`.trim()
    };

    setButtonBusy(submitButton, true, copy.busy);
    setMessage(statusTarget, "success", copy.running);

    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await parseJsonResponse(response);

      if (response.ok && data?.ok) {
        renderEstimate(data);
        setMessage(statusTarget, "success", copy.ready);
        return;
      }

      setMessage(statusTarget, "error", data?.message || copy.error);
    } catch {
      setMessage(statusTarget, "error", copy.error);
    } finally {
      setButtonBusy(submitButton, false);
    }
  });

  if (paymentButton) {
    paymentButton.addEventListener("click", () => {
      setButtonBusy(paymentButton, true, copy.paymentBusy);
      startOperationalCheckout({
        trigger: paymentButton,
        payload: {
          lead_id: latestEstimate?.leadId || "",
          email: latestEstimate?.email || "",
          amount: latestEstimate?.amount || 75000
        }
      });
    });
  }
}

const formatTimestamp = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(publicI18n.locale, {
    dateStyle: "long",
    timeStyle: "short"
  }).format(date);
};

const formatCurrency = (amountCents, currency = "cad") =>
  new Intl.NumberFormat(publicI18n.locale, {
    style: "currency",
    currency: `${currency || "cad"}`.toUpperCase()
  }).format((Number(amountCents) || 0) / 100);

const buildIntakeMailto = (formData) => {
  const subject = `${publicI18n.intakeSubjectPrefix} - ${formData.get("support")} - ${formData.get("urgence")}`;
  const bodyLines = [
    `${publicI18n.fieldName}: ${formData.get("nom") || ""}`,
    `${publicI18n.fieldEmail}: ${formData.get("courriel") || ""}`,
    `${publicI18n.fieldPhone}: ${formData.get("telephone") || ""}`,
    `${publicI18n.fieldSupport}: ${formData.get("support") || ""}`,
    `${publicI18n.fieldUrgency}: ${formData.get("urgence") || ""}`,
    `${publicI18n.fieldProfile}: ${formData.get("profil") || ""}`,
    `${publicI18n.fieldImpact}: ${formData.get("impact") || ""}`,
    `${publicI18n.fieldSensitivity}: ${formData.get("sensibilite") || ""}`,
    "",
    `${publicI18n.fieldDescription}:`,
    `${formData.get("message") || ""}`
  ];

  return `mailto:contact@nexuradata.ca?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
};

const createStatusStep = (step) => {
  const article = document.createElement("article");
  article.className = `status-step status-step-${step.state}`;

  const title = document.createElement("p");
  title.className = "status-step-title";
  title.textContent = step.title;

  const note = document.createElement("p");
  note.className = "status-step-note";
  note.textContent = step.note;

  article.append(title, note);
  return article;
};

const formatPaymentKindLabel = (paymentKind) => {
  if (paymentKind === "deposit") {
    return publicI18n.paymentKindDeposit;
  }

  if (paymentKind === "final") {
    return publicI18n.paymentKindFinal;
  }

  return publicI18n.paymentKindCustom;
};

const formatPaymentStatusLabel = (status) => {
  if (status === "paid") {
    return publicI18n.paymentStatusPaid;
  }

  if (status === "expired") {
    return publicI18n.paymentStatusExpired;
  }

  if (status === "failed") {
    return publicI18n.paymentStatusFailed;
  }

  return publicI18n.paymentStatusOpen;
};

const createStatusPayment = (payment) => {
  const article = document.createElement("article");
  article.className = "status-payment";

  const head = document.createElement("div");
  head.className = "status-payment-head";

  const title = document.createElement("p");
  title.className = "status-payment-title";
  title.textContent = payment.label;

  const badge = document.createElement("span");
  badge.className = `status-payment-badge is-${payment.status || "open"}`;
  badge.textContent = formatPaymentStatusLabel(payment.status);

  head.append(title, badge);

  const meta = document.createElement("p");
  meta.className = "status-payment-meta";
  meta.textContent = `${payment.amountFormatted || formatCurrency(payment.amountCents, payment.currency)} · ${formatPaymentKindLabel(payment.paymentKind)}`;

  const note = document.createElement("p");
  note.className = "status-payment-note";
  note.textContent = payment.description;

  const details = document.createElement("p");
  details.className = "status-payment-meta";
  details.textContent =
    payment.status === "paid" && payment.paidAt
      ? publicI18n.paymentConfirmedOn(formatTimestamp(payment.paidAt))
      : payment.status === "open" && payment.expiresAt
        ? publicI18n.paymentAvailableUntil(formatTimestamp(payment.expiresAt))
        : payment.sentAt
          ? publicI18n.paymentSentOn(formatTimestamp(payment.sentAt))
          : publicI18n.paymentReference(payment.paymentRequestId);

  article.append(head, meta, note);

  if (payment.checkoutUrl) {
    const actions = document.createElement("div");
    actions.className = "status-payment-actions";

    const link = document.createElement("a");
    link.className = "button button-primary button-small";
    link.href = payment.checkoutUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = publicI18n.paymentAction;

    actions.append(link);
    article.append(actions);
  }

  article.append(details);
  return article;
};

let currentStatusCredentials = null;

const renderAuthorizationState = (record, statusPanel) => {
  const section = statusPanel?.querySelector("[data-authorization-section]");

  if (!section) {
    return;
  }

  const authorization = record.authorization || {};
  const isAvailable = Boolean(authorization.available);
  section.hidden = !isAvailable;

  if (!isAvailable) {
    return;
  }

  const amountTarget = section.querySelector("[data-authorization-amount]");
  const stateTarget = section.querySelector("[data-authorization-state]");
  const form = section.querySelector("[data-authorization-form]");
  const submitButton = form?.querySelector('button[type="submit"]');

  if (amountTarget) {
    amountTarget.textContent = authorization.quoteAmountFormatted || publicI18n.authorizationNoAmount;
  }

  if (stateTarget) {
    stateTarget.textContent = authorization.approved ? publicI18n.authorizationApproved : publicI18n.authorizationReady;
  }

  if (form) {
    form.hidden = Boolean(authorization.approved);
  }

  if (submitButton) {
    submitButton.disabled = Boolean(authorization.approved);
  }
};

const workroomCopy = isEnglishDocument
  ? {
    guided: {
      title: "Guided repair workroom",
      note: "Use this path when the lab can safely guide actions before deeper handling.",
      prepare: ["Keep the device powered as-is unless the lab asks otherwise.", "Prepare screenshots, error messages, account notices or file names.", "Write down what changed just before the issue appeared."],
      avoid: ["Do not install random recovery utilities.", "Do not reset, reinstall or overwrite the affected data.", "Do not send passwords through chat or email."],
      transfer: "Send the symptoms and screenshots first. If remote assistance is useful, NEXURA will confirm a supervised session with your consent."
    },
    media: {
      title: "Media intervention workroom",
      note: "Use this path for drives, SSDs, USB keys and memory cards.",
      prepare: ["Stop using the media immediately.", "Label the device with the case number.", "Prepare the cable, enclosure or adapter if it is part of the issue."],
      avoid: ["Do not run repair, format or disk-check tools.", "Do not open the device casing.", "Do not keep reconnecting media that clicks, disconnects or overheats."],
      transfer: "Send a short note with the device model and symptoms. The lab will confirm drop-off, shipping or remote preparation instructions."
    },
    raid: {
      title: "Business continuity workroom",
      note: "Use this path for RAID, NAS, server and operations-blocking incidents.",
      prepare: ["List the number of disks and any disk labels or slot positions.", "Export screenshots of the storage dashboard if accessible.", "Identify the last known healthy state and any rebuild attempt."],
      avoid: ["Do not rebuild, initialize or replace disks blindly.", "Do not force-mount affected volumes in write mode.", "Do not change disk order."],
      transfer: "Send architecture details and business impact. NEXURA will confirm whether the next step is remote review, image capture or lab handling."
    },
    forensic: {
      title: "Evidence and incident workroom",
      note: "Use this path when traceability, dispute, insurer, HR or legal context matters.",
      prepare: ["Preserve the original device or account state.", "Write a timeline of events and involved parties.", "Collect reference numbers, insurer notes or mandate context."],
      avoid: ["Do not modify, clean or reorganize evidence.", "Do not share sensitive material through informal channels.", "Do not let multiple people handle the same device without tracking."],
      transfer: "Send only the context first. NEXURA will confirm the controlled transfer method and the evidence-handling boundary."
    },
    mobile: {
      title: "Mobile case workroom",
      note: "Use this path for phones, tablets and app/account recovery contexts.",
      prepare: ["Keep the device charged and available.", "Note the model, passcode availability and cloud/account status.", "Prepare screenshots of error messages if the device still opens."],
      avoid: ["Do not factory reset the device.", "Do not keep guessing passcodes.", "Do not update or erase the phone before the lab confirms the path."],
      transfer: "Send the device model and access situation. The lab will confirm if guidance, remote support or physical handling is appropriate."
    }
  }
  : {
    guided: {
      title: "Espace de correction guidée",
      note: "Utilisez ce parcours lorsque le laboratoire peut guider des actions sécuritaires avant une prise en charge plus lourde.",
      prepare: ["Gardez l'appareil dans son état actuel sauf consigne contraire.", "Préparez captures, messages d'erreur, avis de compte ou noms de fichiers.", "Notez ce qui a changé juste avant l'apparition du problème."],
      avoid: ["N'installez pas d'utilitaires de récupération au hasard.", "Ne réinitialisez pas, ne réinstallez pas et n'écrasez pas les données touchées.", "N'envoyez pas de mots de passe par clavardage ou courriel."],
      transfer: "Envoyez d'abord les symptômes et captures. Si une assistance à distance est utile, NEXURA confirme une session supervisée avec votre consentement."
    },
    media: {
      title: "Espace d'intervention support",
      note: "Utilisez ce parcours pour disques, SSD, clés USB et cartes mémoire.",
      prepare: ["Cessez immédiatement d'utiliser le support.", "Identifiez le support avec le numéro de dossier.", "Préparez le câble, boîtier ou adaptateur si cela fait partie du problème."],
      avoid: ["Ne lancez pas d'outil de réparation, formatage ou vérification disque.", "N'ouvrez pas le boîtier du support.", "Ne rebranchez pas en boucle un média qui clique, décroche ou chauffe."],
      transfer: "Envoyez une note courte avec le modèle et les symptômes. Le laboratoire confirme dépôt, expédition ou préparation à distance."
    },
    raid: {
      title: "Espace continuité d'activité",
      note: "Utilisez ce parcours pour RAID, NAS, serveurs et incidents qui bloquent les opérations.",
      prepare: ["Listez le nombre de disques et les positions ou étiquettes visibles.", "Exportez des captures de la console de stockage si elle est accessible.", "Indiquez le dernier état sain connu et toute tentative de reconstruction."],
      avoid: ["Ne reconstruisez pas, n'initialisez pas et ne remplacez pas des disques à l'aveugle.", "Ne forcez pas le montage en écriture.", "Ne changez pas l'ordre des disques."],
      transfer: "Envoyez l'architecture et l'impact d'affaires. NEXURA confirme si la suite passe par revue distante, image disque ou laboratoire."
    },
    forensic: {
      title: "Espace preuve et incident",
      note: "Utilisez ce parcours lorsque la traçabilité, un litige, un assureur, RH ou un contexte juridique compte.",
      prepare: ["Préservez l'appareil ou le compte dans son état original.", "Rédigez une chronologie des événements et parties impliquées.", "Rassemblez numéros de référence, notes d'assureur ou contexte de mandat."],
      avoid: ["Ne modifiez pas, ne nettoyez pas et ne réorganisez pas la preuve.", "Ne partagez pas de matériel sensible par des canaux informels.", "Ne laissez pas plusieurs personnes manipuler le même support sans suivi."],
      transfer: "Envoyez d'abord le contexte. NEXURA confirme la méthode de transmission contrôlée et la limite de traitement probatoire."
    },
    mobile: {
      title: "Espace dossier mobile",
      note: "Utilisez ce parcours pour téléphones, tablettes et récupération liée aux apps ou comptes.",
      prepare: ["Gardez l'appareil chargé et disponible.", "Notez le modèle, l'accès au code et l'état des comptes infonuagiques.", "Préparez les captures d'erreur si l'appareil s'ouvre encore."],
      avoid: ["Ne réinitialisez pas l'appareil.", "Ne multipliez pas les essais de code.", "Ne mettez pas à jour et n'effacez pas le téléphone avant validation."],
      transfer: "Envoyez le modèle et la situation d'accès. Le laboratoire confirme si la suite passe par guidage, assistance distante ou manipulation physique."
    }
  };

const getWorkroomType = (support = "") => {
  const normalized = `${support}`.toLowerCase();

  if (normalized.includes("raid") || normalized.includes("nas") || normalized.includes("serveur") || normalized.includes("server")) {
    return "raid";
  }

  if (normalized.includes("forensique") || normalized.includes("preuve") || normalized.includes("juridique") || normalized.includes("forensic") || normalized.includes("evidence") || normalized.includes("legal")) {
    return "forensic";
  }

  if (normalized.includes("téléphone") || normalized.includes("telephone") || normalized.includes("mobile") || normalized.includes("phone")) {
    return "mobile";
  }

  if (normalized.includes("disque") || normalized.includes("drive") || normalized.includes("ssd") || normalized.includes("usb") || normalized.includes("carte") || normalized.includes("memory")) {
    return "media";
  }

  return "guided";
};

const hasWorkroomAccess = (record) => {
  const authorization = record.authorization || {};
  const payments = Array.isArray(record.payments) ? record.payments : [];
  return Boolean(authorization.approved) || payments.some((payment) => payment.status === "paid");
};

const renderListItems = (target, items) => {
  if (!target) return;
  target.replaceChildren(...items.map((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    return item;
  }));
};

const renderWorkroom = (record, statusPanel) => {
  const section = statusPanel?.querySelector("[data-workroom-section]");

  if (!section) return;

  const type = getWorkroomType(record.support);
  const copy = workroomCopy[type] || workroomCopy.guided;
  const unlocked = hasWorkroomAccess(record);
  const titleTarget = section.querySelector("[data-workroom-title]");
  const noteTarget = section.querySelector("[data-workroom-note]");
  const statusTarget = section.querySelector("[data-workroom-status]");
  const prepareTarget = section.querySelector("[data-workroom-prepare]");
  const avoidTarget = section.querySelector("[data-workroom-avoid]");
  const transferTarget = section.querySelector("[data-workroom-transfer]");
  const mailLink = section.querySelector("[data-workroom-mail]");

  section.hidden = false;
  section.classList.toggle("is-locked", !unlocked);

  if (titleTarget) titleTarget.textContent = copy.title;
  if (noteTarget) noteTarget.textContent = copy.note;
  if (statusTarget) {
    statusTarget.textContent = unlocked ? publicI18n.workroomOpen : publicI18n.workroomAwaiting;
  }

  renderListItems(prepareTarget, copy.prepare);
  renderListItems(avoidTarget, unlocked ? copy.avoid : [publicI18n.workroomLocked, ...copy.avoid]);

  if (transferTarget) transferTarget.textContent = copy.transfer;

  if (mailLink) {
    const subject = publicI18n.workroomMailSubject(record.caseId || "");
    const body = [
      record.caseId ? `Case / dossier: ${record.caseId}` : "",
      record.support ? `Support: ${record.support}` : "",
      "",
      isEnglishDocument
        ? "I am ready for the next guided action. Please confirm the safest path, including remote assistance if appropriate."
        : "Je suis prêt pour la prochaine action guidée. Merci de confirmer le parcours le plus sûr, incluant l'assistance distante si appropriée."
    ].filter(Boolean).join("\n");
    mailLink.href = `mailto:contact@nexuradata.ca?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    mailLink.textContent = isEnglishDocument
      ? (unlocked ? "Request guided or remote assistance" : "Ask what is needed next")
      : (unlocked ? "Demander guidage ou assistance distante" : "Demander la suite requise");
  }
};

const renderStatusRecord = (record, statusPanel) => {
  if (!statusPanel) {
    return;
  }

  statusPanel.hidden = false;
  const caseTarget = statusPanel.querySelector("[data-status-case]");
  const badgeTarget = statusPanel.querySelector("[data-status-badge]");
  const updatedTarget = statusPanel.querySelector("[data-status-updated]");
  const supportTarget = statusPanel.querySelector("[data-status-support]");
  const nextTarget = statusPanel.querySelector("[data-status-next]");
  const summaryTarget = statusPanel.querySelector("[data-status-summary]");
  const timelineTarget = statusPanel.querySelector("[data-status-timeline]");
  const paymentsSection = statusPanel.querySelector("[data-status-payments-section]");
  const paymentsTarget = statusPanel.querySelector("[data-status-payments]");

  if (caseTarget) caseTarget.textContent = record.caseId;
  if (badgeTarget) badgeTarget.textContent = record.status;
  if (updatedTarget) updatedTarget.textContent = formatTimestamp(record.updatedAt);
  if (supportTarget) supportTarget.textContent = record.support;
  if (nextTarget) nextTarget.textContent = record.nextStep;
  if (summaryTarget) summaryTarget.textContent = record.summary;

  renderAuthorizationState(record, statusPanel);
  renderWorkroom(record, statusPanel);

  if (paymentsSection && paymentsTarget) {
    const payments = Array.isArray(record.payments) ? record.payments : [];

    paymentsSection.hidden = payments.length === 0;

    if (payments.length > 0) {
      paymentsTarget.replaceChildren(...payments.map(createStatusPayment));
    } else {
      paymentsTarget.replaceChildren();
    }
  }

  if (timelineTarget) {
    timelineTarget.replaceChildren(...(record.steps || []).map(createStatusStep));
  }
};

const intakeForm = document.querySelector("[data-intake-form]");

if (intakeForm) {
  const statusTarget = intakeForm.querySelector("[data-form-status]");
  const submitButton = intakeForm.querySelector('button[type="submit"]');
  const endpoint = intakeForm.getAttribute("data-intake-endpoint") || "/api/intake";

  intakeForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!intakeForm.checkValidity()) {
      intakeForm.reportValidity();
      setMessage(statusTarget, "error", publicI18n.intakeRequired);
      return;
    }

    const formData = new FormData(intakeForm);
    const payload = {
      nom: `${formData.get("nom") || ""}`.trim(),
      courriel: `${formData.get("courriel") || ""}`.trim(),
      telephone: `${formData.get("telephone") || ""}`.trim(),
      support: `${formData.get("support") || ""}`.trim(),
      urgence: `${formData.get("urgence") || ""}`.trim(),
      profil: `${formData.get("profil") || ""}`.trim(),
      impact: `${formData.get("impact") || ""}`.trim(),
      sensibilite: `${formData.get("sensibilite") || ""}`.trim(),
      message: `${formData.get("message") || ""}`.trim(),
      consentement: formData.get("consentement") === "on",
      website: `${formData.get("website") || ""}`.trim(),
      "cf-turnstile-response": formData.get("cf-turnstile-response") || "",
      source: "public_site",
      page: window.location.pathname,
      intent: "operational_assessment",
      timestamp: new Date().toISOString(),
      status: "new",
      sourcePath: window.location.pathname
    };

    setButtonBusy(submitButton, true, publicI18n.intakeBusy);

    setMessage(statusTarget, "success", publicI18n.intakeOpening);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await parseJsonResponse(response);

      if (response.ok && data?.ok) {
        intakeForm.reset();
        if (trackingConsent?.marketing === true && typeof fbq === "function") {
          fbq("track", "Lead", getMetaEventPayload({ content_name: "intake_form" }));
        }
        setMessage(
          statusTarget,
          "success",
          data?.delivery?.client === "sent"
            ? publicI18n.intakeOpenedSent(data.caseId)
            : publicI18n.intakeOpenedQueued(data.caseId)
        );
        return;
      }

      if (data?.fallback === "mailto" || response.status >= 500) {
        window.location.href = buildIntakeMailto(formData);
        setMessage(
          statusTarget,
          "success",
          publicI18n.intakeFallback
        );
        return;
      }

      setMessage(statusTarget, "error", data?.message || publicI18n.intakeError);
    } catch {
      window.location.href = buildIntakeMailto(formData);
      setMessage(
        statusTarget,
        "success",
        publicI18n.intakeOffline
      );
    } finally {
      setButtonBusy(submitButton, false);
    }
  });
}

const statusForm = document.querySelector("[data-status-form]");

if (statusForm) {
  const messageTarget = statusForm.querySelector("[data-status-form-message]");
  const statusPanel = document.querySelector("[data-status-panel]");
  const authorizationForm = document.querySelector("[data-authorization-form]");
  const authorizationMessage = authorizationForm?.querySelector("[data-authorization-message]");
  const authorizationEndpoint = authorizationForm?.getAttribute("data-authorization-endpoint") || "/api/authorization";
  const authorizationSubmitButton = authorizationForm?.querySelector('button[type="submit"]');
  const endpoint = statusForm.getAttribute("data-status-endpoint") || "/api/status";
  const submitButton = statusForm.querySelector('button[type="submit"]');
  const isLocalPreview = window.location.protocol === "file:" || ["localhost", "127.0.0.1"].includes(window.location.hostname);
  let currentStatusRecord = null;

  const demoCases = {
    "NX-2026-0412|MONTREAL24": {
      caseId: "NX-2026-0412",
      ...publicI18n.demoCaseOne
    },
    "NX-2026-0419|RAIDSECURE": {
      caseId: "NX-2026-0419",
      ...publicI18n.demoCaseTwo
    }
  };

  const caseIdField = statusForm.querySelector('[name="dossier"]');
  const accessCodeField = statusForm.querySelector('[name="code"]');
  const params = new URLSearchParams(window.location.search);
  const presetCaseId = `${params.get("caseId") || ""}`.trim().toUpperCase();

  if (caseIdField && presetCaseId) {
    caseIdField.value = presetCaseId;
  }

  if (accessCodeField && presetCaseId && !accessCodeField.value) {
    accessCodeField.focus();
  }

  if (authorizationForm) {
    authorizationForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!authorizationForm.checkValidity() || !currentStatusCredentials) {
        authorizationForm.reportValidity();
        setMessage(authorizationMessage, "error", publicI18n.authorizationRequired);
        return;
      }

      const formData = new FormData(authorizationForm);
      const signerName = `${formData.get("signerName") || ""}`.trim();
      const consent = formData.get("consent") === "on";

      if (isLocalPreview && currentStatusRecord) {
        const timestamp = new Date().toISOString();
        const updatedRecord = {
          ...currentStatusRecord,
          status: isEnglishDocument ? "Intervention authorized" : "Intervention autorisée",
          updatedAt: timestamp,
          nextStep: isEnglishDocument
            ? "NEXURA prepares the confirmed instructions and treatment sequence."
            : "NEXURA prépare les consignes et la séquence de traitement confirmées.",
          summary: isEnglishDocument
            ? "Authorization has been received. The lab can continue according to the transmitted scope."
            : "Votre autorisation a été reçue. Le laboratoire peut poursuivre selon le cadre transmis.",
          authorization: {
            ...(currentStatusRecord.authorization || {}),
            available: true,
            approved: true,
            quoteStatus: "approved",
            quoteApprovedAt: timestamp
          },
          steps: [
            ...(currentStatusRecord.steps || []).map((step) => ({ ...step, state: step.state === "active" ? "complete" : step.state })),
            {
              title: isEnglishDocument ? "Authorization received" : "Autorisation reçue",
              note: isEnglishDocument ? `Confirmed by ${signerName}.` : `Confirmée par ${signerName}.`,
              state: "active"
            }
          ]
        };

        currentStatusRecord = updatedRecord;
        renderStatusRecord(updatedRecord, statusPanel);
        authorizationForm.reset();
        setMessage(authorizationMessage, "success", publicI18n.authorizationSuccess);
        return;
      }

      setButtonBusy(authorizationSubmitButton, true, publicI18n.authorizationBusy);
      setMessage(authorizationMessage, "success", publicI18n.authorizationSending);

      try {
        const response = await fetch(authorizationEndpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json"
          },
          body: JSON.stringify({
            caseId: currentStatusCredentials.caseId,
            accessCode: currentStatusCredentials.accessCode,
            signerName,
            consent
          })
        });
        const data = await parseJsonResponse(response);

        if (response.ok && data?.ok) {
          currentStatusRecord = data;
          renderStatusRecord(data, statusPanel);
          authorizationForm.reset();
          setMessage(authorizationMessage, "success", publicI18n.authorizationSuccess);
          return;
        }

        setMessage(authorizationMessage, "error", data?.message || publicI18n.authorizationError);
      } catch {
        setMessage(authorizationMessage, "error", publicI18n.authorizationOffline);
      } finally {
        setButtonBusy(authorizationSubmitButton, false);
      }
    });
  }

  statusForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!statusForm.checkValidity()) {
      statusForm.reportValidity();
      setMessage(messageTarget, "error", publicI18n.statusRequired);
      return;
    }

    const formData = new FormData(statusForm);
    const dossier = `${formData.get("dossier") || ""}`.trim().toUpperCase();
    const code = `${formData.get("code") || ""}`.trim().toUpperCase();
    const key = `${dossier}|${code}`;

    if (isLocalPreview) {
      const record = demoCases[key];

      if (!record) {
        if (statusPanel) {
          statusPanel.hidden = true;
        }

        currentStatusCredentials = null;
        currentStatusRecord = null;

        setMessage(
          messageTarget,
          "error",
          publicI18n.statusNotFound
        );
        return;
      }

      currentStatusCredentials = { caseId: dossier, accessCode: code };
      currentStatusRecord = record;
      renderStatusRecord(record, statusPanel);
      setMessage(messageTarget, "success", publicI18n.statusFound);
      return;
    }

    setButtonBusy(submitButton, true, publicI18n.statusBusy);
    setMessage(messageTarget, "success", publicI18n.statusSearching);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json"
        },
        body: JSON.stringify({
          caseId: dossier,
          accessCode: code
        })
      });
      const data = await parseJsonResponse(response);

      if (response.ok && data?.ok) {
        currentStatusCredentials = { caseId: dossier, accessCode: code };
        currentStatusRecord = data;
        renderStatusRecord(data, statusPanel);
        setMessage(messageTarget, "success", publicI18n.statusFound);
        return;
      }

      if (statusPanel) {
        statusPanel.hidden = true;
      }

      currentStatusCredentials = null;
      currentStatusRecord = null;

      setMessage(
        messageTarget,
        "error",
        data?.message || publicI18n.statusNotFound
      );
    } catch {
      if (statusPanel) {
        statusPanel.hidden = true;
      }

      currentStatusCredentials = null;
      currentStatusRecord = null;

      setMessage(messageTarget, "error", publicI18n.statusOffline);
    } finally {
      setButtonBusy(submitButton, false);
    }
  });
}

const operationsRoot = document.querySelector("[data-ops-app]");

if (operationsRoot) {
  const searchForm = document.querySelector("[data-ops-search-form]");
  const searchStatus = document.querySelector("[data-ops-search-status]");
  const resultsTarget = document.querySelector("[data-ops-results]");
  const casePanel = document.querySelector("[data-ops-case-panel]");
  const caseForm = document.querySelector("[data-ops-case-form]");
  const caseStatus = document.querySelector("[data-ops-case-status]");
  const searchEndpoint = operationsRoot.getAttribute("data-ops-endpoint") || "/api/ops/cases";
  const detailTitle = operationsRoot.querySelector("[data-ops-case-title]");
  const metaCreated = operationsRoot.querySelector("[data-ops-meta-created]");
  const metaUpdated = operationsRoot.querySelector("[data-ops-meta-updated]");
  const metaClient = operationsRoot.querySelector("[data-ops-meta-client]");
  const metaEmail = operationsRoot.querySelector("[data-ops-meta-email]");
  const metaSupport = operationsRoot.querySelector("[data-ops-meta-support]");
  const metaUrgency = operationsRoot.querySelector("[data-ops-meta-urgency]");
  const metaSource = operationsRoot.querySelector("[data-ops-meta-source]");
  const metaAccessSent = operationsRoot.querySelector("[data-ops-meta-access-sent]");
  const metaStatusSent = operationsRoot.querySelector("[data-ops-meta-status-sent]");
  const messageTarget = operationsRoot.querySelector("[data-ops-message]");
  const stepsTarget = operationsRoot.querySelector("[data-ops-steps]");
  const historyTarget = operationsRoot.querySelector("[data-ops-history]");
  const accessResult = operationsRoot.querySelector("[data-ops-access-result]");
  const paymentForm = operationsRoot.querySelector("[data-ops-payment-form]");
  const paymentStatus = operationsRoot.querySelector("[data-ops-payment-status]");
  const paymentsTarget = operationsRoot.querySelector("[data-ops-payments]");
  const addStepButton = operationsRoot.querySelector("[data-ops-add-step]");
  const sendUpdateButton = operationsRoot.querySelector("[data-ops-send-update]");
  const sendAccessButton = operationsRoot.querySelector("[data-ops-send-access]");
  const regenerateButton = operationsRoot.querySelector("[data-ops-regenerate-access]");
  const currentCaseIdInput = operationsRoot.querySelector("[data-ops-current-case-id]");
  const searchSubmitButton = searchForm?.querySelector('button[type="submit"]');
  const caseSubmitButton = caseForm?.querySelector('button[type="submit"]');
  const paymentSubmitButton = paymentForm?.querySelector('button[type="submit"]');
  const metaAcquisition = operationsRoot.querySelector("[data-ops-meta-acquisition]");
  const quoteStatusDisplay = operationsRoot.querySelector("[data-ops-quote-status]");
  const quoteAmountDisplay = operationsRoot.querySelector("[data-ops-quote-amount]");
  const quotePreapprovalDisplay = operationsRoot.querySelector("[data-ops-quote-preapproval]");
  const quoteSentAtDisplay = operationsRoot.querySelector("[data-ops-quote-sent-at]");
  const quoteApprovedAtDisplay = operationsRoot.querySelector("[data-ops-quote-approved-at]");
  const quoteResult = operationsRoot.querySelector("[data-ops-quote-result]");
  const quoteSendButton = operationsRoot.querySelector("[data-ops-quote-send]");
  const quoteApproveButton = operationsRoot.querySelector("[data-ops-quote-approve]");
  const quoteExpireButton = operationsRoot.querySelector("[data-ops-quote-expire]");
  const quoteDeclineButton = operationsRoot.querySelector("[data-ops-quote-decline]");
  const reminderTypeSelect = operationsRoot.querySelector("[data-ops-reminder-type]");
  const reminderMessageInput = operationsRoot.querySelector("[data-ops-reminder-message]");
  const logReminderButton = operationsRoot.querySelector("[data-ops-log-reminder]");
  const reminderResult = operationsRoot.querySelector("[data-ops-reminder-result]");

  const createStepRow = (step = { title: "", note: "", state: "pending" }) => {
    const wrapper = document.createElement("div");
    wrapper.className = "ops-step-row";
    wrapper.dataset.opsStepRow = "true";
    const titleField = document.createElement("label");
    titleField.className = "field";

    const titleLabel = document.createElement("span");
    titleLabel.textContent = "Titre";

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.required = true;
    titleInput.dataset.opsStepTitle = "true";
    titleInput.value = step.title || "";

    titleField.append(titleLabel, titleInput);

    const stateField = document.createElement("label");
    stateField.className = "field";

    const stateLabel = document.createElement("span");
    stateLabel.textContent = "État";

    const stateSelect = document.createElement("select");
    stateSelect.dataset.opsStepState = "true";

    [
      ["pending", "En attente"],
      ["active", "Actif"],
      ["complete", "Complété"]
    ].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      stateSelect.append(option);
    });

    stateSelect.value = step.state || "pending";
    stateField.append(stateLabel, stateSelect);

    const noteField = document.createElement("label");
    noteField.className = "field field-full";

    const noteLabel = document.createElement("span");
    noteLabel.textContent = "Note";

    const noteInput = document.createElement("textarea");
    noteInput.rows = 3;
    noteInput.required = true;
    noteInput.dataset.opsStepNote = "true";
    noteInput.value = step.note || "";

    noteField.append(noteLabel, noteInput);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "button button-secondary button-small";
    removeButton.dataset.opsRemoveStep = "true";
    removeButton.textContent = "Retirer l'étape";
    removeButton.addEventListener("click", () => {
      wrapper.remove();
    });

    wrapper.append(titleField, stateField, noteField, removeButton);

    return wrapper;
  };

  const collectSteps = () =>
    Array.from(stepsTarget?.querySelectorAll("[data-ops-step-row]") || []).map((row) => ({
      title: row.querySelector("[data-ops-step-title]")?.value.trim() || "",
      state: row.querySelector("[data-ops-step-state]")?.value || "pending",
      note: row.querySelector("[data-ops-step-note]")?.value.trim() || ""
    }));

  const quoteStatusLabels = {
    none: "Aucune",
    draft: "Brouillon",
    sent: "Envoyée",
    approved: "Approuvée",
    expired: "Expirée",
    declined: "Refusée"
  };

  const renderHistory = (history) => {
    if (!historyTarget) {
      return;
    }

    if (!history || history.length === 0) {
      historyTarget.innerHTML = "<p class=\"form-note\">Aucun événement enregistré pour ce dossier.</p>";
      return;
    }

    historyTarget.replaceChildren(
      ...history.map((entry) => {
        const article = document.createElement("article");
        article.className = "ops-history-entry";

        const title = document.createElement("p");
        title.className = "ops-history-title";
        title.textContent = entry.title;

        const meta = document.createElement("p");
        meta.className = "ops-history-meta";
        meta.textContent = `${formatTimestamp(entry.createdAt)} · ${entry.createdBy} · ${entry.kind}`;

        const note = document.createElement("p");
        note.className = "ops-history-note";
        note.textContent = entry.note;

        article.append(title, meta, note);
        return article;
      })
    );
  };

  const renderPayments = (payments) => {
    if (!paymentsTarget) {
      return;
    }

    if (!payments || payments.length === 0) {
      paymentsTarget.innerHTML = "<p class=\"form-note\">Aucune demande de paiement pour ce dossier.</p>";
      return;
    }

    paymentsTarget.replaceChildren(
      ...payments.map((payment) => {
        const article = document.createElement("article");
        article.className = "ops-payment-entry";

        const head = document.createElement("div");
        head.className = "ops-payment-head";

        const title = document.createElement("p");
        title.className = "ops-payment-title";
        title.textContent = payment.label;

        const badge = document.createElement("span");
        badge.className = `ops-payment-badge is-${payment.status || "open"}`;
        badge.textContent =
          payment.status === "paid"
            ? "Payé"
            : payment.status === "expired"
              ? "Expiré"
              : payment.status === "failed"
                ? "Échec"
                : "Ouvert";

        head.append(title, badge);

        const meta = document.createElement("p");
        meta.className = "ops-payment-meta";
        meta.textContent = `${payment.amountFormatted || formatCurrency(payment.amountCents, payment.currency)} · ${payment.paymentKind} · créé ${formatTimestamp(payment.createdAt)}`;

        const note = document.createElement("p");
        note.className = "ops-payment-note";
        note.textContent = payment.description;

        const actions = document.createElement("div");
        actions.className = "ops-payment-actions";

        if (payment.checkoutUrl) {
          const link = document.createElement("a");
          link.className = "button button-secondary button-small";
          link.href = payment.checkoutUrl;
          link.target = "_blank";
          link.rel = "noreferrer";
          link.textContent = "Ouvrir le lien Stripe";
          actions.append(link);
        }

        const details = document.createElement("p");
        details.className = "ops-payment-meta";
        details.textContent =
          payment.paidAt
            ? `Confirmé ${formatTimestamp(payment.paidAt)}`
            : payment.sentAt
              ? `Lien envoyé ${formatTimestamp(payment.sentAt)}`
              : `Lien non envoyé automatiquement`;

        article.append(head, meta, note, actions, details);
        return article;
      })
    );
  };

  const fillCaseDetail = (record) => {
    if (casePanel) {
      casePanel.hidden = false;
    }

    if (detailTitle) detailTitle.textContent = record.caseId;
    if (metaCreated) metaCreated.textContent = formatTimestamp(record.createdAt);
    if (metaUpdated) metaUpdated.textContent = formatTimestamp(record.updatedAt);
    if (metaClient) metaClient.textContent = record.name;
    if (metaEmail) metaEmail.textContent = record.email;
    if (metaSupport) metaSupport.textContent = record.support;
    if (metaUrgency) metaUrgency.textContent = record.urgency;
    if (metaSource) metaSource.textContent = record.sourcePath || "/";
    if (metaAcquisition) metaAcquisition.textContent = record.acquisitionSource || "—";
    if (metaAccessSent) metaAccessSent.textContent = record.accessCodeLastSentAt ? formatTimestamp(record.accessCodeLastSentAt) : "Pas encore";
    if (metaStatusSent) metaStatusSent.textContent = record.statusEmailLastSentAt ? formatTimestamp(record.statusEmailLastSentAt) : "Pas encore";
    if (messageTarget) messageTarget.textContent = record.message;
    if (currentCaseIdInput) currentCaseIdInput.value = record.caseId;

    if (caseForm) {
      const statusInput = caseForm.querySelector('[name="status"]');
      const nextStepInput = caseForm.querySelector('[name="nextStep"]');
      const summaryInput = caseForm.querySelector('[name="clientSummary"]');
      const notifyInput = caseForm.querySelector('[name="notifyClient"]');
      const qualInput = caseForm.querySelector('[name="qualificationSummary"]');
      const notesInput = caseForm.querySelector('[name="internalNotes"]');
      const flagsInput = caseForm.querySelector('[name="handlingFlags"]');
      const acqInput = caseForm.querySelector('[name="acquisitionSource"]');
      const quoteAmtInput = caseForm.querySelector('[name="quoteAmount"]');
      const preapprovalInput = caseForm.querySelector('[name="preapprovalConfirmed"]');

      if (statusInput) statusInput.value = record.status;
      if (nextStepInput) nextStepInput.value = record.nextStep;
      if (summaryInput) summaryInput.value = record.clientSummary;
      if (notifyInput) notifyInput.checked = false;
      if (qualInput) qualInput.value = record.qualificationSummary || "";
      if (notesInput) notesInput.value = record.internalNotes || "";
      if (flagsInput) flagsInput.value = record.handlingFlags || "";
      if (acqInput) acqInput.value = record.acquisitionSource || "";
      if (quoteAmtInput) quoteAmtInput.value = record.quoteAmountCents ? (record.quoteAmountCents / 100).toFixed(2) : "";
      if (preapprovalInput) preapprovalInput.checked = Boolean(record.preapprovalConfirmed);
    }

    if (quoteStatusDisplay) quoteStatusDisplay.textContent = quoteStatusLabels[record.quoteStatus] || record.quoteStatus || "Aucune";
    if (quoteAmountDisplay) quoteAmountDisplay.textContent = record.quoteAmountCents ? formatCurrency(record.quoteAmountCents, "cad") : "—";
    if (quotePreapprovalDisplay) quotePreapprovalDisplay.textContent = record.preapprovalConfirmed ? "Oui" : "Non";
    if (quoteSentAtDisplay) quoteSentAtDisplay.textContent = record.quoteSentAt ? formatTimestamp(record.quoteSentAt) : "—";
    if (quoteApprovedAtDisplay) quoteApprovedAtDisplay.textContent = record.quoteApprovedAt ? formatTimestamp(record.quoteApprovedAt) : "—";

    if (stepsTarget) {
      stepsTarget.replaceChildren(...(record.steps || []).map(createStepRow));
    }

    renderPayments(record.payments || []);

    if (accessResult) {
      accessResult.textContent = "";
      accessResult.dataset.state = "";
    }

    if (paymentStatus) {
      paymentStatus.textContent = "";
      paymentStatus.dataset.state = "";
    }

    if (quoteResult) {
      quoteResult.textContent = "";
      quoteResult.dataset.state = "";
    }

    if (reminderResult) {
      reminderResult.textContent = "";
      reminderResult.dataset.state = "";
    }

    renderHistory(record.history || []);
    setMessage(caseStatus, "success", "Dossier chargé.");
  };

  const loadCaseDetail = async (caseId) => {
    setMessage(searchStatus, "success", "Chargement du dossier...");

    const response = await fetch(`${searchEndpoint}?caseId=${encodeURIComponent(caseId)}`, {
      headers: {
        accept: "application/json"
      }
    });
    const data = await parseJsonResponse(response);

    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || "Impossible de charger ce dossier.");
    }

    fillCaseDetail(data.case);
    setMessage(searchStatus, "success", "Dossier chargé.");
  };

  const renderSearchResults = (items) => {
    if (!resultsTarget) {
      return;
    }

    if (!items || items.length === 0) {
      resultsTarget.innerHTML = "<p class=\"form-note\">Aucun dossier correspondant.</p>";
      return;
    }

    resultsTarget.replaceChildren(
      ...items.map((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ops-result";

        const caseLabel = document.createElement("strong");
        caseLabel.textContent = item.case_id;

        const clientLabel = document.createElement("span");
        clientLabel.textContent = item.name;

        const supportLabel = document.createElement("span");
        supportLabel.textContent = `${item.support} · ${item.status}${item.quote_status && item.quote_status !== "none" ? ` · Soum: ${quoteStatusLabels[item.quote_status] || item.quote_status}` : ""}`;

        const nextLabel = document.createElement("span");
        nextLabel.className = "ops-result-next";
        nextLabel.textContent = item.next_step || "";

        const emailLabel = document.createElement("span");
        emailLabel.textContent = item.email;

        const updatedLabel = document.createElement("time");
        updatedLabel.dateTime = item.updated_at || "";
        updatedLabel.textContent = `Mis à jour ${formatTimestamp(item.updated_at)}`;

        button.append(caseLabel, clientLabel, supportLabel, nextLabel, emailLabel, updatedLabel);
        button.addEventListener("click", () => {
          loadCaseDetail(item.case_id).catch((error) => {
            setMessage(searchStatus, "error", error.message);
          });
        });
        return button;
      })
    );
  };

  if (searchForm) {
    searchForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const query = searchForm.querySelector('[name="query"]')?.value.trim() || "";
      const filterStatus = searchForm.querySelector('[name="filterStatus"]')?.value || "";
      const filterQuoteStatus = searchForm.querySelector('[name="filterQuoteStatus"]')?.value || "";
      const filterUrgency = searchForm.querySelector('[name="filterUrgency"]')?.value || "";
      setButtonBusy(searchSubmitButton, true, "Recherche...");
      setMessage(searchStatus, "success", "Recherche en cours...");

      try {
        const params = new URLSearchParams();
        if (query) params.set("query", query);
        if (filterStatus) params.set("status", filterStatus);
        if (filterQuoteStatus) params.set("quoteStatus", filterQuoteStatus);
        if (filterUrgency) params.set("urgency", filterUrgency);

        const response = await fetch(`${searchEndpoint}?${params.toString()}`, {
          headers: {
            accept: "application/json"
          }
        });
        const data = await parseJsonResponse(response);

        if (!response.ok || !data?.ok) {
          throw new Error(data?.message || "Recherche impossible.");
        }

        renderSearchResults(data.items || []);
        setMessage(searchStatus, "success", `${(data.items || []).length} dossier(s) chargé(s).`);
      } catch (error) {
        setMessage(searchStatus, "error", error instanceof Error ? error.message : "Recherche impossible.");
      } finally {
        setButtonBusy(searchSubmitButton, false);
      }
    });
  }

  if (addStepButton) {
    addStepButton.addEventListener("click", () => {
      if (stepsTarget) {
        stepsTarget.append(createStepRow());
      }
    });
  }

  if (caseForm) {
    caseForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const caseId = currentCaseIdInput?.value || "";

      if (!caseId) {
        setMessage(caseStatus, "error", "Chargez d'abord un dossier.");
        return;
      }

      setMessage(caseStatus, "success", "Enregistrement en cours...");
      setButtonBusy(caseSubmitButton, true, "Enregistrement...");

      try {
        const response = await fetch(searchEndpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json"
          },
          body: JSON.stringify({
            action: "update",
            caseId,
            status: caseForm.querySelector('[name="status"]')?.value.trim() || "",
            nextStep: caseForm.querySelector('[name="nextStep"]')?.value.trim() || "",
            clientSummary: caseForm.querySelector('[name="clientSummary"]')?.value.trim() || "",
            qualificationSummary: caseForm.querySelector('[name="qualificationSummary"]')?.value.trim() || "",
            internalNotes: caseForm.querySelector('[name="internalNotes"]')?.value.trim() || "",
            handlingFlags: caseForm.querySelector('[name="handlingFlags"]')?.value.trim() || "",
            acquisitionSource: caseForm.querySelector('[name="acquisitionSource"]')?.value.trim() || "",
            quoteAmount: caseForm.querySelector('[name="quoteAmount"]')?.value.trim() || "",
            preapprovalConfirmed: Boolean(caseForm.querySelector('[name="preapprovalConfirmed"]')?.checked),
            notifyClient: Boolean(caseForm.querySelector('[name="notifyClient"]')?.checked),
            steps: collectSteps()
          })
        });
        const data = await parseJsonResponse(response);

        if (!response.ok || !data?.ok) {
          throw new Error(data?.message || "La mise à jour a échoué.");
        }

        fillCaseDetail(data.case);
        setMessage(caseStatus, "success", data.delivery === "sent" ? "Dossier enregistré et client notifié." : "Dossier enregistré.");
      } catch (error) {
        setMessage(caseStatus, "error", error instanceof Error ? error.message : "La mise à jour a échoué.");
      } finally {
        setButtonBusy(caseSubmitButton, false);
      }
    });
  }

  if (sendUpdateButton) {
    sendUpdateButton.addEventListener("click", async () => {
      const caseId = currentCaseIdInput?.value || "";

      if (!caseId) {
        setMessage(caseStatus, "error", "Chargez d'abord un dossier.");
        return;
      }

      setMessage(caseStatus, "success", "Envoi de la mise à jour client...");
      setButtonBusy(sendUpdateButton, true, "Envoi...");

      try {
        const response = await fetch(searchEndpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json"
          },
          body: JSON.stringify({
            action: "send-update",
            caseId
          })
        });
        const data = await parseJsonResponse(response);

        if (!response.ok || !data?.ok) {
          throw new Error(data?.message || "L'envoi a échoué.");
        }

        fillCaseDetail(data.case);
        setMessage(caseStatus, "success", data.delivery === "sent" ? "Mise à jour envoyée au client." : `Envoi non effectué: ${data.delivery}`);
      } catch (error) {
        setMessage(caseStatus, "error", error instanceof Error ? error.message : "L'envoi a échoué.");
      } finally {
        setButtonBusy(sendUpdateButton, false);
      }
    });
  }

  if (sendAccessButton) {
    sendAccessButton.addEventListener("click", async () => {
      const caseId = currentCaseIdInput?.value || "";

      if (!caseId) {
        setMessage(caseStatus, "error", "Chargez d'abord un dossier.");
        return;
      }

      if (accessResult) {
        accessResult.textContent = "Renvoi du code en cours...";
        accessResult.dataset.state = "success";
      }
      setButtonBusy(sendAccessButton, true, "Renvoi...");

      try {
        const response = await fetch(searchEndpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json"
          },
          body: JSON.stringify({
            action: "send-access",
            caseId
          })
        });
        const data = await parseJsonResponse(response);

        if (!response.ok || !data?.ok) {
          throw new Error(data?.message || "Le renvoi du code a échoué.");
        }

        await loadCaseDetail(caseId);

        if (accessResult) {
          accessResult.textContent = data.delivery === "sent" ? "Code d'accès renvoyé au client." : `Envoi non effectué: ${data.delivery}`;
          accessResult.dataset.state = data.delivery === "sent" ? "success" : "error";
        }
      } catch (error) {
        if (accessResult) {
          accessResult.textContent = error instanceof Error ? error.message : "Le renvoi du code a échoué.";
          accessResult.dataset.state = "error";
        }
      } finally {
        setButtonBusy(sendAccessButton, false);
      }
    });
  }

  if (regenerateButton) {
    regenerateButton.addEventListener("click", async () => {
      const caseId = currentCaseIdInput?.value || "";

      if (!caseId) {
        setMessage(caseStatus, "error", "Chargez d'abord un dossier.");
        return;
      }

      if (accessResult) {
        accessResult.textContent = "Génération d'un nouveau code...";
        accessResult.dataset.state = "success";
      }
      setButtonBusy(regenerateButton, true, "Génération...");

      try {
        const response = await fetch(searchEndpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json"
          },
          body: JSON.stringify({
            action: "regenerate-access",
            caseId
          })
        });
        const data = await parseJsonResponse(response);

        if (!response.ok || !data?.ok) {
          throw new Error(data?.message || "La régénération du code a échoué.");
        }

        await loadCaseDetail(caseId);

        if (accessResult) {
          accessResult.textContent =
            data.delivery === "sent"
              ? `Nouveau code généré et envoyé: ${data.accessCode}`
              : `Nouveau code généré: ${data.accessCode}. Envoi non effectué (${data.delivery}).`;
          accessResult.dataset.state = data.delivery === "sent" ? "success" : "error";
        }
      } catch (error) {
        if (accessResult) {
          accessResult.textContent = error instanceof Error ? error.message : "La régénération du code a échoué.";
          accessResult.dataset.state = "error";
        }
      } finally {
        setButtonBusy(regenerateButton, false);
      }
    });
  }

  const quoteActionHandler = (button, action, label) => {
    if (!button) return;
    button.addEventListener("click", async () => {
      const caseId = currentCaseIdInput?.value || "";
      if (!caseId) {
        setMessage(quoteResult, "error", "Chargez d'abord un dossier.");
        return;
      }

      setMessage(quoteResult, "success", `${label}...`);
      setButtonBusy(button, true, label + "...");

      try {
        const body = { action, caseId };
        if (action === "quote-send") {
          const amt = caseForm?.querySelector('[name="quoteAmount"]')?.value.trim() || "";
          if (amt) body.quoteAmount = amt;
        }

        const response = await fetch(searchEndpoint, {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify(body)
        });
        const data = await parseJsonResponse(response);

        if (!response.ok || !data?.ok) {
          throw new Error(data?.message || "L'action a échoué.");
        }

        fillCaseDetail(data.case);
        setMessage(quoteResult, "success", `${label} effectuée.`);
      } catch (error) {
        setMessage(quoteResult, "error", error instanceof Error ? error.message : "L'action a échoué.");
      } finally {
        setButtonBusy(button, false);
      }
    });
  };

  quoteActionHandler(quoteSendButton, "quote-send", "Envoi de la soumission");
  quoteActionHandler(quoteApproveButton, "quote-approve", "Approbation");
  quoteActionHandler(quoteExpireButton, "quote-expire", "Expiration");
  quoteActionHandler(quoteDeclineButton, "quote-decline", "Refus");

  if (logReminderButton) {
    logReminderButton.addEventListener("click", async () => {
      const caseId = currentCaseIdInput?.value || "";
      if (!caseId) {
        setMessage(reminderResult, "error", "Chargez d'abord un dossier.");
        return;
      }

      const reminderType = reminderTypeSelect?.value || "general_follow_up";
      const message = reminderMessageInput?.value.trim() || "";

      setMessage(reminderResult, "success", "Enregistrement de la relance...");
      setButtonBusy(logReminderButton, true, "Enregistrement...");

      try {
        const response = await fetch(searchEndpoint, {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({ action: "log-reminder", caseId, reminderType, message })
        });
        const data = await parseJsonResponse(response);

        if (!response.ok || !data?.ok) {
          throw new Error(data?.message || "Relance non enregistrée.");
        }

        fillCaseDetail(data.case);
        if (reminderMessageInput) reminderMessageInput.value = "";
        setMessage(reminderResult, "success", "Relance enregistrée.");
      } catch (error) {
        setMessage(reminderResult, "error", error instanceof Error ? error.message : "Relance non enregistrée.");
      } finally {
        setButtonBusy(logReminderButton, false);
      }
    });
  }

  if (paymentForm) {
    paymentForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const caseId = currentCaseIdInput?.value || "";

      if (!caseId) {
        setMessage(paymentStatus, "error", "Chargez d'abord un dossier.");
        return;
      }

      if (!paymentForm.checkValidity()) {
        paymentForm.reportValidity();
        setMessage(paymentStatus, "error", "Complétez les champs de paiement.");
        return;
      }

      setMessage(paymentStatus, "success", "Création du lien de paiement...");
      setButtonBusy(paymentSubmitButton, true, "Création...");

      try {
        const response = await fetch(searchEndpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json"
          },
          body: JSON.stringify({
            action: "create-payment",
            caseId,
            paymentKind: paymentForm.querySelector('[name="paymentKind"]')?.value || "custom",
            amount: paymentForm.querySelector('[name="amount"]')?.value.trim() || "",
            label: paymentForm.querySelector('[name="label"]')?.value.trim() || "",
            description: paymentForm.querySelector('[name="description"]')?.value.trim() || "",
            sendEmail: Boolean(paymentForm.querySelector('[name="sendEmail"]')?.checked)
          })
        });
        const data = await parseJsonResponse(response);

        if (!response.ok || !data?.ok) {
          throw new Error(data?.message || "Impossible de créer la demande de paiement.");
        }

        if (data.case) {
          fillCaseDetail(data.case);
        }

        setMessage(
          paymentStatus,
          data.delivery === "sent" ? "success" : "error",
          data.delivery === "sent"
            ? "Demande de paiement créée et envoyée au client."
            : `Demande créée. Envoi automatique non effectué: ${data.delivery}.`
        );
      } catch (error) {
        setMessage(paymentStatus, "error", error instanceof Error ? error.message : "Impossible de créer la demande de paiement.");
      } finally {
        setButtonBusy(paymentSubmitButton, false);
      }
    });
  }

  if (searchForm) {
    searchForm.requestSubmit();
  }
}

/* ── Ops filtered view pages (quotes, payments, follow-up) ── */

const opsViewRoot = document.querySelector("[data-ops-view]");

if (opsViewRoot) {
  const viewName = opsViewRoot.getAttribute("data-ops-view");
  const viewEndpoint = opsViewRoot.getAttribute("data-ops-endpoint") || "/api/ops/cases";
  const viewFilters = document.querySelector("[data-ops-view-filters]");
  const viewStatus = document.querySelector("[data-ops-view-status]");
  const viewTbody = document.querySelector("[data-ops-view-tbody]");
  const viewSubmitButton = viewFilters?.querySelector('button[type="submit"]');

  const quoteStatusLabelsView = {
    none: "Aucune",
    draft: "Brouillon",
    sent: "Envoyée",
    approved: "Approuvée",
    expired: "Expirée",
    declined: "Refusée"
  };

  const paymentStatusLabelsView = {
    open: "Ouvert",
    paid: "Payé",
    expired: "Expiré",
    failed: "Échoué",
    cancelled: "Annulé"
  };

  const paymentKindLabelsView = {
    deposit: "Acompte",
    final: "Solde final",
    custom: "Ponctuel"
  };

  const caseLink = (caseId) => {
    if (!caseId) return "index.html";
    return `index.html?caseId=${encodeURIComponent(caseId)}`;
  };

  const renderQuotesTable = (items) => {
    if (!viewTbody) return;

    if (!items || items.length === 0) {
      viewTbody.innerHTML = '<tr><td colspan="9" class="ops-view-empty">Aucun travail demandé ou approuvé.</td></tr>';
      return;
    }

    viewTbody.replaceChildren(
      ...items.map((item) => {
        const tr = document.createElement("tr");
        tr.className = "ops-view-row";
        const reminderLabel = item.reminderDue === "urgente"
          ? '<span class="ops-view-badge is-reminder-urgent">Urgente</span>'
          : item.reminderDue === "suggérée"
            ? '<span class="ops-view-badge is-reminder-suggested">Suggérée</span>'
            : '—';
        tr.innerHTML = `
          <td><a href="${caseLink(item.caseId)}" class="ops-view-link">${escapeHtml(item.caseId)}</a></td>
          <td>${escapeHtml(item.clientName)}</td>
          <td>${item.quoteAmountFormatted || "—"}</td>
          <td><span class="ops-view-badge is-quote-${item.quoteStatus}">${quoteStatusLabelsView[item.quoteStatus] || item.quoteStatus}</span></td>
          <td>${escapeHtml(item.caseStatus)}</td>
          <td class="ops-view-muted">${item.quoteSentAt ? formatTimestamp(item.quoteSentAt) : "—"}</td>
          <td>${reminderLabel}</td>
          <td class="ops-view-muted">${escapeHtml(item.nextStep || "")}</td>
        `;
        tr.insertAdjacentHTML("beforeend", `<td><a href="${caseLink(item.caseId)}" class="button button-secondary button-small">Ouvrir</a></td>`);
        return tr;
      })
    );
  };

  const renderPaymentsTable = (items) => {
    if (!viewTbody) return;

    if (!items || items.length === 0) {
      viewTbody.innerHTML = '<tr><td colspan="9" class="ops-view-empty">Aucun paiement correspondant.</td></tr>';
      return;
    }

    viewTbody.replaceChildren(
      ...items.map((item) => {
        const tr = document.createElement("tr");
        tr.className = "ops-view-row";
        tr.innerHTML = `
          <td><a href="${caseLink(item.caseId)}" class="ops-view-link">${escapeHtml(item.caseId)}</a></td>
          <td>${escapeHtml(item.clientName || "")}</td>
          <td class="ops-view-mono">${escapeHtml(item.paymentRequestId)}</td>
          <td>${paymentKindLabelsView[item.paymentKind] || item.paymentKind}</td>
          <td>${item.amountFormatted || "—"}</td>
          <td><span class="ops-view-badge is-payment-${item.status}">${paymentStatusLabelsView[item.status] || item.status}</span></td>
          <td class="ops-view-muted">${formatTimestamp(item.createdAt)}</td>
          <td class="ops-view-muted">${item.expiresAt ? formatTimestamp(item.expiresAt) : "—"}</td>
          <td class="ops-view-muted">${item.paidAt ? formatTimestamp(item.paidAt) : "—"}</td>
        `;
        return tr;
      })
    );
  };

  const renderFollowUpTable = (items) => {
    if (!viewTbody) return;

    if (!items || items.length === 0) {
      viewTbody.innerHTML = '<tr><td colspan="9" class="ops-view-empty">Aucun dossier à relancer.</td></tr>';
      return;
    }

    viewTbody.replaceChildren(
      ...items.map((item) => {
        const tr = document.createElement("tr");
        tr.className = "ops-view-row";
        const paymentLabel = item.latestPaymentStatus && item.latestPaymentStatus !== "none"
          ? `<span class="ops-view-badge is-payment-${item.latestPaymentStatus}">${paymentStatusLabelsView[item.latestPaymentStatus] || item.latestPaymentStatus}</span>`
          : "—";
        tr.innerHTML = `
          <td><a href="${caseLink(item.caseId)}" class="ops-view-link">${escapeHtml(item.caseId)}</a></td>
          <td>${escapeHtml(item.clientName)}</td>
          <td>${escapeHtml(item.status)}</td>
          <td><span class="ops-view-badge is-quote-${item.quoteStatus}">${quoteStatusLabelsView[item.quoteStatus] || item.quoteStatus || "—"}</span></td>
          <td>${paymentLabel}</td>
          <td class="ops-view-muted">${item.lastClientContactAt ? formatTimestamp(item.lastClientContactAt) : "Aucun"}</td>
          <td class="ops-view-muted">${item.lastReminderSentAt ? formatTimestamp(item.lastReminderSentAt) : "—"}</td>
          <td class="ops-view-muted">${escapeHtml(item.nextStep || "")}</td>
        `;
        return tr;
      })
    );
  };

  const viewRenderers = {
    quotes: renderQuotesTable,
    payments: renderPaymentsTable,
    "follow-up": renderFollowUpTable
  };

  const loadView = async () => {
    if (!viewFilters) return;

    const params = new URLSearchParams();
    const formData = new FormData(viewFilters);

    for (const [key, value] of formData.entries()) {
      const trimmed = `${value}`.trim();
      if (trimmed) params.set(key, trimmed);
    }

    setMessage(viewStatus, "success", "Chargement...");
    if (viewSubmitButton) setButtonBusy(viewSubmitButton, true, "Chargement...");

    try {
      const response = await fetch(`${viewEndpoint}?${params.toString()}`, {
        headers: { accept: "application/json" }
      });
      const data = await parseJsonResponse(response);

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Impossible de charger les données.");
      }

      const renderer = viewRenderers[viewName];
      if (renderer) renderer(data.items || []);

      setMessage(viewStatus, "success", `${(data.items || []).length} résultat(s).`);
    } catch (error) {
      setMessage(viewStatus, "error", error instanceof Error ? error.message : "Erreur de chargement.");
    } finally {
      if (viewSubmitButton) setButtonBusy(viewSubmitButton, false);
    }
  };

  if (viewFilters) {
    viewFilters.addEventListener("submit", (event) => {
      event.preventDefault();
      loadView();
    });

    loadView();
  }
}

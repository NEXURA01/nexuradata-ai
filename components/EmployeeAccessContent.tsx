"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { EmployeRole } from "@/lib/employe-role";

const employeeLinks = [
  { href: "/operations/", labelFr: "Cas clients", labelEn: "Client cases", detailFr: "Voir la demande, qualifier la priorité, préparer la réponse.", detailEn: "Review the request, qualify priority, and prepare the response.", adminOnly: false },
  { href: "/operations/payments.html", labelFr: "Paiements", labelEn: "Payments", detailFr: "Créer ou suivre un lien Stripe pour le dossier.", detailEn: "Create or track a Stripe link attached to the client case.", adminOnly: true },
  { href: "/operations/quotes.html", labelFr: "Soumissions", labelEn: "Quotes", detailFr: "Vérifier les travaux demandés, approuvés ou relancés.", detailEn: "Review requested, approved, or follow-up work.", adminOnly: false },
  { href: "/operations/follow-up.html", labelFr: "Relances", labelEn: "Follow-ups", detailFr: "Reprendre les dossiers en attente de prochaine action.", detailEn: "Resume cases waiting for the next action.", adminOnly: false },
];

const flowSteps = [
  { labelFr: "Recevoir", labelEn: "Receive" },
  { labelFr: "Qualifier", labelEn: "Qualify" },
  { labelFr: "Répondre", labelEn: "Respond" },
  { labelFr: "Suivre", labelEn: "Track" },
];

const automationSteps = [
  { number: "01", titleFr: "Recevoir", titleEn: "Receive", detailFr: "La demande arrive dans le suivi.", detailEn: "The request enters employee tracking." },
  { number: "02", titleFr: "Qualifier", titleEn: "Qualify", detailFr: "L'équipe confirme priorité et action.", detailEn: "The team confirms priority and next action." },
  { number: "03", titleFr: "Répondre", titleEn: "Respond", detailFr: "Le client reçoit la réponse du dossier.", detailEn: "The client receives a clear case-based response." },
  { number: "04", titleFr: "Facturer", titleEn: "Invoice", detailFr: "Lien Stripe reste attaché au dossier.", detailEn: "When needed, the Stripe link stays attached to the right client." },
];

type EmployeeAccessContentProps = {
  role: EmployeRole;
};

export function EmployeeAccessContent({ role }: EmployeeAccessContentProps) {
  const locale = useLocale();
  const isFr = locale === "fr";
  const router = useRouter();
  const isAdmin = role === "admin";
  const visibleLinks = employeeLinks.filter((item) => !item.adminOnly || isAdmin);

  async function handleLogout() {
    const response = await fetch("/api/employe/logout", { method: "POST" });
    if (!response.ok) {
      return;
    }
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[var(--noir)] px-6 pb-24 pt-36 text-[var(--os)] md:px-8">
      <div className="mx-auto max-w-[1180px]">
        <section className="relative overflow-hidden border border-accent/20 bg-surface p-8 md:p-12">
          <p className="mb-5 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">EMPLOYE</p>
          <p className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
            {isFr ? `Rôle: ${isAdmin ? "admin" : "employé"}` : `Role: ${role}`}
          </p>
          <h1 className="max-w-[10ch] font-serif text-[clamp(4rem,10vw,8.5rem)] leading-[0.86] text-[var(--os)]">
            {isFr ? "Accès employé." : "Employee access."}
          </h1>
          <p className="mt-8 max-w-2xl text-xl leading-relaxed text-[rgba(245,247,250,0.68)]">
            {isFr
              ? "Point d'entrée interne pour traiter les demandes, répondre aux clients, créer les paiements Stripe et garder chaque action reliée au bon dossier."
              : "Internal entry point to process requests, answer clients, create Stripe payments, and keep every action attached to the right case."}
          </p>
          <div className="mt-8 grid border border-foreground/10 bg-foreground/[0.04] sm:grid-cols-4">
            {flowSteps.map((step) => (
              <span key={step.labelEn} className="border-b border-foreground/10 px-3 py-3 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-foreground/66 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 truncate">
                {isFr ? step.labelFr : step.labelEn}
              </span>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="/operations/"
              className="border-y border-accent/80 px-1 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground transition-colors hover:border-foreground"
            >
              {isFr ? "Ouvrir EMPLOYE" : "Open EMPLOYE"}
            </a>
            {isAdmin ? (
              <a
                href="/operations/payments.html"
                className="border-y border-foreground/20 px-1 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/60 transition-colors hover:border-foreground/55 hover:text-foreground"
              >
                {isFr ? "Paiements" : "Payments"}
              </a>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              className="border-y border-foreground/20 px-1 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/60 transition-colors hover:border-foreground/55 hover:text-foreground"
            >
              {isFr ? "Se déconnecter" : "Sign out"}
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-6">
          <article className="border border-foreground/12 bg-surface p-7">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.26em] text-accent">Chemin rapide</p>
            <h2 className="font-serif text-4xl leading-none text-[var(--os)]">{isFr ? "Quoi ouvrir" : "What to open"}</h2>
          <ul className="mt-7 grid gap-0" role="list">
              {visibleLinks.map((item) => (
                <li key={item.href} className="grid gap-3 border-t border-foreground/10 py-4 md:grid-cols-[13rem_1fr]">
                  <a href={item.href} className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-accent transition-colors hover:text-foreground">
                    {isFr ? item.labelFr : item.labelEn}
                  </a>
                  <span className="text-[rgba(245,247,250,0.62)]">{isFr ? item.detailFr : item.detailEn}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mt-6 border border-accent/20 bg-surface p-7">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.26em] text-accent">{isFr ? "Règle d'usage" : "Use rule"}</p>
          <h2 className="font-serif text-4xl leading-none text-[var(--os)]">
            {isFr ? "Un contact client devient un dossier à traiter." : "A client contact becomes a case to process."}
          </h2>
          <ol className="mt-7 grid gap-3 p-0 md:grid-cols-4" role="list">
            {automationSteps.map((step) => (
              <li key={step.number} className="list-none border border-foreground/10 bg-foreground/[0.035] p-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">{step.number}</span>
                <strong className="mt-3 block font-mono text-[11px] uppercase tracking-[0.16em] text-foreground">{isFr ? step.titleFr : step.titleEn}</strong>
                <small className="mt-2 block text-sm leading-relaxed text-foreground/55">{isFr ? step.detailFr : step.detailEn}</small>
              </li>
            ))}
          </ol>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-[rgba(245,247,250,0.64)]">
            {isFr
              ? "Quand une demande arrive, ouvrir EMPLOYE, chercher le dossier, qualifier la priorité, puis répondre avec la prochaine étape. Si un paiement est requis, créer le lien Stripe depuis le dossier pour garder le reçu, le statut et le suivi au même endroit."
              : "When a request arrives, open EMPLOYE, find the case, qualify priority, then respond with the next step. If payment is required, create the Stripe link from the case so the receipt, status, and follow-up stay in one place."}
          </p>
          <a href="/contact" className="mt-8 inline-block border-y border-foreground/20 px-1 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/60 transition-colors hover:border-foreground/55 hover:text-foreground">
            {isFr ? "Retour au contact" : "Back to contact"}
          </a>
        </section>
      </div>
    </main>
  );
}

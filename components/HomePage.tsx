"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { LogoMark } from "@/components/Logo";

export function HomePage() {
  const t = useTranslations();

  const problems = [
    {
      title: { en: "Fragmented execution", fr: "Exécution fragmentée" },
      desc: {
        en: "Critical work moves between tools, people, approvals, and spreadsheets without a reliable operating layer. Data gets copied by hand, decisions lag, and status becomes negotiation.",
        fr: "Le travail critique circule entre outils, personnes, approbations et tableurs sans couche opérationnelle fiable. Les données sont copiées à la main, les décisions ralentissent, et le statut devient une négociation."
      }
    },
    {
      title: { en: "Human dependency", fr: "Dépendance humaine" },
      desc: {
        en: "Processes depend on memory, heroics, and manual follow-up. When one person is unavailable, the company loses context, momentum, and control.",
        fr: "Les processus dépendent de la mémoire, des efforts individuels et du suivi manuel. Quand une personne manque, l'entreprise perd le contexte, l'élan et le contrôle."
      }
    },
    {
      title: { en: "Operational blind spots", fr: "Angles morts opérationnels" },
      desc: {
        en: "Leaders cannot see risk, throughput, bottlenecks, or ownership in time. Problems surface late, after the cost is already real.",
        fr: "Les dirigeants ne voient pas les risques, le débit, les goulots ou les responsabilités à temps. Les problèmes remontent tard, quand le coût est déjà réel."
      }
    }
  ];

  const whatWeDo = [
    {
      title: { en: "We instrument the operation.", fr: "On instrumente l'opération." },
      opacity: "text-background"
    },
    {
      title: { en: "Expose the failure points.", fr: "On expose les points de rupture." },
      opacity: "text-background/60"
    },
    {
      title: { en: "Build the system that keeps work moving.", fr: "On bâtit le système qui garde le travail en mouvement." },
      opacity: "text-background/40"
    }
  ];

  const steps = [
    {
      title: { en: "Assessment", fr: "Évaluation" },
      desc: {
        en: "A structured first read of the workflows, systems, and decision points that shape execution.",
        fr: "Une première lecture structurée des workflows, systèmes et points de décision qui façonnent l'exécution."
      }
    },
    {
      title: { en: "Automation", fr: "Automatisation" },
      desc: {
        en: "Reliable handoffs, notifications, updates, and approvals across the systems your team already uses.",
        fr: "Transferts, notifications, mises à jour et approbations fiables entre les systèmes que votre équipe utilise déjà."
      }
    },
    {
      title: { en: "Infrastructure", fr: "Infrastructure" },
      desc: {
        en: "Dashboards, agent workflows, internal tools, and control surfaces built around your operating reality.",
        fr: "Tableaux de bord, workflows d'agents, outils internes et surfaces de contrôle conçus autour de votre réalité opérationnelle."
      }
    }
  ];

  const heroMetrics = [
    { label: { en: "signal", fr: "signal" }, value: "04 layers" },
    { label: { en: "handoffs", fr: "transferts" }, value: "mapped" },
    { label: { en: "review", fr: "revue" }, value: "24h" },
    { label: { en: "status", fr: "statut" }, value: "private" }
  ];

  const services = [
    {
      title: { en: "Operational Assessment", fr: "Évaluation opérationnelle" },
      price: { en: "Free", fr: "Gratuit" },
      desc: {
        en: "5-minute questionnaire, AI-analyzed overnight. You get a detailed report on complexity, bottlenecks, and recommended next steps in 24 hours.",
        fr: "Questionnaire de 5 minutes, analysé par IA pendant la nuit. Vous recevez un rapport détaillé sur la complexité, les goulots et les prochaines étapes en 24 heures."
      },
      includes: {
        en: "Complexity score · Tool mapping · Top 3 friction points · Budget estimate",
        fr: "Score de complexité · Cartographie des outils · Top 3 des frictions · Estimation budgétaire"
      }
    },
    {
      title: { en: "Human Review", fr: "Revue humaine" },
      price: { en: "From $250", fr: "À partir de 250$" },
      desc: {
        en: "A senior analyst reviews your assessment, talks to your team, and delivers a detailed implementation roadmap with fixed-price quotes.",
        fr: "Un analyste senior revoit votre évaluation, parle à votre équipe, et livre une feuille de route détaillée avec des prix fixes."
      },
      includes: {
        en: "Discovery call · Process docs · Architecture diagram · Implementation plan",
        fr: "Appel découverte · Documentation des processus · Diagramme d'architecture · Plan d'implémentation"
      }
    },
    {
      title: { en: "Workflow Automation", fr: "Automatisation des workflows" },
      price: { en: "$2,500 – $15,000", fr: "2 500$ – 15 000$" },
      desc: {
        en: "We connect your tools and automate the handoffs. Eliminates copy-paste work, reduces errors, frees your team.",
        fr: "On connecte vos outils et on automatise les transferts. Élimine le copier-coller, réduit les erreurs, libère votre équipe."
      },
      includes: {
        en: "CRM sync · Auto-invoicing · Notifications · Data pipelines",
        fr: "Sync CRM · Facturation auto · Notifications · Pipelines de données"
      }
    },
    {
      title: { en: "Operational Dashboard", fr: "Tableau de bord opérationnel" },
      price: { en: "$5,000 – $25,000", fr: "5 000$ – 25 000$" },
      desc: {
        en: "A single view of your entire operation. Real-time data from all systems, visualized to spot problems before they escalate.",
        fr: "Une vue unique de toute votre opération. Données en temps réel de tous les systèmes, visualisées pour repérer les problèmes avant qu'ils n'escaladent."
      },
      includes: {
        en: "Real-time metrics · Custom KPIs · Alerts · Team visibility",
        fr: "Métriques temps réel · KPIs personnalisés · Alertes · Visibilité équipe"
      }
    }
  ];

  // Helper to get localized text
  const getText = (obj: { en: string; fr: string }) => {
    // Check if we're in French by looking at a known translation
    const isFr = t("problem.title") === "Le problème";
    return isFr ? obj.fr : obj.en;
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero — operational command surface */}
      <section className="relative min-h-[100svh] overflow-hidden bg-[#080806] pt-20 text-[#f4efe4]">
        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(244,239,228,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(244,239,228,0.055)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="absolute inset-x-6 top-28 h-px bg-[#9b4635]/38 lg:inset-x-14" />
        <div className="absolute inset-x-6 bottom-8 h-px bg-[#f4efe4]/14 lg:inset-x-14" />
        <div className="absolute left-6 right-6 top-28 bottom-8 border-x border-[#f4efe4]/10 lg:left-14 lg:right-14" />
        <div className="absolute left-8 top-24 font-mono text-[8px] uppercase tracking-[0.24em] text-[#f4efe4]/45 lg:left-16">NXR / 0002 / Quiet Mechanism</div>
        <div className="absolute right-8 top-24 hidden font-mono text-[8px] uppercase tracking-[0.24em] text-[#f4efe4]/45 md:block lg:right-16">XXM 01 / Plate II / MMXXVI</div>
        <div className="absolute left-8 bottom-3 hidden font-mono text-[8px] uppercase tracking-[0.2em] text-[#f4efe4]/34 md:block lg:left-16">NEXURA Analytics · Atelier</div>
        <div className="absolute right-8 bottom-3 hidden font-mono text-[8px] uppercase tracking-[0.2em] text-[#f4efe4]/34 md:block lg:right-16">1008 X 1008 / Post</div>
        <div className="relative z-10 grid min-h-[calc(100svh-5rem)] w-full max-w-[1480px] grid-cols-1 items-center gap-16 px-6 py-20 mx-auto lg:grid-cols-12 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7"
          >
            <div className="mb-8 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.34em] text-[#9b4635]">
              <span className="h-px w-14 bg-[#9b4635]" />
              <span>NEXURA ANALYTICS / PRIVATE OPS SYSTEMS</span>
            </div>
            
            <h1 className="mb-10 max-w-[15ch] font-serif text-[clamp(3rem,8vw,7.6rem)] leading-[0.9] text-[#f4efe4]">
              {getText({
                en: "Execution infrastructure for controlled growth.",
                fr: "Infrastructure d'exécution pour croissance contrôlée."
              })}
            </h1>
            
            <p className="mb-12 max-w-[55ch] text-lg leading-relaxed text-[#f4efe4]/62 md:text-2xl">
              {getText({
                en: "NEXURA designs secure operational intelligence systems: workflow automation, agent-assisted analysis, dashboards, and private control layers for teams that need clarity before scale.",
                fr: "NEXURA conçoit des systèmes sécurisés d'intelligence opérationnelle: automatisation de workflows, analyse assistée par agents, tableaux de bord et couches de contrôle privées pour les équipes qui veulent de la clarté avant l'échelle."
              })}
            </p>

            <div className="flex flex-wrap items-center gap-5">
              <Link
                href="/operational-assessment"
                className="group inline-flex items-center border-y border-[#9b4635]/70 px-1 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[#f4efe4]/82 transition-colors hover:border-[#f4efe4]/70 hover:text-[#f4efe4]"
              >
                {getText({
                  en: "Start assessment",
                  fr: "Démarrer l'évaluation"
                })}
                <span className="ml-4 text-[#9b4635] transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/services"
                className="border-y border-[#f4efe4]/18 px-1 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[#f4efe4]/54 transition-colors hover:border-[#f4efe4]/45 hover:text-[#f4efe4]"
              >
                {getText({ en: "View systems", fr: "Voir les systèmes" })}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="lg:col-span-5"
          >
            <div className="relative border border-[#f4efe4]/16 bg-[#11100d]/78 p-5 shadow-2xl shadow-black/40">
              <div className="mb-8 flex items-center justify-between border-b border-[#f4efe4]/12 pb-4 font-mono text-[9px] uppercase tracking-[0.28em] text-[#f4efe4]/45">
                <span>NX-OPS/CONTROL</span>
                <span>MMXXVI</span>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-6">
                <LogoMark size={80} />
                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-[#9b4635]">Operational command layer</p>
                  <p className="font-serif text-3xl leading-none text-[#f4efe4]">Private systems for execution clarity.</p>
                </div>
              </div>
              <div className="my-8 h-px bg-[#f4efe4]/12" />
              <div className="grid grid-cols-2 border border-[#f4efe4]/12">
                {heroMetrics.map((metric, index) => (
                  <div key={metric.value} className={`p-4 ${index % 2 === 0 ? "border-r" : ""} ${index < 2 ? "border-b" : ""} border-[#f4efe4]/12`}>
                    <p className="mb-3 font-mono text-[8px] uppercase tracking-[0.26em] text-[#f4efe4]/38">{getText(metric.label)}</p>
                    <p className="font-mono text-sm uppercase tracking-[0.08em] text-[#f4efe4]">{metric.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex items-end justify-between gap-6">
                <p className="max-w-[28ch] text-sm leading-relaxed text-[#f4efe4]/48">
                  {getText({
                    en: "A quiet layer between people, tools, data, and decisions.",
                    fr: "Une couche silencieuse entre personnes, outils, données et décisions."
                  })}
                </p>
                <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0 text-[#9b4635]" aria-hidden="true">
                  <circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.55" />
                  <circle cx="60" cy="60" r="26" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
                  <path d="M60 13V0M60 120v-13M13 60H0M120 60h-13" stroke="currentColor" strokeWidth="1" opacity="0.7" />
                  <path d="M36 84 84 36M42 36l42 48" stroke="currentColor" strokeWidth="1.4" opacity="0.75" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="h-14 w-px bg-[#9b4635]/45"
          />
        </div>
      </section>

      {/* The Problem — Editorial statement */}
      <section className="py-32 lg:py-48">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-8">
            <div className="lg:col-span-5">
              <p className="font-mono text-sm tracking-[0.2em] text-foreground/40 mb-6">
                {getText({ en: "THE PROBLEM", fr: "LE PROBLÈME" })}
              </p>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-foreground">
                {getText({
                  en: "Most companies do not need more software. They need an operating layer that makes the software obey.",
                  fr: "La plupart des entreprises n'ont pas besoin de plus de logiciels. Elles ont besoin d'une couche opérationnelle qui force les logiciels à obéir."
                })}
              </h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 lg:pt-8">
              <div className="space-y-12">
                {problems.map((problem, i) => (
                  <div key={i}>
                    <h3 className="text-2xl text-foreground mb-4">{getText(problem.title)}</h3>
                    <p className="text-lg text-foreground/60 leading-relaxed">
                      {getText(problem.desc)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do — Large text reveal */}
      <section className="py-32 lg:py-48 bg-foreground text-background">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <p className="font-mono text-sm tracking-[0.2em] text-background/40 mb-12">
            {getText({ en: "WHAT WE DO", fr: "CE QU'ON FAIT" })}
          </p>
          
          <div className="space-y-8 mb-24">
            {whatWeDo.map((item, i) => (
              <motion.h2 
                key={i}
                initial={{ opacity: 0.3 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`font-serif text-4xl md:text-5xl lg:text-7xl leading-[1.1] ${item.opacity}`}
              >
                {getText(item.title)}
              </motion.h2>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-16">
            {steps.map((step, i) => (
              <div key={i}>
                <p className="font-mono text-6xl text-background/20 mb-6">0{i + 1}</p>
                <h3 className="text-2xl text-background mb-4">{getText(step.title)}</h3>
                <p className="text-background/60 leading-relaxed">
                  {getText(step.desc)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services — Clean rows, no cards */}
      <section id="services" className="py-32 lg:py-48">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="grid lg:grid-cols-12 gap-16 mb-24">
            <div className="lg:col-span-6">
              <p className="font-mono text-sm tracking-[0.2em] text-foreground/40 mb-6">
                {getText({ en: "SERVICES", fr: "SERVICES" })}
              </p>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-foreground">
                {getText({
                  en: "Fixed-price. No hourly. No surprises.",
                  fr: "Prix fixe. Pas d'horaire. Pas de surprises."
                })}
              </h2>
            </div>
          </div>

          <div className="space-y-0">
            {services.map((service, i) => (
              <div key={i} className={`grid lg:grid-cols-12 gap-8 items-baseline py-12 border-t-2 border-foreground/40 ${i === services.length - 1 ? 'border-b-2' : ''}`}>
                <div className="lg:col-span-1">
                  <p className="font-mono text-sm text-foreground/30">0{i + 1}</p>
                </div>
                <div className="lg:col-span-4">
                  <h3 className="font-serif text-3xl text-foreground">{getText(service.title)}</h3>
                  <p className="font-mono text-lg text-foreground/40 mt-2">{getText(service.price)}</p>
                </div>
                <div className="lg:col-span-6">
                  <p className="text-lg text-foreground/70 leading-relaxed mb-4">
                    {getText(service.desc)}
                  </p>
                  <p className="text-foreground/40">
                    {getText(service.includes)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof — Large quotes, no boxes */}
      <section className="py-32 lg:py-48 bg-surface">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <p className="font-mono text-sm tracking-[0.2em] text-foreground/40 mb-16">
            {getText({ en: "WHAT CLIENTS SAY", fr: "CE QUE DISENT NOS CLIENTS" })}
          </p>
          
          <div className="space-y-32">
            {(t.raw("reviews.items") as Array<{
              quote: string;
              author: string;
              role: string;
              company: string;
            }>).map((review, i) => (
              <motion.figure
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="grid lg:grid-cols-12 gap-8"
              >
                <blockquote className="lg:col-span-9 font-serif text-3xl md:text-4xl lg:text-5xl leading-[1.2] text-foreground">
                  &ldquo;{review.quote}&rdquo;
                </blockquote>
                <figcaption className="lg:col-span-3 flex flex-col justify-end">
                  <p className="text-xl text-foreground mb-1">{review.author}</p>
                  <p className="text-foreground/50">{review.role}</p>
                  <p className="text-foreground/30 text-sm">{review.company}</p>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — Full bleed dark */}
      <section className="bg-foreground text-background py-32 lg:py-48">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7">
              <LogoMark size={80} className="text-background/20 mb-12" />
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-background mb-8">
                {t("finalCta.headline")}
              </h2>
              <p className="text-xl text-background/50 leading-relaxed mb-12 max-w-[48ch]">
                {t("finalCta.subheadline")}
              </p>
              <Link
                href="/operational-assessment"
                className="group inline-flex items-center gap-4 text-background text-lg"
              >
                <span className="w-14 h-14 rounded-full border-2 border-background/30 flex items-center justify-center group-hover:bg-background group-hover:text-foreground transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
                <span className="border-b border-background/30 pb-1 group-hover:border-background transition-colors">
                  {t("finalCta.cta")}
                </span>
              </Link>
            </div>
            <div className="lg:col-span-4 lg:col-start-9">
              <div className="space-y-8 text-background/40">
                <div>
                  <p className="text-background/20 font-mono text-sm mb-2">
                    {getText({ en: "TIME", fr: "DURÉE" })}
                  </p>
                  <p className="text-2xl text-background">5 minutes</p>
                </div>
                <div>
                  <p className="text-background/20 font-mono text-sm mb-2">
                    {getText({ en: "COST", fr: "COÛT" })}
                  </p>
                  <p className="text-2xl text-background">{getText({ en: "Free", fr: "Gratuit" })}</p>
                </div>
                <div>
                  <p className="text-background/20 font-mono text-sm mb-2">
                    {getText({ en: "DELIVERY", fr: "LIVRAISON" })}
                  </p>
                  <p className="text-2xl text-background">24 {getText({ en: "hours", fr: "heures" })}</p>
                </div>
                <div>
                  <p className="text-background/20 font-mono text-sm mb-2">
                    {getText({ en: "REQUIRED", fr: "REQUIS" })}
                  </p>
                  <p className="text-2xl text-background">{getText({ en: "No sales call", fr: "Pas d'appel de vente" })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { LogoMark } from "@/components/Logo";

export function HomePage() {
  const t = useTranslations();

  const problems = [
    {
      title: { en: "Disconnected tools", fr: "Outils déconnectés" },
      desc: {
        en: "Your CRM doesn't talk to your project management. Your invoicing is manual. Everyone copies and pastes between fifteen browser tabs, and information goes stale within hours.",
        fr: "Votre CRM ne communique pas avec votre gestion de projets. Votre facturation est manuelle. Tout le monde copie-colle entre quinze onglets, et l'information devient périmée en quelques heures."
      }
    },
    {
      title: { en: "Tribal knowledge", fr: "Savoir tribal" },
      desc: {
        en: "Critical processes live in people's heads. When they're sick or quit, work stops. Training new hires takes months because nothing is documented or automated.",
        fr: "Les processus critiques sont dans la tête des gens. Quand ils sont malades ou partent, le travail s'arrête. Former de nouveaux employés prend des mois parce que rien n'est documenté ou automatisé."
      }
    },
    {
      title: { en: "Blind spots", fr: "Angles morts" },
      desc: {
        en: "You can't see what's happening across your operation in real time. Problems become crises before anyone notices. Decisions are made on gut feel, not data.",
        fr: "Vous ne voyez pas ce qui se passe dans vos opérations en temps réel. Les problèmes deviennent des crises avant que quelqu'un ne remarque. Les décisions sont prises au feeling, pas avec des données."
      }
    }
  ];

  const whatWeDo = [
    {
      title: { en: "We audit your operations.", fr: "On audite vos opérations." },
      opacity: "text-background"
    },
    {
      title: { en: "Map every bottleneck.", fr: "On cartographie chaque goulot." },
      opacity: "text-background/60"
    },
    {
      title: { en: "Build the infrastructure to eliminate them.", fr: "On bâtit l'infrastructure pour les éliminer." },
      opacity: "text-background/40"
    }
  ];

  const steps = [
    {
      title: { en: "Assessment", fr: "Évaluation" },
      desc: {
        en: "AI-powered analysis of your operational complexity. 5 minutes from you, 24-hour turnaround. Completely free.",
        fr: "Analyse IA de votre complexité opérationnelle. 5 minutes de votre part, livraison en 24h. Complètement gratuit."
      }
    },
    {
      title: { en: "Automation", fr: "Automatisation" },
      desc: {
        en: "We connect your tools and automate the handoffs. When something happens in System A, System B updates automatically.",
        fr: "On connecte vos outils et on automatise les transferts. Quand quelque chose arrive dans le Système A, le Système B se met à jour automatiquement."
      }
    },
    {
      title: { en: "Infrastructure", fr: "Infrastructure" },
      desc: {
        en: "Custom dashboards, agent systems, and operational tooling. A single view of your entire operation, built for how you work.",
        fr: "Tableaux de bord personnalisés, systèmes d'agents et outils opérationnels. Une vue unique de toute votre opération, construite pour votre façon de travailler."
      }
    }
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

  // Detect locale from translation context
  const locale = t("brand.name") === "NEXURA" ? "en" : "en"; // fallback
  const isEn = true; // We'll use the t() function for translated content
  
  // Helper to get localized text
  const getText = (obj: { en: string; fr: string }) => {
    // Check if we're in French by looking at a known translation
    const isFr = t("problem.title") === "Le problème";
    return isFr ? obj.fr : obj.en;
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero — Full viewport, statement typography */}
      <section className="min-h-screen flex flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-foreground" />
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-8 lg:px-16 py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-mono text-sm tracking-[0.3em] text-background/50 mb-8">
              NEXURA ANALYTICS — MONTREAL
            </p>
            
            <h1 className="font-serif text-[clamp(2.5rem,8vw,7rem)] leading-[0.95] text-background mb-12 max-w-[18ch]">
              {getText({
                en: "We find what's costing you money.",
                fr: "On trouve ce qui vous coûte de l'argent."
              })}
            </h1>
            
            <p className="text-xl md:text-2xl text-background/60 max-w-[52ch] leading-relaxed mb-16">
              {getText({
                en: "Operational intelligence for mid-market companies. We expose hidden inefficiencies, automate broken workflows, and build the systems that let you scale.",
                fr: "Intelligence opérationnelle pour entreprises de taille moyenne. On expose les inefficacités cachées, automatise les workflows brisés, et bâtit les systèmes qui vous permettent de grandir."
              })}
            </p>

            <div className="flex flex-wrap gap-6">
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
                  {getText({
                    en: "Start Free Assessment",
                    fr: "Démarrer l'évaluation gratuite"
                  })}
                </span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-px h-16 bg-gradient-to-b from-background/50 to-transparent"
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
                  en: "Most companies leak 20-40% of their capacity to friction they can't see.",
                  fr: "La plupart des entreprises perdent 20-40% de leur capacité à cause de frictions qu'elles ne voient pas."
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

"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { LogoMark } from "@/components/Logo";

export function HomePage() {
  const t = useTranslations();

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
              We find what&apos;s costing you money.
            </h1>
            
            <p className="text-xl md:text-2xl text-background/60 max-w-[52ch] leading-relaxed mb-16">
              Operational intelligence for mid-market companies. We expose hidden inefficiencies, automate broken workflows, and build the systems that let you scale.
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
                  Start Free Assessment
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
              <p className="font-mono text-sm tracking-[0.2em] text-foreground/40 mb-6">THE PROBLEM</p>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-foreground">
                Most companies leak 20-40% of their capacity to friction they can&apos;t see.
              </h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 lg:pt-8">
              <div className="space-y-12">
                <div>
                  <h3 className="text-2xl text-foreground mb-4">Disconnected tools</h3>
                  <p className="text-lg text-foreground/60 leading-relaxed">
                    Your CRM doesn&apos;t talk to your project management. Your invoicing is manual. Everyone copies and pastes between fifteen browser tabs, and information goes stale within hours.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl text-foreground mb-4">Tribal knowledge</h3>
                  <p className="text-lg text-foreground/60 leading-relaxed">
                    Critical processes live in people&apos;s heads. When they&apos;re sick or quit, work stops. Training new hires takes months because nothing is documented or automated.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl text-foreground mb-4">Blind spots</h3>
                  <p className="text-lg text-foreground/60 leading-relaxed">
                    You can&apos;t see what&apos;s happening across your operation in real time. Problems become crises before anyone notices. Decisions are made on gut feel, not data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do — Large text reveal */}
      <section className="py-32 lg:py-48 bg-foreground text-background">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <p className="font-mono text-sm tracking-[0.2em] text-background/40 mb-12">WHAT WE DO</p>
          
          <div className="space-y-8 mb-24">
            <motion.h2 
              initial={{ opacity: 0.3 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="font-serif text-4xl md:text-5xl lg:text-7xl leading-[1.1] text-background"
            >
              We audit your operations.
            </motion.h2>
            <motion.h2 
              initial={{ opacity: 0.3 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-serif text-4xl md:text-5xl lg:text-7xl leading-[1.1] text-background/60"
            >
              Map every bottleneck.
            </motion.h2>
            <motion.h2 
              initial={{ opacity: 0.3 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="font-serif text-4xl md:text-5xl lg:text-7xl leading-[1.1] text-background/40"
            >
              Build the infrastructure to eliminate them.
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-16">
            <div>
              <p className="font-mono text-6xl text-background/20 mb-6">01</p>
              <h3 className="text-2xl text-background mb-4">Assessment</h3>
              <p className="text-background/60 leading-relaxed">
                AI-powered analysis of your operational complexity. 5 minutes from you, 24-hour turnaround. Completely free.
              </p>
            </div>
            <div>
              <p className="font-mono text-6xl text-background/20 mb-6">02</p>
              <h3 className="text-2xl text-background mb-4">Automation</h3>
              <p className="text-background/60 leading-relaxed">
                We connect your tools and automate the handoffs. When something happens in System A, System B updates automatically.
              </p>
            </div>
            <div>
              <p className="font-mono text-6xl text-background/20 mb-6">03</p>
              <h3 className="text-2xl text-background mb-4">Infrastructure</h3>
              <p className="text-background/60 leading-relaxed">
                Custom dashboards, agent systems, and operational tooling. A single view of your entire operation, built for how you work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services — Clean rows, no cards */}
      <section id="services" className="py-32 lg:py-48">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="grid lg:grid-cols-12 gap-16 mb-24">
            <div className="lg:col-span-6">
              <p className="font-mono text-sm tracking-[0.2em] text-foreground/40 mb-6">SERVICES</p>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-foreground">
                Fixed-price. No hourly. No surprises.
              </h2>
            </div>
          </div>

          <div className="space-y-0">
            {/* Service 1 */}
            <div className="grid lg:grid-cols-12 gap-8 items-baseline py-12 border-t border-foreground/20">
              <div className="lg:col-span-1">
                <p className="font-mono text-sm text-foreground/30">01</p>
              </div>
              <div className="lg:col-span-4">
                <h3 className="font-serif text-3xl text-foreground">Operational Assessment</h3>
                <p className="font-mono text-lg text-foreground/40 mt-2">Free</p>
              </div>
              <div className="lg:col-span-6">
                <p className="text-lg text-foreground/70 leading-relaxed mb-4">
                  5-minute questionnaire, AI-analyzed overnight. You get a detailed report on complexity, bottlenecks, and recommended next steps in 24 hours.
                </p>
                <p className="text-foreground/40">
                  Complexity score · Tool mapping · Top 3 friction points · Budget estimate
                </p>
              </div>
            </div>

            {/* Service 2 */}
            <div className="grid lg:grid-cols-12 gap-8 items-baseline py-12 border-t border-foreground/20">
              <div className="lg:col-span-1">
                <p className="font-mono text-sm text-foreground/30">02</p>
              </div>
              <div className="lg:col-span-4">
                <h3 className="font-serif text-3xl text-foreground">Human Review</h3>
                <p className="font-mono text-lg text-foreground/40 mt-2">From $250</p>
              </div>
              <div className="lg:col-span-6">
                <p className="text-lg text-foreground/70 leading-relaxed mb-4">
                  A senior analyst reviews your assessment, talks to your team, and delivers a detailed implementation roadmap with fixed-price quotes.
                </p>
                <p className="text-foreground/40">
                  Discovery call · Process docs · Architecture diagram · Implementation plan
                </p>
              </div>
            </div>

            {/* Service 3 */}
            <div className="grid lg:grid-cols-12 gap-8 items-baseline py-12 border-t border-foreground/20">
              <div className="lg:col-span-1">
                <p className="font-mono text-sm text-foreground/30">03</p>
              </div>
              <div className="lg:col-span-4">
                <h3 className="font-serif text-3xl text-foreground">Workflow Automation</h3>
                <p className="font-mono text-lg text-foreground/40 mt-2">$2,500 – $15,000</p>
              </div>
              <div className="lg:col-span-6">
                <p className="text-lg text-foreground/70 leading-relaxed mb-4">
                  We connect your tools and automate the handoffs. Eliminates copy-paste work, reduces errors, frees your team.
                </p>
                <p className="text-foreground/40">
                  CRM sync · Auto-invoicing · Notifications · Data pipelines
                </p>
              </div>
            </div>

            {/* Service 4 */}
            <div className="grid lg:grid-cols-12 gap-8 items-baseline py-12 border-t border-foreground/20 border-b">
              <div className="lg:col-span-1">
                <p className="font-mono text-sm text-foreground/30">04</p>
              </div>
              <div className="lg:col-span-4">
                <h3 className="font-serif text-3xl text-foreground">Operational Dashboard</h3>
                <p className="font-mono text-lg text-foreground/40 mt-2">$5,000 – $25,000</p>
              </div>
              <div className="lg:col-span-6">
                <p className="text-lg text-foreground/70 leading-relaxed mb-4">
                  A single view of your entire operation. Real-time data from all systems, visualized to spot problems before they escalate.
                </p>
                <p className="text-foreground/40">
                  Real-time metrics · Custom KPIs · Alerts · Team visibility
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof — Large quotes, no boxes */}
      <section className="py-32 lg:py-48 bg-surface">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <p className="font-mono text-sm tracking-[0.2em] text-foreground/40 mb-16">WHAT CLIENTS SAY</p>
          
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
                  <p className="text-background/20 font-mono text-sm mb-2">TIME</p>
                  <p className="text-2xl text-background">5 minutes</p>
                </div>
                <div>
                  <p className="text-background/20 font-mono text-sm mb-2">COST</p>
                  <p className="text-2xl text-background">Free</p>
                </div>
                <div>
                  <p className="text-background/20 font-mono text-sm mb-2">DELIVERY</p>
                  <p className="text-2xl text-background">24 hours</p>
                </div>
                <div>
                  <p className="text-background/20 font-mono text-sm mb-2">REQUIRED</p>
                  <p className="text-2xl text-background">No sales call</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

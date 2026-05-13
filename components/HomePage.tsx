"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Logo, LogoMark } from "@/components/Logo";

export function HomePage() {
  const t = useTranslations();

  return (
    <main className="min-h-screen">
      {/* Hero — Bold, clear, confident */}
      <section className="min-h-screen flex items-center bg-foreground text-background">
        <div className="w-full max-w-7xl mx-auto px-8 py-32">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-12">
              <LogoMark size={48} className="text-background" />
              <span className="font-mono text-sm tracking-widest text-background/60">NEXURA ANALYTICS</span>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-background mb-8">
              Operational intelligence<br />
              for companies that<br />
              refuse to guess.
            </h1>

            <p className="text-xl md:text-2xl text-background/70 max-w-2xl mb-12 leading-relaxed">
              We expose what&apos;s limiting your business — scattered systems, broken workflows, invisible bottlenecks — then build the infrastructure to eliminate them. Permanently.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link
                href="/operational-assessment"
                className="inline-flex items-center justify-center px-10 py-5 bg-background text-foreground text-lg font-medium hover:bg-background/90 transition-colors"
              >
                Start Free Assessment
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center px-10 py-5 border border-background/30 text-background text-lg font-medium hover:bg-background/10 transition-colors"
              >
                How It Works
              </Link>
            </div>

            {/* Trust bar */}
            <div className="flex flex-wrap gap-x-12 gap-y-4 text-sm text-background/50 font-mono">
              <span>Based in Montreal, QC</span>
              <span>Serving Canada & US</span>
              <span>Est. 2025</span>
              <span>AI-Powered Analysis</span>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do — Detailed breakdown */}
      <section className="py-32 bg-background">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16 mb-20">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl text-foreground leading-tight mb-6">
                We find the friction in your operations.
              </h2>
              <p className="text-lg text-foreground/70 leading-relaxed">
                Most companies lose 20-40% of productivity to operational friction they can&apos;t see. Tools that don&apos;t connect. Processes that exist only in someone&apos;s head. Data scattered across ten different places. We make that visible, then we fix it.
              </p>
            </div>
            <div className="flex items-center">
              <div className="grid grid-cols-2 gap-6 w-full">
                <div className="bg-surface p-8 border border-foreground/10">
                  <div className="font-serif text-5xl text-foreground mb-2">20-40%</div>
                  <div className="text-foreground/60">productivity lost to invisible friction</div>
                </div>
                <div className="bg-surface p-8 border border-foreground/10">
                  <div className="font-serif text-5xl text-foreground mb-2">5-15</div>
                  <div className="text-foreground/60">disconnected tools per company</div>
                </div>
              </div>
            </div>
          </div>

          {/* Problems we solve */}
          <div className="border-t border-foreground/10 pt-16">
            <h3 className="font-mono text-sm tracking-widest text-foreground/50 mb-10">PROBLEMS WE SOLVE</h3>
            <div className="grid md:grid-cols-3 gap-12">
              <div>
                <h4 className="font-serif text-2xl text-foreground mb-4">Disconnected Systems</h4>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  Your CRM doesn&apos;t talk to your project management. Your project management doesn&apos;t talk to your invoicing. Everyone copies and pastes between tabs.
                </p>
                <ul className="text-sm text-foreground/60 space-y-2">
                  <li>• Data entered multiple times</li>
                  <li>• Information gets stale or wrong</li>
                  <li>• No single source of truth</li>
                </ul>
              </div>
              <div>
                <h4 className="font-serif text-2xl text-foreground mb-4">Invisible Workflows</h4>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  Your processes live in people&apos;s heads. When someone leaves or is sick, work stalls. There&apos;s no documentation, no automation, no backup.
                </p>
                <ul className="text-sm text-foreground/60 space-y-2">
                  <li>• Tribal knowledge dependency</li>
                  <li>• No handoff protocols</li>
                  <li>• Training takes months</li>
                </ul>
              </div>
              <div>
                <h4 className="font-serif text-2xl text-foreground mb-4">No Operational Visibility</h4>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  You can&apos;t see what&apos;s happening across your operation. Is that project on track? How backed up is customer support? Nobody knows until it&apos;s a crisis.
                </p>
                <ul className="text-sm text-foreground/60 space-y-2">
                  <li>• Reactive instead of proactive</li>
                  <li>• Decisions based on gut feel</li>
                  <li>• Problems discovered too late</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services — Detailed cards */}
      <section id="services" className="py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-8">
          <div className="max-w-3xl mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-foreground leading-tight mb-6">
              What we build for you.
            </h2>
            <p className="text-lg text-foreground/70 leading-relaxed">
              Every engagement starts with understanding your operation. Then we build exactly what you need — not a generic solution, not a one-size-fits-all platform.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Service 1 */}
            <div className="bg-background p-10 border border-foreground/10">
              <div className="flex items-start justify-between mb-6">
                <h3 className="font-serif text-3xl text-foreground">Operational Assessment</h3>
                <span className="font-mono text-sm text-foreground/40">FREE</span>
              </div>
              <p className="text-foreground/70 leading-relaxed mb-6">
                A 5-minute questionnaire analyzed by our AI. You get back a detailed report of operational complexity, identified bottlenecks, and recommended next steps. No sales call required.
              </p>
              <div className="border-t border-foreground/10 pt-6">
                <h4 className="font-mono text-xs tracking-widest text-foreground/50 mb-4">WHAT YOU GET</h4>
                <ul className="text-sm text-foreground/60 space-y-2">
                  <li>• Operational complexity score</li>
                  <li>• Tool ecosystem mapping</li>
                  <li>• Top 3 bottleneck identification</li>
                  <li>• Recommended scope and budget range</li>
                  <li>• Delivered in 24 hours</li>
                </ul>
              </div>
            </div>

            {/* Service 2 */}
            <div className="bg-background p-10 border border-foreground/10">
              <div className="flex items-start justify-between mb-6">
                <h3 className="font-serif text-3xl text-foreground">Human Review</h3>
                <span className="font-mono text-sm text-foreground/40">FROM $250</span>
              </div>
              <p className="text-foreground/70 leading-relaxed mb-6">
                A senior analyst reviews your assessment, talks to your team, and produces a detailed implementation roadmap. This is where generic becomes specific.
              </p>
              <div className="border-t border-foreground/10 pt-6">
                <h4 className="font-mono text-xs tracking-widest text-foreground/50 mb-4">WHAT YOU GET</h4>
                <ul className="text-sm text-foreground/60 space-y-2">
                  <li>• 60-minute discovery call</li>
                  <li>• Detailed process documentation</li>
                  <li>• Integration architecture diagram</li>
                  <li>• Prioritized implementation plan</li>
                  <li>• Fixed-price project quotes</li>
                </ul>
              </div>
            </div>

            {/* Service 3 */}
            <div className="bg-background p-10 border border-foreground/10">
              <div className="flex items-start justify-between mb-6">
                <h3 className="font-serif text-3xl text-foreground">Workflow Automation</h3>
                <span className="font-mono text-sm text-foreground/40">$2,500 - $15,000</span>
              </div>
              <p className="text-foreground/70 leading-relaxed mb-6">
                We connect your tools and automate the handoffs between them. When something happens in System A, System B updates automatically. No human copy-paste required.
              </p>
              <div className="border-t border-foreground/10 pt-6">
                <h4 className="font-mono text-xs tracking-widest text-foreground/50 mb-4">EXAMPLES</h4>
                <ul className="text-sm text-foreground/60 space-y-2">
                  <li>• CRM → Project Management sync</li>
                  <li>• Form submission → Internal workflow trigger</li>
                  <li>• Invoice generation from completed work</li>
                  <li>• Slack/Teams alerts for key events</li>
                  <li>• Cross-platform data synchronization</li>
                </ul>
              </div>
            </div>

            {/* Service 4 */}
            <div className="bg-background p-10 border border-foreground/10">
              <div className="flex items-start justify-between mb-6">
                <h3 className="font-serif text-3xl text-foreground">Operational Dashboard</h3>
                <span className="font-mono text-sm text-foreground/40">$5,000 - $25,000</span>
              </div>
              <p className="text-foreground/70 leading-relaxed mb-6">
                A single view of your entire operation. Real-time data from all your systems, visualized so you can see problems before they become crises.
              </p>
              <div className="border-t border-foreground/10 pt-6">
                <h4 className="font-mono text-xs tracking-widest text-foreground/50 mb-4">EXAMPLES</h4>
                <ul className="text-sm text-foreground/60 space-y-2">
                  <li>• Project health at a glance</li>
                  <li>• Sales pipeline + delivery capacity</li>
                  <li>• Support queue metrics</li>
                  <li>• Team utilization tracking</li>
                  <li>• Custom KPI dashboards</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 bg-background">
        <div className="max-w-7xl mx-auto px-8">
          <div className="max-w-3xl mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-foreground leading-tight mb-6">
              How we work with you.
            </h2>
            <p className="text-lg text-foreground/70 leading-relaxed">
              No long discovery phases. No enterprise sales process. We move fast and deliver results you can measure.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="text-8xl font-serif text-foreground/10 mb-4">1</div>
              <h3 className="font-serif text-2xl text-foreground mb-3">Assessment</h3>
              <p className="text-foreground/70 leading-relaxed">
                5-minute questionnaire. You tell us what tools you use, what&apos;s broken, what keeps you up at night. AI analyzes it overnight.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <div className="text-8xl font-serif text-foreground/10 mb-4">2</div>
              <h3 className="font-serif text-2xl text-foreground mb-3">Analysis</h3>
              <p className="text-foreground/70 leading-relaxed">
                You get a report showing operational complexity, the biggest friction points, and a recommended scope. Free, no strings attached.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="text-8xl font-serif text-foreground/10 mb-4">3</div>
              <h3 className="font-serif text-2xl text-foreground mb-3">Proposal</h3>
              <p className="text-foreground/70 leading-relaxed">
                If you want to move forward, we do a human review and deliver a fixed-price proposal. You know exactly what you&apos;re getting and what it costs.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <div className="text-8xl font-serif text-foreground/10 mb-4">4</div>
              <h3 className="font-serif text-2xl text-foreground mb-3">Delivery</h3>
              <p className="text-foreground/70 leading-relaxed">
                We build. You review. We iterate. Typical projects take 2-8 weeks depending on scope. You get documentation and training included.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-8">
          <div className="max-w-3xl mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-foreground leading-tight mb-6">
              What clients say.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {(t.raw("reviews.items") as Array<{
              quote: string;
              author: string;
              role: string;
              company: string;
            }>).map((review, i) => (
              <motion.figure
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-background p-10 border border-foreground/10"
              >
                <blockquote className="font-serif text-xl text-foreground leading-relaxed mb-8">
                  &ldquo;{review.quote}&rdquo;
                </blockquote>
                <figcaption>
                  <div className="font-medium text-foreground text-lg">{review.author}</div>
                  <div className="text-foreground/60">{review.role}</div>
                  <div className="text-foreground/40 text-sm">{review.company}</div>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Summary */}
      <section className="py-32 bg-background border-t border-foreground/10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="max-w-3xl mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-foreground leading-tight mb-6">
              Transparent pricing.
            </h2>
            <p className="text-lg text-foreground/70 leading-relaxed">
              We don&apos;t hide our prices. Every project gets a fixed quote after assessment — no surprises, no scope creep fees, no hourly billing.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-surface p-10 border border-foreground/10">
              <div className="font-mono text-sm text-foreground/50 mb-4">ASSESSMENT</div>
              <div className="font-serif text-4xl text-foreground mb-4">Free</div>
              <p className="text-foreground/70">AI-powered analysis of your operations. No credit card, no call required.</p>
            </div>
            <div className="bg-surface p-10 border border-foreground/10">
              <div className="font-mono text-sm text-foreground/50 mb-4">AUTOMATION</div>
              <div className="font-serif text-4xl text-foreground mb-4">$2.5K-15K</div>
              <p className="text-foreground/70">Workflow connections and process automation. Price depends on complexity.</p>
            </div>
            <div className="bg-surface p-10 border border-foreground/10">
              <div className="font-mono text-sm text-foreground/50 mb-4">INFRASTRUCTURE</div>
              <div className="font-serif text-4xl text-foreground mb-4">$15K-75K+</div>
              <p className="text-foreground/70">Complete operational systems. Dashboards, automations, integrations.</p>
            </div>
          </div>

          <p className="text-center text-foreground/50 font-mono text-sm">
            All prices in CAD. Final quote provided after assessment.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-foreground text-background py-32">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <LogoMark size={64} className="mx-auto mb-10 text-background" />

          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
            {t("finalCta.headline")}
          </h2>
          <p className="text-xl text-background/60 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t("finalCta.subheadline")}
          </p>

          <Link
            href="/operational-assessment"
            className="inline-flex items-center justify-center px-12 py-5 bg-background text-foreground text-lg font-medium hover:bg-background/90 transition-colors"
          >
            {t("finalCta.cta")}
          </Link>

          <p className="mt-8 text-background/40 font-mono text-sm">
            Free. 5 minutes. No sales call.
          </p>
        </div>
      </section>
    </main>
  );
}

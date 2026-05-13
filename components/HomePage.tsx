"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Logo, LogoMark } from "@/components/Logo";

export function HomePage() {
  const t = useTranslations();

  return (
    <main className="min-h-screen">
      {/* Hero — Clear value proposition */}
      <section className="min-h-[85vh] flex items-center border-b border-foreground/10">
        <div className="w-full max-w-5xl mx-auto px-8 py-24">
          <div className="max-w-3xl">
            {/* Logo */}
            <div className="mb-12">
              <Logo size={56} />
            </div>

            {/* Headline */}
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight text-foreground mb-6">
              We find what&apos;s slowing<br />
              your company down.
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-foreground/70 max-w-xl mb-10 leading-relaxed">
              Operational assessments that expose inefficiencies, 
              followed by automation that eliminates them.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/operational-assessment"
                className="inline-flex items-center justify-center px-8 py-4 bg-foreground text-background font-medium text-sm hover:bg-foreground/90 transition-colors"
              >
                Start Free Assessment
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center px-8 py-4 border border-foreground/20 text-foreground font-medium text-sm hover:bg-foreground/5 transition-colors"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do — Three clear services */}
      <section className="py-24 bg-surface">
        <div className="max-w-5xl mx-auto px-8">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-16">
            What we do
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <div className="w-12 h-12 border-2 border-foreground/20 flex items-center justify-center mb-6">
                <span className="font-mono text-lg text-foreground">01</span>
              </div>
              <h3 className="font-serif text-xl mb-3 text-foreground">
                Operational Assessment
              </h3>
              <p className="text-foreground/70 leading-relaxed">
                We analyze your workflows, tools, and team structure to identify exactly where time and money are being lost.
              </p>
            </div>

            <div>
              <div className="w-12 h-12 border-2 border-foreground/20 flex items-center justify-center mb-6">
                <span className="font-mono text-lg text-foreground">02</span>
              </div>
              <h3 className="font-serif text-xl mb-3 text-foreground">
                Workflow Automation
              </h3>
              <p className="text-foreground/70 leading-relaxed">
                We build systems that handle repetitive tasks automatically. Your team focuses on work that matters.
              </p>
            </div>

            <div>
              <div className="w-12 h-12 border-2 border-foreground/20 flex items-center justify-center mb-6">
                <span className="font-mono text-lg text-foreground">03</span>
              </div>
              <h3 className="font-serif text-xl mb-3 text-foreground">
                Centralized Operations
              </h3>
              <p className="text-foreground/70 leading-relaxed">
                One dashboard. One source of truth. No more switching between ten different tools to understand what&apos;s happening.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — Simple 4-step process */}
      <section id="how-it-works" className="py-24 border-t border-foreground/10">
        <div className="max-w-5xl mx-auto px-8">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-16">
            How it works
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Submit assessment", desc: "Answer a few questions about your operations. Takes 5 minutes." },
              { step: "2", title: "AI analysis", desc: "Our system identifies complexity and estimates scope." },
              { step: "3", title: "Human review", desc: "We review the analysis and prepare recommendations." },
              { step: "4", title: "Implementation", desc: "We build the automation. You see results." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="font-serif text-5xl text-foreground/15 mb-4">
                  {item.step}
                </div>
                <h3 className="font-medium text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof — Clean testimonials */}
      <section className="py-24 bg-surface border-t border-foreground/10">
        <div className="max-w-5xl mx-auto px-8">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-16">
            What clients say
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {(
              t.raw("reviews.items") as Array<{
                quote: string;
                author: string;
                role: string;
                company: string;
              }>
            ).map((review, i) => (
              <motion.figure
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-background p-8 border border-foreground/10"
              >
                <blockquote className="text-foreground/80 leading-relaxed mb-6">
                  &ldquo;{review.quote}&rdquo;
                </blockquote>
                <figcaption>
                  <div className="font-medium text-foreground">
                    {review.author}
                  </div>
                  <div className="text-sm text-foreground/60">
                    {review.role}
                  </div>
                  <div className="text-sm text-foreground/40">
                    {review.company}
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — Dark, clear */}
      <section className="bg-foreground text-background py-24">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <LogoMark size={48} className="mx-auto mb-8 text-background" />
          
          <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-4">
            {t("finalCta.headline")}
          </h2>
          <p className="text-background/60 mb-10 max-w-lg mx-auto">
            {t("finalCta.subheadline")}
          </p>
          
          <Link
            href="/operational-assessment"
            className="inline-flex items-center justify-center px-8 py-4 bg-background text-foreground font-medium text-sm hover:bg-background/90 transition-colors"
          >
            {t("finalCta.cta")}
          </Link>
        </div>
      </section>
    </main>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Logo, LogoMark } from "@/components/Logo";

export function HomePage() {
  const t = useTranslations();

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="min-h-[90vh] flex items-center border-b border-foreground/10">
        <div className="w-full max-w-6xl mx-auto px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="mb-10">
                <Logo size={52} />
              </div>

              <h1 className="font-serif text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.1] text-foreground mb-6">
                We find what&apos;s slowing your company down.
              </h1>

              <p className="text-lg text-foreground/70 max-w-lg mb-8 leading-relaxed">
                Operational assessments that expose inefficiencies, followed by automation that eliminates them. For companies in Quebec and across Canada.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/operational-assessment"
                  className="inline-flex items-center justify-center px-8 py-4 bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors"
                >
                  Start Free Assessment
                </Link>
                <Link
                  href="#services"
                  className="inline-flex items-center justify-center px-8 py-4 border border-foreground/20 text-foreground font-medium hover:bg-foreground/5 transition-colors"
                >
                  View Services
                </Link>
              </div>
            </div>

            {/* Stats / Quick facts */}
            <div className="hidden lg:grid grid-cols-2 gap-6">
              <div className="bg-surface p-6 border border-foreground/10">
                <div className="font-serif text-4xl text-foreground mb-2">5 min</div>
                <div className="text-sm text-foreground/60">Free assessment takes</div>
              </div>
              <div className="bg-surface p-6 border border-foreground/10">
                <div className="font-serif text-4xl text-foreground mb-2">24h</div>
                <div className="text-sm text-foreground/60">AI analysis delivered</div>
              </div>
              <div className="bg-surface p-6 border border-foreground/10">
                <div className="font-serif text-4xl text-foreground mb-2">$250</div>
                <div className="text-sm text-foreground/60">Human review starts at</div>
              </div>
              <div className="bg-surface p-6 border border-foreground/10">
                <div className="font-serif text-4xl text-foreground mb-2">Quebec</div>
                <div className="text-sm text-foreground/60">Based in Montreal</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 bg-surface border-b border-foreground/10">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            {t("problem.title")}
          </h2>
          <p className="text-foreground/60 mb-12 max-w-2xl">
            Most companies we work with share these challenges. Sound familiar?
          </p>

          <div className="grid md:grid-cols-5 gap-6">
            {(t.raw("problem.items") as Array<{ label: string; desc: string }>).map(
              (item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-background p-5 border border-foreground/10"
                >
                  <div className="font-mono text-xs text-foreground/40 mb-3">0{i + 1}</div>
                  <h3 className="font-medium text-foreground mb-2">{item.label}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{item.desc}</p>
                </motion.div>
              )
            )}
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="py-20 border-b border-foreground/10">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            {t("solution.title")}
          </h2>
          <p className="text-foreground/60 mb-12 max-w-2xl">
            We build the infrastructure to solve these problems permanently.
          </p>

          <div className="grid md:grid-cols-4 gap-6">
            {(t.raw("solution.items") as Array<{ label: string; desc: string }>).map(
              (item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="p-6 border border-foreground/10"
                >
                  <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center mb-4">
                    <span className="font-mono text-sm">0{i + 1}</span>
                  </div>
                  <h3 className="font-medium text-foreground mb-2">{item.label}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{item.desc}</p>
                </motion.div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Services — Detailed */}
      <section id="services" className="py-20 bg-surface border-b border-foreground/10">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            {t("services.title")}
          </h2>
          <p className="text-foreground/60 mb-12 max-w-2xl">
            {t("services.subtitle")}
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {(t.raw("services.items") as Array<{ id: string; title: string; desc: string }>).map(
              (service, i) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-background p-8 border border-foreground/10"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center flex-shrink-0">
                      <span className="font-mono">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <div>
                      <h3 className="font-serif text-xl text-foreground mb-3">{service.title}</h3>
                      <p className="text-foreground/70 leading-relaxed">{service.desc}</p>
                    </div>
                  </div>
                </motion.div>
              )
            )}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/operational-assessment"
              className="inline-flex items-center justify-center px-8 py-4 bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors"
            >
              {t("services.cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 border-b border-foreground/10">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            {t("howItWorks.title")}
          </h2>
          <p className="text-foreground/60 mb-12 max-w-2xl">
            From assessment to implementation — here&apos;s what to expect.
          </p>

          <div className="grid md:grid-cols-4 gap-8">
            {(t.raw("howItWorks.steps") as Array<{ num: string; label: string; desc: string }>).map(
              (step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  <div className="font-serif text-6xl text-foreground/10 mb-4">{step.num}</div>
                  <h3 className="font-medium text-foreground mb-2">{step.label}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{step.desc}</p>
                  {i < 3 && (
                    <div className="hidden md:block absolute top-8 right-0 w-full h-px bg-foreground/10 -z-10" />
                  )}
                </motion.div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-surface border-b border-foreground/10">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            {t("pricing.title")}
          </h2>
          <p className="text-foreground/60 mb-2 max-w-2xl">
            {t("pricing.subtitle")}
          </p>
          <p className="text-sm text-foreground/40 mb-12">
            {t("pricing.note")}
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {(t.raw("pricing.items") as Array<{ title: string; range: string; desc: string }>).map(
              (item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-background p-6 border border-foreground/10"
                >
                  <h3 className="font-medium text-foreground mb-2">{item.title}</h3>
                  <div className="font-serif text-2xl text-foreground mb-3">{item.range}</div>
                  <p className="text-sm text-foreground/60">{item.desc}</p>
                </motion.div>
              )
            )}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/operational-assessment"
              className="inline-flex items-center justify-center px-8 py-4 bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors"
            >
              {t("pricing.cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 border-b border-foreground/10">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            {t("reviews.title")}
          </h2>
          <p className="text-foreground/60 mb-12 max-w-2xl">
            {t("reviews.subtitle")}
          </p>

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
                className="bg-surface p-8 border border-foreground/10"
              >
                <blockquote className="text-foreground/80 leading-relaxed mb-6">
                  &ldquo;{review.quote}&rdquo;
                </blockquote>
                <figcaption>
                  <div className="font-medium text-foreground">{review.author}</div>
                  <div className="text-sm text-foreground/60">{review.role}</div>
                  <div className="text-sm text-foreground/40">{review.company}</div>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-foreground text-background py-24">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <LogoMark size={56} className="mx-auto mb-8 text-background" />

          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl leading-tight mb-4">
            {t("finalCta.headline")}
          </h2>
          <p className="text-background/60 mb-10 max-w-xl mx-auto leading-relaxed">
            {t("finalCta.subheadline")}
          </p>

          <Link
            href="/operational-assessment"
            className="inline-flex items-center justify-center px-10 py-4 bg-background text-foreground font-medium hover:bg-background/90 transition-colors"
          >
            {t("finalCta.cta")}
          </Link>
        </div>
      </section>
    </main>
  );
}

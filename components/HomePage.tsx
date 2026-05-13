"use client";

import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Logo, LogoMark } from "@/components/Logo";

type Localized = { en: string; fr: string };

const copy = (locale: string, value: Localized) => (locale === "fr" ? value.fr : value.en);

function OrbitDiagram() {
  return (
    <svg viewBox="0 0 520 520" className="mx-auto h-[310px] w-[310px] md:h-[460px] md:w-[460px]" aria-hidden="true">
      <defs>
        <path id="nx-tick" d="M260 20 L260 31" />
      </defs>
      {Array.from({ length: 96 }).map((_, index) => (
        <use
          key={index}
          href="#nx-tick"
          stroke="currentColor"
          strokeOpacity={index % 12 === 0 ? 0.55 : 0.22}
          strokeWidth={index % 12 === 0 ? 1.5 : 0.75}
          transform={`rotate(${index * 3.75} 260 260)`}
        />
      ))}
      <circle cx="260" cy="260" r="196" fill="none" stroke="currentColor" strokeOpacity="0.34" />
      <circle cx="260" cy="260" r="148" fill="none" stroke="#c85d42" strokeOpacity="0.74" />
      <circle cx="260" cy="260" r="82" fill="none" stroke="currentColor" strokeOpacity="0.25" />
      <circle cx="260" cy="260" r="24" fill="none" stroke="currentColor" strokeOpacity="0.28" />
      <ellipse cx="260" cy="260" rx="214" ry="66" fill="none" stroke="currentColor" strokeOpacity="0.38" transform="rotate(12 260 260)" />
      <ellipse cx="260" cy="260" rx="208" ry="62" fill="none" stroke="currentColor" strokeOpacity="0.34" transform="rotate(-27 260 260)" />
      <path d="M150 350 C105 310 120 206 198 178 C278 149 380 163 407 232 C431 293 369 352 290 358 C240 362 192 357 150 350Z" fill="none" stroke="currentColor" strokeOpacity="0.24" strokeDasharray="9 12" />
      <circle cx="386" cy="181" r="10" fill="none" stroke="#c85d42" strokeWidth="2" />
      <circle cx="386" cy="181" r="3" fill="#c85d42" />
      <circle cx="176" cy="373" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="316" cy="329" r="4" fill="currentColor" fillOpacity="0.44" />
      <circle cx="260" cy="260" r="4" fill="#c85d42" />
      <path d="M150 395 H370" stroke="currentColor" strokeOpacity="0.38" />
      <path d="M225 413 H295" stroke="currentColor" strokeOpacity="0.38" />
      <text x="260" y="440" textAnchor="middle" className="fill-current font-mono text-[18px] tracking-[0.25em]">N · 0001</text>
    </svg>
  );
}

function Plate({
  n,
  title,
  children,
}: {
  n: string;
  title: Localized;
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const fig = n.replace(/^0+/, "") || "0";

  return (
    <section className="bg-[#ece7db] px-4 py-10 text-[#17181c] md:px-10 md:py-16">
      <div className="relative mx-auto max-w-[1320px] border border-[#17181c]/35 p-3">
        <div className="relative border border-[#17181c]/18 px-5 py-8 md:px-10 md:py-12">
          <div className="absolute left-1/2 top-[-1.05rem] -translate-x-1/2 font-mono text-sm text-[#17181c]/45">+</div>
          <div className="absolute bottom-[-1.05rem] left-1/2 -translate-x-1/2 font-mono text-sm text-[#17181c]/45">+</div>
          <div className="mb-10 flex items-center justify-between border-b border-[#17181c]/25 pb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#17181c]/58">
            <span>NXR · {n} — Quiet Mechanism</span>
            <span className="hidden md:inline">Plate {fig} / MMXXVI</span>
          </div>
          <p className="mb-12 text-center font-mono text-[10px] uppercase tracking-[0.24em] text-[#17181c]/55">
            Fig. {fig} · {copy(locale, title)}
          </p>
          {children}
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const locale = useLocale();

  const capabilities = [
    {
      id: "N-01",
      title: { en: "Ingest", fr: "Ingestion" },
      detail: { en: "Data, events, calls — normalized at the boundary.", fr: "Données, événements, appels — normalisés à la frontière." },
    },
    {
      id: "N-02",
      title: { en: "Reason", fr: "Raisonner" },
      detail: { en: "Models, rules, and tools composed with control.", fr: "Modèles, règles et outils composés avec contrôle." },
    },
    {
      id: "N-03",
      title: { en: "Act", fr: "Agir" },
      detail: { en: "Approvals, handoffs, notifications, and execution loops.", fr: "Approbations, transferts, notifications et boucles d’exécution." },
    },
    {
      id: "N-04",
      title: { en: "Observe", fr: "Observer" },
      detail: { en: "Every decision traced, every signal readable.", fr: "Chaque décision tracée, chaque signal lisible." },
    },
  ];

  const services = [
    {
      n: "I",
      title: { en: "Operational assessment", fr: "Évaluation opérationnelle" },
      body: { en: "A structured first read of the workflows, systems, and decision points that shape execution.", fr: "Une première lecture structurée des workflows, systèmes et points de décision qui façonnent l’exécution." },
    },
    {
      n: "II",
      title: { en: "Workflow automation", fr: "Automatisation des workflows" },
      body: { en: "Reliable handoffs, approvals, notifications, and data movement across the tools your team already uses.", fr: "Transferts, approbations, notifications et mouvements de données fiables entre les outils que votre équipe utilise déjà." },
    },
    {
      n: "III",
      title: { en: "Control surfaces", fr: "Surfaces de contrôle" },
      body: { en: "Dashboards, internal tools, and private AI systems built around your operating reality.", fr: "Tableaux de bord, outils internes et systèmes IA privés conçus autour de votre réalité opérationnelle." },
    },
  ];

  return (
    <main className="min-h-screen bg-[#ece7db] text-[#17181c]">
      <section className="relative bg-[#ece7db] px-4 py-8 text-[#17181c] md:px-10 md:py-12">
        <div className="relative mx-auto max-w-[1480px] border border-[#17181c]/40 p-3">
          <div className="relative overflow-hidden border border-[#17181c]/18 px-6 py-10 md:px-14 md:py-16">
            <div className="absolute left-1/2 top-[-0.95rem] -translate-x-1/2 font-mono text-sm text-[#17181c]/45">+</div>
            <div className="absolute bottom-[-0.95rem] left-1/2 -translate-x-1/2 font-mono text-sm text-[#17181c]/45">+</div>
            <div className="absolute left-0 right-0 top-3 flex justify-between px-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[#17181c]/58">
              <span>NXR · 0001 — Quiet Mechanism</span>
              <span className="hidden md:inline">MMXXVI / Fig. I</span>
            </div>

            <div className="grid min-h-[66svh] items-center gap-10 pt-10 md:grid-cols-[0.92fr_1fr]">
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                <p className="mb-8 max-w-[31ch] font-mono text-[12px] uppercase leading-relaxed tracking-[0.24em] text-[#17181c]/68">
                  {copy(locale, {
                    en: "An instrument maker for operational intelligence",
                    fr: "Un atelier d’instruments pour l’intelligence opérationnelle",
                  })}
                </p>
                <div className="border-l-2 border-[#c85d42] pl-5 md:pl-7">
                  <div className="mb-8 text-[#17181c]">
                    <Logo size={62} />
                  </div>
                  <h1 className="max-w-[12ch] font-serif text-[clamp(3.8rem,8vw,8.8rem)] font-normal leading-[0.86] tracking-[-0.04em]">
                    {copy(locale, { en: "Quiet systems for clear execution.", fr: "Des systèmes silencieux pour une exécution claire." })}
                  </h1>
                  <p className="mt-6 max-w-[48ch] font-serif text-2xl italic leading-tight text-[#17181c]/72 md:text-4xl">
                    {copy(locale, { en: "AI automation, quietly engineered.", fr: "Automatisation IA, ingénierie discrète." })}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#17181c]/56">
                    <span>EST. 2026</span><span>·</span><span>Agents</span><span>·</span><span>Pipelines</span><span>·</span><span>Observability</span>
                  </div>
                  <div className="mt-10 flex flex-wrap gap-4">
                    <Link href="/operational-assessment" className="border border-[#17181c] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] transition hover:bg-[#17181c] hover:text-[#ece7db]">
                      {copy(locale, { en: "Start assessment", fr: "Démarrer l’évaluation" })} ↗
                    </Link>
                    <Link href="/contact" className="border border-[#17181c]/25 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] transition hover:border-[#17181c]">
                      {copy(locale, { en: "Contact", fr: "Nous écrire" })}
                    </Link>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1 }} className="text-[#17181c]">
                <OrbitDiagram />
              </motion.div>
            </div>

            <div className="mt-8 flex justify-between border-t border-[#17181c]/22 pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#17181c]/55">
              <span>AI Automation Atelier</span>
              <span className="hidden md:inline">851 x 315 · Cover Plate</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20 text-center md:py-28">
        <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.28em] text-[#c85d42]">— A note from the workshop —</p>
        <p className="font-serif text-3xl italic leading-tight md:text-5xl">
          {copy(locale, {
            en: "We build automations the way instrument makers build movements: precise, legible, and quiet.",
            fr: "Nous bâtissons les automatisations comme des instruments de précision: lisibles, stables et silencieux.",
          })}{" "}
          <span className="text-[#c85d42]">
            {copy(locale, { en: "No theatrics. Just execution you can trust.", fr: "Pas de théâtre. Juste une exécution fiable." })}
          </span>
        </p>
      </section>

      <Plate n="0002" title={{ en: "Orchestration of agents", fr: "Orchestration des agents" }}>
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <OrbitDiagram />
          <div className="space-y-7">
            {capabilities.map((item) => (
              <div key={item.id} className="border-t border-[#17181c]/28 pt-4">
                <div className="mb-2 flex items-baseline gap-4 font-mono text-[11px] uppercase tracking-[0.18em]">
                  <span className="text-[#c85d42]">{item.id}</span>
                  <span>{copy(locale, item.title)}</span>
                </div>
                <p className="max-w-[42ch] text-sm leading-relaxed text-[#17181c]/60">{copy(locale, item.detail)}</p>
              </div>
            ))}
          </div>
        </div>
      </Plate>

      <Plate n="0003" title={{ en: "Commissions and studies", fr: "Mandats et études" }}>
        <div className="grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <article key={service.n} className="relative min-h-[260px] border border-[#17181c]/32 p-7">
              <span className="absolute right-5 top-4 font-serif text-3xl italic text-[#c85d42]">{service.n}</span>
              <h3 className="mb-5 max-w-[11ch] font-serif text-3xl leading-none md:text-4xl">{copy(locale, service.title)}</h3>
              <p className="text-sm leading-relaxed text-[#17181c]/62">{copy(locale, service.body)}</p>
              <div className="mt-10 border-t border-[#17181c]/22 pt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[#17181c]/55">
                {copy(locale, { en: "Inquire", fr: "Discuter" })} ↗
              </div>
            </article>
          ))}
        </div>
      </Plate>

      <section className="border-y border-[#17181c]/28 bg-[#17181c] px-6 py-20 text-[#ece7db] md:px-10">
        <div className="mx-auto grid max-w-[1180px] gap-8 text-center md:grid-cols-4">
          {[
            ["24h", copy(locale, { en: "first operational read", fr: "première lecture" })],
            ["100%", copy(locale, { en: "replayable logic", fr: "logique rejouable" })],
            ["04", copy(locale, { en: "control layers", fr: "couches de contrôle" })],
            ["0", copy(locale, { en: "extra noise", fr: "bruit inutile" })],
          ].map(([value, label]) => (
            <div key={label}>
              <div className="font-serif text-6xl leading-none md:text-7xl">{value}</div>
              <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[#ece7db]/52">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#ece7db] px-6 py-24 text-center text-[#17181c] md:py-32">
        <LogoMark size={90} className="mx-auto mb-10" />
        <h2 className="mx-auto max-w-3xl font-serif text-5xl leading-none md:text-7xl">
          {copy(locale, { en: "Quiet work, on request.", fr: "Travail discret, sur demande." })}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[#17181c]/60">
          {copy(locale, {
            en: "We take a small number of operational intelligence commissions at a time. Send the problem; we respond with the study.",
            fr: "Nous prenons un petit nombre de mandats d’intelligence opérationnelle à la fois. Envoyez le problème; nous répondons avec l’étude.",
          })}
        </p>
        <Link href="/contact" className="mt-10 inline-block border border-[#17181c] px-8 py-4 font-mono text-[10px] uppercase tracking-[0.24em] transition hover:bg-[#17181c] hover:text-[#ece7db]">
          contact@nexuradata.ca ↗
        </Link>
      </section>
    </main>
  );
}

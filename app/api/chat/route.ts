import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from "ai";
import { normalizeSessionToken, recordChatAttempt } from "@/lib/chat-storage";
import { guardPublicPost, jsonWithSecurity } from "@/lib/request-guard";

export const maxDuration = 30;

const MAX_MESSAGES = 10;
const MAX_MESSAGE_CHARS = 1000;
const MAX_TOTAL_CHARS = 6000;

const SYSTEM_EN = `You are NEXURA's AI assistant — concise, professional, embedded on nexuradata.ca.

NEXURA is an operational intelligence company based in Montreal, Canada.
We help companies centralize operations, automate workflows, and expose inefficiencies.

SERVICES:
- Workflow Automation ($2,500-$15,000 CAD): Automate repetitive tasks, handoffs, approvals
- Operational Dashboard ($5,000-$25,000 CAD): Real-time visibility across all operations
- AI Operational Analysis (Free assessment + $250 review): AI identifies bottlenecks and recommends improvements
- Centralized Operations ($15,000-$75,000+ CAD): Full system transformation connecting tools, teams, workflows
- Monthly Support ($500-$2,500/mo CAD): Ongoing maintenance and improvements

PROCESS:
1. Free AI assessment (5 min to fill, results in 24h)
2. Human review ($250 CAD) with detailed recommendations
3. Custom implementation based on findings

RULES:
- Be concise. No filler.
- Always recommend starting with the free assessment
- When recommending the assessment, include this exact link: https://nexuradata.ca/en/operational-assessment
- When referring to any page, always provide the full clickable URL (https://nexuradata.ca/...) and never a plain page name alone
- Do not use Markdown formatting. No **bold**, headings, tables, or decorative bullets.
- Respond in the user's language
- Don't invent information — if unsure, say so
- If unrelated to business operations, politely redirect`;

const SYSTEM_FR = `Vous êtes l'assistant IA de NEXURA — concis, professionnel, intégré à nexuradata.ca.

NEXURA est une entreprise d'intelligence opérationnelle basée à Montréal.
Nous aidons les entreprises à centraliser leurs opérations, automatiser leurs workflows et exposer les inefficacités.

SERVICES:
- Automatisation des workflows (2 500$-15 000$ CAD): Automatiser les tâches répétitives, transferts, approbations
- Tableau de bord opérationnel (5 000$-25 000$ CAD): Visibilité en temps réel sur toutes les opérations
- Analyse opérationnelle IA (Évaluation gratuite + revue à 250$): L'IA identifie les goulots et recommande des améliorations
- Opérations centralisées (15 000$-75 000$+ CAD): Transformation complète du système
- Support mensuel (500$-2 500$/mois CAD): Maintenance et améliorations continues

PROCESSUS:
1. Évaluation IA gratuite (5 min, résultats en 24h)
2. Revue humaine (250$ CAD) avec recommandations détaillées
3. Implémentation sur mesure

RÈGLES:
- Soyez concis. Pas de remplissage.
- Recommandez toujours de commencer par l'évaluation gratuite
- Quand vous recommandez l'évaluation, incluez ce lien exact: https://nexuradata.ca/fr/operational-assessment
- Quand vous mentionnez une page, donnez toujours l'URL complète cliquable (https://nexuradata.ca/...) et jamais seulement un nom de page
- N'utilisez pas de Markdown. Pas de **gras**, pas de titres, pas de tableaux, pas de puces décoratives.
- Répondez dans la langue de l'utilisateur
- N'inventez rien — si incertain, dites-le
- Si hors sujet, redirigez poliment`;

type ChatRequestBody = {
  messages?: UIMessage[];
  locale?: string;
  sessionId?: string;
};

function normalizeLocale(locale: string | undefined) {
  return locale === "fr" ? "fr" : "en";
}

function extractTextParts(message: UIMessage) {
  if (!Array.isArray(message.parts)) {
    return [] as string[];
  }

  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text.trim())
    .filter(Boolean);
}

function normalizeMessages(messages: UIMessage[]) {
  const trimmedMessages = messages.slice(-MAX_MESSAGES);
  const normalizedMessages: UIMessage[] = [];
  let totalChars = 0;

  for (const message of trimmedMessages) {
    if (message.role !== "user" && message.role !== "assistant") {
      continue;
    }

    const textParts = extractTextParts(message);
    if (textParts.length === 0) {
      continue;
    }

    const normalizedParts = [] as { type: "text"; text: string }[];
    for (const text of textParts) {
      const truncated = text.slice(0, MAX_MESSAGE_CHARS);
      totalChars += truncated.length;
      normalizedParts.push({ type: "text", text: truncated });
    }

    normalizedMessages.push({
      ...message,
      parts: normalizedParts,
    });
  }

  if (normalizedMessages.length === 0) {
    return { ok: false as const, error: "invalid-chat-payload" };
  }

  if (totalChars > MAX_TOTAL_CHARS) {
    return { ok: false as const, error: "chat-payload-too-large" };
  }

  const latestUserMessage = [...normalizedMessages].reverse().find((message) => message.role === "user");
  const latestUserText = latestUserMessage
    ? extractTextParts(latestUserMessage).join(" ").trim()
    : "";

  if (!latestUserText || latestUserText.length < 2) {
    return { ok: false as const, error: "chat-message-too-short" };
  }

  return {
    ok: true as const,
    messages: normalizedMessages,
  };
}

function summarizeMessages(messages: UIMessage[]) {
  let messageCount = 0;
  let totalChars = 0;
  let latestUserMessage = "";

  for (const message of messages) {
    if (message.role !== "user" && message.role !== "assistant") {
      continue;
    }

    const textParts = extractTextParts(message);
    if (textParts.length === 0) {
      continue;
    }

    messageCount += 1;

    for (const text of textParts) {
      totalChars += text.length;
    }

    if (message.role === "user") {
      latestUserMessage = textParts.join(" ").trim();
    }
  }

  return {
    messageCount,
    totalChars,
    latestUserMessage,
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as ChatRequestBody;
  const candidateMessages = Array.isArray(body.messages) ? body.messages : [];
  const locale = normalizeLocale(body.locale);
  const sessionToken = normalizeSessionToken(body.sessionId);
  const candidateSummary = summarizeMessages(candidateMessages);
  const guarded = guardPublicPost(req, { namespace: "chat", maxRequests: 8 });

  if (guarded) {
    await recordChatAttempt({
      request: req,
      sessionToken,
      locale,
      outcome: "rejected",
      errorCode: guarded.status === 429 ? "rate-limited" : "forbidden",
      ...candidateSummary,
    });
    return guarded;
  }

  const normalized = normalizeMessages(candidateMessages);

  if (!normalized.ok) {
    await recordChatAttempt({
      request: req,
      sessionToken,
      locale,
      outcome: "rejected",
      errorCode: normalized.error,
      ...candidateSummary,
    });
    return jsonWithSecurity({ ok: false, error: normalized.error }, { status: 400 });
  }

  await recordChatAttempt({
    request: req,
    sessionToken,
    locale,
    outcome: "accepted",
    ...summarizeMessages(normalized.messages),
  });

  const result = streamText({
    model: "openai/gpt-4o-mini",
    system: locale === "fr" ? SYSTEM_FR : SYSTEM_EN,
    messages: await convertToModelMessages(normalized.messages),
    maxOutputTokens: 500,
    abortSignal: req.signal,
  });

  return result.toUIMessageStreamResponse({
    originalMessages: normalized.messages,
    consumeSseStream: consumeStream,
  });
}

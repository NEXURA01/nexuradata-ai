"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { LogoMark } from "@/components/Logo";
import {
  createThread,
  getCurrentUserId,
  getMessages,
  listUserThreads,
  sendMessage as sendThreadMessage,
  subscribeToMessages,
  type ChatMessage,
  type ChatThread,
  upsertChatProfile,
} from "@/lib/supabase-chat";

const CHAT_SESSION_STORAGE_KEY = "nexura.chat.session";
const CHAT_THREAD_STORAGE_KEY = "nexura.chat.thread";

const cleanAssistantText = (value: string) =>
  value
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();

const extractMessageText = (parts?: Array<{ type: string; text?: string }>) =>
  (parts || [])
    .filter((part): part is { type: "text"; text: string } => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("")
    .trim();

const normalizeLink = (value: string) => {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("nexuradata.ca") || value.startsWith("www.nexuradata.ca")) {
    return `https://${value.replace(/^www\./, "")}`;
  }

  if (value.startsWith("/")) {
    return `https://nexuradata.ca${value}`;
  }

  return value;
};

const splitTrailingPunctuation = (value: string) => {
  const match = value.match(/^(.*?)([.,;!?]+)?$/);
  return {
    core: match?.[1] || value,
    trailing: match?.[2] || "",
  };
};

const renderMessageText = (value: string) => {
  const cleanText = cleanAssistantText(value);
  const parts = cleanText.split(
    /(https?:\/\/[^\s)]+|(?:www\.)?nexuradata\.ca[^\s)]*|\/(?:fr|en)\/[A-Za-z0-9\-/?=&_%#]+|\/(?:contact|services|pricing|operational-assessment|evaluation|tarifs|portal|about|faq)[A-Za-z0-9\-/?=&_%#]*)/g
  );

  return parts.map((part, index) => {
    const { core, trailing } = splitTrailingPunctuation(part);
    const href = normalizeLink(core);
    const isLink =
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("/");
    const isInternalNexuraLink = href.startsWith("/") || href.startsWith("https://nexuradata.ca");

    if (!isLink) return part;

    const label = href.replace(/^https?:\/\/nexuradata\.ca/, "");

    return (
      <span key={`${part}-${index}`}>
        <a
          href={href}
          target={isInternalNexuraLink ? "_self" : "_blank"}
          rel={isInternalNexuraLink ? undefined : "noopener noreferrer"}
          className="border-b border-current/35 text-current transition-opacity hover:opacity-70"
        >
          {label}
        </a>
        {trailing}
      </span>
    );
  });
};

const CONTACT_FORM_TRIGGER_RE =
  /\b(contact|assessment|evaluation|operational-assessment|rendez[-\s]?vous|book\s+(a\s+)?(call|meeting)|schedule|speak\s+with|parler\s+a|prendre\s+rendez-vous|formulaire\s+de\s+contact)\b/;

const PAYMENT_LINK_TRIGGER_RE =
  /\b(stripe|checkout|payment\s+link|payment|lien\s+de\s+paiement|paiement)\b/;

const CONTACT_PAGE_RE =
  /https?:\/\/nexuradata\.ca\/(?:fr|en)\/(?:contact|operational-assessment)|https?:\/\/nexuradata\.ca\/(?:contact|operational-assessment)|\/(?:fr|en)\/(?:contact|operational-assessment)|\/(?:contact|operational-assessment)/;

const ASSESSMENT_TRIGGER_RE =
  /\b(operational-assessment|assessment|evaluation|evaluation\s+gratuite|free\s+assessment)\b/;

const USER_ASSESSMENT_INTENT_RE =
  /\b(assessment|evaluation|évaluation|operational-assessment|faire\s+mon\s+assessment|start\s+(the\s+)?assessment|commencer\s+l[' ]?évaluation)\b/;

const ASSESSMENT_PATH_BY_LOCALE = {
  fr: "/fr/operational-assessment",
  en: "/en/operational-assessment",
} as const;

const createChatSessionId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `chat_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
};

const createPaymentLinkDraft = (isFr: boolean) =>
  isFr
    ? "Je veux un lien de paiement Stripe. Service: [preciser]. Demarrage souhaite: [date]."
    : "I want a Stripe payment link. Service: [specify]. Preferred start date: [date].";

const getStoredSessionId = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const existingSessionId = window.localStorage.getItem(CHAT_SESSION_STORAGE_KEY);

  if (existingSessionId) {
    return existingSessionId;
  }

  const nextSessionId = createChatSessionId();
  window.localStorage.setItem(CHAT_SESSION_STORAGE_KEY, nextSessionId);
  return nextSessionId;
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(() => getStoredSessionId());
  const [threadId, setThreadId] = useState<string | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isThreadSyncEnabled, setIsThreadSyncEnabled] = useState(false);
  const [isSyncReady, setIsSyncReady] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactStatus, setContactStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [contactError, setContactError] = useState<string | null>(null);
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const persistedUserMessageIdsRef = useRef<Set<string>>(new Set());
  const assessmentRedirectedMessageIdRef = useRef<string | null>(null);

  const hydrateMessagesFromHistory = (history: ChatMessage[], userId: string) => {
    persistedUserMessageIdsRef.current = new Set(
      history
        .filter((message) => message.sender_id === userId)
        .map((message) => message.id)
    );

    setMessages(
      history.map((message) => ({
        id: message.id,
        role: message.sender_id === userId ? "user" : "assistant",
        parts: [{ type: "text" as const, text: message.content }],
      }))
    );
  };

  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { locale, sessionId: sessionId || undefined },
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";
  const isFr = locale === "fr";

  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant");
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
  const lastAssistantText = cleanAssistantText(extractMessageText(lastAssistantMessage?.parts as Array<{ type: string; text?: string }> | undefined)).toLowerCase();
  const lastUserText = cleanAssistantText(extractMessageText(lastUserMessage?.parts as Array<{ type: string; text?: string }> | undefined)).toLowerCase();
  const showInlineContactForm =
    messages.length > 0 &&
    (
      CONTACT_FORM_TRIGGER_RE.test(lastAssistantText) ||
      PAYMENT_LINK_TRIGGER_RE.test(lastAssistantText) ||
      CONTACT_PAGE_RE.test(lastAssistantText)
    );
  const showAssessmentCta = messages.length > 0 && ASSESSMENT_TRIGGER_RE.test(lastAssistantText);
  const assessmentPath = isFr ? ASSESSMENT_PATH_BY_LOCALE.fr : ASSESSMENT_PATH_BY_LOCALE.en;
  const shouldAutoRedirectToAssessment =
    Boolean(lastAssistantMessage?.id) &&
    showAssessmentCta &&
    USER_ASSESSMENT_INTENT_RE.test(lastUserText);

  useEffect(() => {
    if (!shouldAutoRedirectToAssessment || !lastAssistantMessage?.id) {
      return;
    }

    if (assessmentRedirectedMessageIdRef.current === lastAssistantMessage.id) {
      return;
    }

    assessmentRedirectedMessageIdRef.current = lastAssistantMessage.id;

    const timeout = window.setTimeout(() => {
      window.location.assign(assessmentPath);
    }, 350);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [shouldAutoRedirectToAssessment, lastAssistantMessage?.id, assessmentPath]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!sessionId) {
      setSessionId(getStoredSessionId());
    }
  }, [sessionId]);

  useEffect(() => {
    if (!isOpen || isSyncReady) {
      return;
    }

    let cancelled = false;

    const initializeSupabaseThreadSync = async () => {
      try {
        await upsertChatProfile();
        const userId = await getCurrentUserId();

        if (!userId) {
          throw new Error("Not signed in");
        }

        const availableThreads = await listUserThreads();
        const storedThreadId =
          typeof window !== "undefined"
            ? window.localStorage.getItem(CHAT_THREAD_STORAGE_KEY)
            : null;

        let selectedThread =
          availableThreads.find((thread) => thread.id === storedThreadId) ||
          availableThreads[0];

        if (!selectedThread) {
          selectedThread = await createThread(isFr ? "Nouveau fil" : "New thread");
        }

        const history = await getMessages(selectedThread.id);

        if (cancelled) {
          return;
        }

        setCurrentUserId(userId);
        setThreads((prev) => {
          const merged = [...availableThreads];
          if (!merged.some((thread) => thread.id === selectedThread.id)) {
            merged.unshift(selectedThread);
          }
          return merged;
        });
        setThreadId(selectedThread.id);
        hydrateMessagesFromHistory(history, userId);
        setSyncError(null);
        setIsThreadSyncEnabled(true);
      } catch {
        if (cancelled) {
          return;
        }

        setIsThreadSyncEnabled(false);
        setSyncError(isFr ? "Sync Supabase indisponible" : "Supabase sync unavailable");
      } finally {
        if (!cancelled) {
          setIsSyncReady(true);
        }
      }
    };

    void initializeSupabaseThreadSync();

    return () => {
      cancelled = true;
    };
  }, [isOpen, isSyncReady, isFr, setMessages]);

  useEffect(() => {
    if (!threadId || !isThreadSyncEnabled) {
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(CHAT_THREAD_STORAGE_KEY, threadId);
    }

    const unsubscribe = subscribeToMessages(threadId, (payload) => {
      const row = payload.new as ChatMessage;
      setMessages((current) => {
        if (current.some((entry) => entry.id === row.id)) {
          return current;
        }

        return [
          ...current,
          {
            id: row.id,
            role: row.sender_id === currentUserId ? "user" : "assistant",
            parts: [{ type: "text", text: row.content }],
          },
        ];
      });
    });

    return unsubscribe;
  }, [threadId, isThreadSyncEnabled, setMessages, currentUserId]);

  const loadThread = async (nextThreadId: string) => {
    if (!isThreadSyncEnabled || !currentUserId || nextThreadId === threadId) {
      return;
    }

    const history = await getMessages(nextThreadId);
    setThreadId(nextThreadId);
    hydrateMessagesFromHistory(history, currentUserId);
  };

  const createAndLoadThread = async () => {
    if (!isThreadSyncEnabled) {
      return;
    }

    const created = await createThread(isFr ? "Nouveau fil" : "New thread");
    setThreads((current) => [created, ...current]);
    setThreadId(created.id);
    persistedUserMessageIdsRef.current.clear();
    setMessages([]);
  };

  useEffect(() => {
    if (!isThreadSyncEnabled || !threadId || messages.length === 0) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user") {
      return;
    }

    if (persistedUserMessageIdsRef.current.has(lastMessage.id)) {
      return;
    }

    const content = lastMessage.parts
      ?.filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("")
      .trim();

    if (!content) {
      return;
    }

    persistedUserMessageIdsRef.current.add(lastMessage.id);

    void sendThreadMessage(threadId, content).catch(() => {
      persistedUserMessageIdsRef.current.delete(lastMessage.id);
    });
  }, [messages, isThreadSyncEnabled, threadId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInlineContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setContactStatus("error");
      setContactError(isFr ? "Merci de remplir les 3 champs." : "Please fill all 3 fields.");
      return;
    }

    try {
      setContactStatus("sending");
      setContactError(null);

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          message: contactMessage,
          locale,
        }),
      });

      if (!response.ok) {
        throw new Error("contact-submit-failed");
      }

      setContactStatus("success");
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    } catch {
      setContactStatus("error");
      setContactError(
        isFr
          ? "Impossible d'envoyer le formulaire pour le moment."
          : "Unable to send the form right now."
      );
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center border border-[rgba(245,247,250,0.65)] bg-[var(--noir)] text-[var(--os)] shadow-2xl shadow-black/30"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <LogoMark size={34} />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-50 flex h-[560px] w-[400px] flex-col overflow-hidden border border-foreground/20 bg-background shadow-2xl"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-foreground/10 flex items-center gap-3 shrink-0 bg-background">
              <div className="flex h-10 w-10 items-center justify-center border border-foreground/70 text-foreground shrink-0">
                <LogoMark size={26} />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-lg font-semibold text-foreground leading-tight">
                  Nexura
                </h3>
                <p className="text-[11px] text-foreground/50 font-mono uppercase tracking-wider">
                  {isFr ? "Assistant IA" : "AI Assistant"}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-foreground/40 font-mono">
                  {isFr ? "En ligne" : "Online"}
                </span>
              </div>
            </div>

            {isThreadSyncEnabled && (
              <div className="px-4 py-2 border-b border-foreground/10 bg-background/70 flex items-center gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => {
                    void createAndLoadThread();
                  }}
                  className="shrink-0 text-[10px] font-mono uppercase tracking-wider border border-foreground/30 px-2 py-1 hover:bg-foreground/10"
                >
                  {isFr ? "Nouveau" : "New"}
                </button>
                {threads.slice(0, 6).map((thread, index) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => {
                      void loadThread(thread.id);
                    }}
                    className={`shrink-0 text-[10px] font-mono uppercase tracking-wider border px-2 py-1 transition-colors ${
                      thread.id === threadId
                        ? "border-foreground bg-foreground text-background"
                        : "border-foreground/30 text-foreground/70 hover:bg-foreground/10"
                    }`}
                  >
                    {(thread.title || (isFr ? `fil ${index + 1}` : `thread ${index + 1}`)).slice(0, 18)}
                  </button>
                ))}
              </div>
            )}

            {!isThreadSyncEnabled && syncError && (
              <div className="px-4 py-2 border-b border-foreground/10 text-[10px] font-mono uppercase tracking-wider text-foreground/50">
                {syncError}
              </div>
            )}

            {/* Messages area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-14 h-14 border border-foreground/25 flex items-center justify-center mb-4">
                    <LogoMark size={28} className="text-foreground/40" />
                  </div>
                  <h4 className="font-serif text-xl text-foreground mb-2">
                    {isFr ? "Bonjour" : "Hello"}
                  </h4>
                  <p className="text-sm text-foreground/50 leading-relaxed max-w-[260px]">
                    {isFr
                      ? "Posez-moi une question sur nos services, nos tarifs, ou comment NEXURA peut aider votre entreprise."
                      : "Ask me about our services, pricing, or how NEXURA can help your company."}
                  </p>
                  <p className="mt-3 text-xs text-foreground/60 leading-relaxed max-w-[280px] font-mono">
                    {isFr
                      ? "Petit mot de ma part: donnez-moi votre contexte en 1-2 phrases, et je vous guide vers la prochaine meilleure etape."
                      : "A quick note from me: share your context in 1-2 lines and I will guide you to the best next step."}
                  </p>

                  {/* Quick prompts */}
                  <div className="mt-6 flex flex-col gap-2 w-full">
                    {(isFr
                      ? [
                          "Que fait NEXURA exactement?",
                          "Combien coûte une évaluation?",
                          "Comment fonctionne l'automatisation?",
                          "Je veux un lien de paiement sécurisé",
                        ]
                      : [
                          "What does NEXURA do exactly?",
                          "How much does an assessment cost?",
                          "How does the automation work?",
                          "I want a secure payment link",
                        ]
                    ).map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => {
                          sendMessage({ text: prompt });
                        }}
                        className="text-left text-xs font-mono text-foreground/60 hover:text-foreground hover:bg-foreground/5 px-3 py-2 transition-colors border border-foreground/10 hover:border-foreground/20"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  const isUser = message.role === "user";
                  const text = extractMessageText(message.parts as Array<{ type: string; text?: string }> | undefined);

                  if (!text) return null;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                          isUser
                            ? "bg-foreground text-background"
                            : "bg-foreground/5 text-foreground"
                        }`}
                      >
                        {isUser ? text : renderMessageText(text)}
                      </div>
                    </div>
                  );
                })
              )}

              {showInlineContactForm && (
                <div className="border border-foreground/20 bg-foreground/[0.03] p-3">
                  <p className="text-xs font-mono uppercase tracking-wider text-foreground/60 mb-2">
                    {isFr ? "Formulaire de contact rapide" : "Quick contact form"}
                  </p>
                  <form onSubmit={handleInlineContactSubmit} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setContactMessage(createPaymentLinkDraft(isFr));
                        setContactStatus("idle");
                        setContactError(null);
                      }}
                      className="w-full border border-foreground/25 bg-background px-2.5 py-2 text-[11px] font-mono uppercase tracking-wider hover:bg-foreground/5"
                    >
                      {isFr ? "Pre-remplir: demande de lien Stripe" : "Prefill: Stripe link request"}
                    </button>
                    <input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder={isFr ? "Nom" : "Name"}
                      className="w-full border border-foreground/20 bg-background px-2.5 py-2 text-xs outline-none focus:border-foreground/40"
                    />
                    <input
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder={isFr ? "Courriel" : "Email"}
                      type="email"
                      className="w-full border border-foreground/20 bg-background px-2.5 py-2 text-xs outline-none focus:border-foreground/40"
                    />
                    <textarea
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder={isFr ? "Votre besoin en 2-3 lignes" : "Your need in 2-3 lines"}
                      rows={3}
                      className="w-full border border-foreground/20 bg-background px-2.5 py-2 text-xs resize-y outline-none focus:border-foreground/40"
                    />
                    <button
                      type="submit"
                      disabled={contactStatus === "sending"}
                      className="w-full border border-foreground bg-foreground text-background px-2.5 py-2 text-xs font-mono uppercase tracking-wider disabled:opacity-50"
                    >
                      {contactStatus === "sending"
                        ? isFr
                          ? "Envoi..."
                          : "Sending..."
                        : isFr
                          ? "Envoyer"
                          : "Send"}
                    </button>
                    {contactStatus === "success" && (
                      <p className="text-[11px] text-emerald-600">
                        {isFr
                          ? "Message envoye. Vous recevez rapidement la prochaine etape, incluant le lien de paiement si demande."
                          : "Message sent. You will quickly receive next steps, including the payment link when requested."}
                      </p>
                    )}
                    {contactStatus === "error" && contactError && (
                      <p className="text-[11px] text-red-600">{contactError}</p>
                    )}
                  </form>
                </div>
              )}

              {showAssessmentCta && (
                <div className="border border-foreground/20 bg-foreground/[0.03] p-3">
                  <p className="text-xs font-mono uppercase tracking-wider text-foreground/60 mb-2">
                    {isFr ? "Action recommandee" : "Recommended action"}
                  </p>
                  <a
                    href={assessmentPath}
                    className="block w-full border border-foreground bg-foreground text-background px-3 py-2 text-center text-xs font-mono uppercase tracking-wider"
                  >
                    {isFr ? "Ouvrir l'evaluation gratuite" : "Open free assessment"}
                  </a>
                </div>
              )}

              {/* Typing indicator */}
              {isLoading &&
                messages.length > 0 &&
                messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="bg-foreground/5 px-4 py-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-foreground/30 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-foreground/30 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-foreground/30 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="px-4 pb-4 pt-2 shrink-0 border-t border-foreground/10"
            >
              <div className="flex items-end gap-2 bg-foreground/5 px-3 py-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isFr ? "Posez une question..." : "Ask a question..."
                  }
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 resize-none outline-none min-h-[36px] max-h-[100px] py-1.5"
                />
                <button
                  type="submit"
                  aria-label={isFr ? "Envoyer le message" : "Send message"}
                  title={isFr ? "Envoyer le message" : "Send message"}
                  disabled={!input.trim() || isLoading}
                  className="shrink-0 w-8 h-8 flex items-center justify-center bg-foreground text-background disabled:opacity-30 hover:opacity-80 transition-opacity"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                  </svg>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

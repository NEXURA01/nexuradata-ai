"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { LogoMark } from "@/components/Logo";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { locale },
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";
  const isFr = locale === "fr";

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

                  {/* Quick prompts */}
                  <div className="mt-6 flex flex-col gap-2 w-full">
                    {(isFr
                      ? [
                          "Que fait NEXURA exactement?",
                          "Combien coûte une évaluation?",
                          "Comment fonctionne l'automatisation?",
                        ]
                      : [
                          "What does NEXURA do exactly?",
                          "How much does an assessment cost?",
                          "How does the automation work?",
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
                  const text = message.parts
                    ?.filter(
                      (p): p is { type: "text"; text: string } =>
                        p.type === "text"
                    )
                    .map((p) => p.text)
                    .join("");

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
                        {text}
                      </div>
                    </div>
                  );
                })
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

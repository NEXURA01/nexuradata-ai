"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

export function ChatWidget() {
  const t = useTranslations("chat");
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, input, setInput, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { locale },
    }),
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status !== "streaming") {
      sendMessage({ text: input });
      setInput("");
    }
  };

  const getMessageText = (msg: (typeof messages)[0]): string => {
    if (!msg.parts || !Array.isArray(msg.parts)) return "";
    return msg.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
  };

  return (
    <>
      {/* Toggle Button - technical, no rounding */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-foreground text-background flex items-center gap-2 hover:bg-accent transition-colors"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        <span className="font-mono text-xs uppercase tracking-wider">
          {isOpen ? "CLOSE" : "ASK"}
        </span>
        {!isOpen && (
          <span className="w-2 h-2 bg-accent animate-pulse" />
        )}
      </button>

      {/* Chat Panel - technical frame style */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-[340px] max-h-[480px] bg-background border border-foreground/15 shadow-xl flex flex-col overflow-hidden">
          {/* Header - technical reference */}
          <div className="px-4 py-3 border-b border-foreground/10 flex items-center justify-between">
            <div>
              <span className="ref-number block">NXR · ASSIST</span>
              <span className="font-serif text-sm">{t("title")}</span>
            </div>
            <span className="ref-number opacity-50">v0.1</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] technical-grid">
            {messages.length === 0 && (
              <div className="text-dense text-muted-foreground">{t("greeting")}</div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 text-dense ${
                    msg.role === "user"
                      ? "bg-foreground text-background"
                      : "border border-foreground/10 bg-surface"
                  }`}
                >
                  {getMessageText(msg)}
                </div>
              </div>
            ))}
            {status === "streaming" && (
              <div className="flex justify-start">
                <div className="border border-foreground/10 bg-surface px-3 py-2">
                  <span className="ref-number animate-pulse">PROCESSING...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input - stark */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-foreground/10">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("placeholder")}
                className="flex-1 px-3 py-2 bg-surface border border-foreground/10 text-dense font-mono focus:outline-none focus:border-accent"
                disabled={status === "streaming"}
              />
              <button
                type="submit"
                disabled={!input.trim() || status === "streaming"}
                className="px-3 py-2 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-30"
              >
                SEND
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

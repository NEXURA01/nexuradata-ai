"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputBody,
  PromptInputFooter,
} from "@/components/ai-elements/prompt-input";
import { LogoMark } from "@/components/Logo";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const locale = useLocale();

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { locale },
    }),
  });

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text?.trim()) return;
    sendMessage({ text: message.text });
    setInput("");
  };

  const isFr = locale === "fr";

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-foreground text-background rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <LogoMark size={26} />
        )}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px] bg-background border-2 border-foreground/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-foreground/10 flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 bg-foreground rounded-full flex items-center justify-center shrink-0">
                <LogoMark size={18} className="text-background" />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-base font-semibold text-foreground leading-tight">
                  Nexura
                </h3>
                <p className="text-[11px] text-foreground/50 font-mono uppercase tracking-wider">
                  {isFr ? "Assistant IA" : "AI Assistant"}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-foreground/40 font-mono">
                  {isFr ? "En ligne" : "Online"}
                </span>
              </div>
            </div>

            {/* Conversation */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <Conversation>
                <ConversationContent className="px-4 py-4">
                  {messages.length === 0 ? (
                    <ConversationEmptyState
                      title={isFr ? "Bonjour" : "Hello"}
                      description={
                        isFr
                          ? "Posez-moi une question sur nos services, tarifs ou comment NEXURA peut aider votre entreprise."
                          : "Ask me about our services, pricing, or how NEXURA can help your company."
                      }
                    />
                  ) : (
                    messages.map((message) => (
                      <Message from={message.role} key={message.id}>
                        <MessageContent>
                          {message.parts.map((part, i) => {
                            switch (part.type) {
                              case "text":
                                return (
                                  <MessageResponse key={`${message.id}-${i}`}>
                                    {part.text}
                                  </MessageResponse>
                                );
                              default:
                                return null;
                            }
                          })}
                        </MessageContent>
                      </Message>
                    ))
                  )}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-1 shrink-0">
              <PromptInput
                onSubmit={handleSubmit}
                className="border border-foreground/15 rounded-xl"
              >
                <PromptInputBody>
                  <PromptInputTextarea
                    value={input}
                    placeholder={
                      isFr
                        ? "Posez une question..."
                        : "Ask a question..."
                    }
                    onChange={(e) => setInput(e.currentTarget.value)}
                    className="text-sm min-h-[40px] max-h-[100px]"
                  />
                </PromptInputBody>
                <PromptInputFooter className="justify-end px-2 pb-1">
                  <PromptInputSubmit
                    status={status === "streaming" ? "streaming" : "ready"}
                    disabled={!input.trim()}
                  />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import { createHash } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{8,120}$/;
const MAX_PROMPT_PREVIEW_CHARS = 500;

type ChatAttempt = {
  request: Request;
  sessionToken: string | null;
  locale: "en" | "fr";
  outcome: "accepted" | "rejected";
  errorCode?: string;
  latestUserMessage: string;
  messageCount: number;
  totalChars: number;
};

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-vercel-forwarded-for") ||
    forwardedFor ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function hashClientIp(req: Request) {
  const secret = process.env.ACCESS_CODE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "nexura-chat";
  return createHash("sha256").update(`${secret}:${getClientIp(req)}`).digest("hex");
}

function normalizePromptPreview(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_PROMPT_PREVIEW_CHARS);
}

export function normalizeSessionToken(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const sessionToken = value.trim().slice(0, 120);
  return SESSION_TOKEN_PATTERN.test(sessionToken) ? sessionToken : null;
}

export async function recordChatAttempt(attempt: ChatAttempt) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return;
  }

  const occurredAt = new Date().toISOString();
  const userAgent = (attempt.request.headers.get("user-agent") || "").slice(0, 300) || null;
  const ipHash = hashClientIp(attempt.request);
  const promptPreview = normalizePromptPreview(attempt.latestUserMessage || "");

  try {
    if (attempt.sessionToken) {
      const { error: sessionError } = await supabase.from("chat_sessions").upsert(
        {
          session_token: attempt.sessionToken,
          locale: attempt.locale,
          first_ip_hash: ipHash,
          user_agent: userAgent,
          last_seen_at: occurredAt,
        },
        { onConflict: "session_token" },
      );

      if (sessionError) {
        console.error("chat session storage error:", sessionError);
      }
    }

    const { error: eventError } = await supabase.from("chat_events").insert({
      session_token: attempt.sessionToken,
      locale: attempt.locale,
      outcome: attempt.outcome,
      error_code: attempt.errorCode || null,
      prompt_preview: promptPreview || null,
      message_count: attempt.messageCount,
      total_chars: attempt.totalChars,
      ip_hash: ipHash,
      user_agent: userAgent,
      created_at: occurredAt,
    });

    if (eventError) {
      console.error("chat event storage error:", eventError);
    }
  } catch (error) {
    console.error("chat storage error:", error);
  }
}
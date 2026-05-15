import {
  createClient,
  type RealtimePostgresInsertPayload,
  type SupabaseClient,
} from "@supabase/supabase-js";

export type ChatThread = {
  id: string;
  title: string | null;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type ThreadSummary = {
  thread_id: string;
  summary: string;
  message_count: number;
  generated_at: string;
  generated_by: string | null;
};

let browserClient: SupabaseClient | null = null;

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
}

function getSupabaseAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY
  );
}

function getClient() {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase public environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}

export async function upsertChatProfile() {
  const supabase = getClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    throw new Error("Not signed in");
  }

  const { error } = await supabase.from("chat_users").upsert({
    id: auth.user.id,
    username: auth.user.email?.split("@")[0] ?? `user_${auth.user.id.slice(0, 8)}`,
    display_name: auth.user.user_metadata?.full_name ?? null,
    avatar_url: auth.user.user_metadata?.avatar_url ?? null,
  });

  if (error) {
    throw error;
  }
}

export async function getCurrentUserId() {
  const supabase = getClient();
  const { data: auth } = await supabase.auth.getUser();
  return auth.user?.id ?? null;
}

export async function listUserThreads(limit = 25) {
  const supabase = getClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    throw new Error("Not signed in");
  }

  const { data, error } = await supabase
    .from("chat_threads")
    .select("id, title, created_at")
    .eq("created_by", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as ChatThread[];
}

export async function createThread(title?: string) {
  const supabase = getClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    throw new Error("Not signed in");
  }

  const { data: thread, error: threadError } = await supabase
    .from("chat_threads")
    .insert({
      title: title ?? null,
      created_by: auth.user.id,
    })
    .select("id, title, created_at")
    .single<ChatThread>();

  if (threadError) {
    throw threadError;
  }

  const { error: memberError } = await supabase.from("chat_thread_members").insert({
    thread_id: thread.id,
    user_id: auth.user.id,
  });

  if (memberError) {
    throw memberError;
  }

  return thread;
}

export async function addMember(threadId: string, userId: string) {
  const supabase = getClient();

  const { error } = await supabase.from("chat_thread_members").insert({
    thread_id: threadId,
    user_id: userId,
  });

  if (error) {
    throw error;
  }
}

export async function sendMessage(threadId: string, content: string) {
  const supabase = getClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    throw new Error("Not signed in");
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: threadId,
      sender_id: auth.user.id,
      content,
    })
    .select("id, thread_id, sender_id, content, created_at")
    .single<ChatMessage>();

  if (error) {
    throw error;
  }

  return data;
}

export async function getMessages(threadId: string) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, thread_id, sender_id, content, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ChatMessage[];
}

export function subscribeToMessages(
  threadId: string,
  onMessage: (payload: RealtimePostgresInsertPayload<ChatMessage>) => void
) {
  const supabase = getClient();
  const channel = supabase
    .channel(`thread:${threadId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => onMessage(payload as RealtimePostgresInsertPayload<ChatMessage>)
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function summarizeThread(threadId: string, maxMessages = 100) {
  const supabase = getClient();
  const { data, error } = await supabase.functions.invoke("summarize-thread", {
    body: { thread_id: threadId, max_messages: maxMessages },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function getThreadSummary(threadId: string) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from("thread_summaries")
    .select("thread_id, summary, message_count, generated_at, generated_by")
    .eq("thread_id", threadId)
    .maybeSingle<ThreadSummary>();

  if (error) {
    throw error;
  }

  return data;
}

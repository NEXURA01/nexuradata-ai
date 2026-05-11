const additionalContext = [
  "NEXURADATA DATABASE POLICY",
  "",
  "Current direction: Supabase replaces Neon.",
  "Treat existing Neon references as legacy migration context only.",
  "Do not add new Neon dependencies, Neon workflows, DATABASE_URL-based integration, or migrations/neon changes except explicit cleanup/removal.",
  "Use Supabase CLI plus supabase/ migrations and seed workflow for database work.",
  "Never expose Supabase access tokens, service-role keys, database URLs, Stripe/Resend secrets, or webhook secrets in chat, logs, committed files, or terminal commands.",
  "If a Supabase token is pasted into chat, consider it compromised and advise rotation."
].join("\n");

console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext
  }
}));

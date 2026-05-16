"use client";

import { FormEvent, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export function EmployeeLoginForm() {
  const locale = useLocale();
  const isFr = locale === "fr";
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/employe/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setError(
          isFr
            ? "Connexion impossible. Vérifiez vos identifiants."
            : "Unable to sign in. Check your credentials.",
        );
        return;
      }

      router.refresh();
    } catch {
      setError(
        isFr
          ? "Erreur réseau. Réessayez dans quelques secondes."
          : "Network error. Please try again in a few seconds.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--noir)] px-6 pb-24 pt-36 text-[var(--os)] md:px-8">
      <div className="mx-auto max-w-[760px] border border-accent/20 bg-surface p-8 md:p-12">
        <p className="mb-5 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
          EMPLOYE
        </p>
        <h1 className="max-w-[14ch] font-serif text-[clamp(2.6rem,7vw,5.8rem)] leading-[0.9] text-[var(--os)]">
          {isFr ? "Connexion KPI interne." : "Internal KPI sign in."}
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground/70">
          {isFr
            ? "Accès réservé à l'équipe. Connectez-vous avec votre compte employé pour ouvrir les opérations."
            : "Team-only access. Sign in with your employee account to open operations."}
        </p>

        <form onSubmit={handleSubmit} className="mt-9 grid gap-5" noValidate>
          <label className="grid gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/60">
              {isFr ? "Courriel" : "Email"}
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full border border-foreground/15 bg-[var(--noir)] px-4 py-3 text-base text-[var(--os)] outline-none transition-colors focus:border-accent"
            />
          </label>

          <label className="grid gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/60">
              {isFr ? "Mot de passe" : "Password"}
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full border border-foreground/15 bg-[var(--noir)] px-4 py-3 text-base text-[var(--os)] outline-none transition-colors focus:border-accent"
            />
          </label>

          {error ? (
            <p className="border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 border-y border-accent/80 px-1 py-4 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? isFr
                ? "Connexion..."
                : "Signing in..."
              : isFr
                ? "Ouvrir l'espace KPI"
                : "Open KPI workspace"}
          </button>
        </form>
      </div>
    </main>
  );
}

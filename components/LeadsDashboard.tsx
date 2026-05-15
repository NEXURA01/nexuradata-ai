"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface DashboardStats {
  date: string;
  leads_sent: number;
  leads_responded: number;
  leads_qualified: number;
  leads_booked: number;
  conversion_rate?: number;
}

export function LeadsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_daily_stats" }),
      });
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Stats fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const startDailyRun = async () => {
    setIsRunning(true);
    try {
      const res = await fetch("/api/leads/run-daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      alert(
        `✓ Started: ${data.leads_queued} leads queued for outreach today`
      );
      fetchStats();
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  if (loading) return <div>Loading stats...</div>;

  return (
    <main className="min-h-screen bg-noir px-6 pb-24 pt-20 text-os md:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-serif mb-2">Lead Outreach Dashboard</h1>
          <p className="text-muted">
            Real-time automation for landscaping + window cleaning leads
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 mb-8 md:grid-cols-4">
          {[
            {
              label: "Leads Sent",
              value: stats?.leads_sent || 0,
              color: "accent",
            },
            {
              label: "Responses",
              value: stats?.leads_responded || 0,
              color: "green-500",
            },
            {
              label: "Qualified",
              value: stats?.leads_qualified || 0,
              color: "blue-500",
            },
            {
              label: "Booked",
              value: stats?.leads_booked || 0,
              color: "purple-500",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="border border-foreground/10 bg-surface p-6"
            >
              <p className="mb-2 text-sm uppercase tracking-widest text-muted">
                {stat.label}
              </p>
              <p className={`text-4xl font-mono font-bold text-${stat.color}`}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Conversion Funnel */}
        <div className="mb-8 border border-foreground/10 bg-surface p-8">
          <h2 className="mb-6 text-2xl font-serif">Conversion Funnel</h2>
          <div className="space-y-4">
            {[
              {
                stage: "Sent",
                value: stats?.leads_sent || 0,
                pct: 100,
              },
              {
                stage: "Responded",
                value: stats?.leads_responded || 0,
                pct: stats?.leads_sent
                  ? Math.round(
                      ((stats.leads_responded || 0) / stats.leads_sent) * 100
                    )
                  : 0,
              },
              {
                stage: "Qualified",
                value: stats?.leads_qualified || 0,
                pct: stats?.leads_responded
                  ? Math.round(
                      ((stats.leads_qualified || 0) / stats.leads_responded) *
                        100
                    )
                  : 0,
              },
              {
                stage: "Booked",
                value: stats?.leads_booked || 0,
                pct: stats?.leads_qualified
                  ? Math.round(
                      ((stats.leads_booked || 0) / stats.leads_qualified) * 100
                    )
                  : 0,
              },
            ].map((item, i) => (
              <div key={i}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-mono uppercase tracking-wider">
                    {item.stage}
                  </span>
                  <span className="text-accent">
                    {item.value} ({item.pct}%)
                  </span>
                </div>
                <div className="h-2 bg-foreground/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-accent"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Control Panel */}
        <div className="border border-accent/20 bg-surface p-8">
          <h2 className="mb-6 text-2xl font-serif">Daily Automation Control</h2>
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Trigger today's outreach sequence: 40 leads, 70% WhatsApp + 30%
              SMS, rate-limited to 5-6/hour
            </p>
            <button
              onClick={startDailyRun}
              disabled={isRunning}
              className="border-y border-accent px-1 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-foreground transition-all hover:border-foreground disabled:opacity-50"
            >
              {isRunning ? "▶ Running..." : "▶ Start Daily Outreach"}
            </button>
            <p className="text-xs text-muted">
              Last run: Today at{" "}
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useTranslations } from "next-intl";

export function PortalContent() {
  const t = useTranslations("portal");
  const sections = t.raw("sections") as Record<string, string>;

  // Mock data - in production this would come from Supabase
  const mockData = {
    status: "In Review",
    estimate: {
      complexity: "Medium",
      scope: "Workflow automation + dashboard",
      range: "$5,000 - $15,000",
    },
    payment: "Paid - $250 CAD",
    timeline: [
      { date: "May 12, 2026", event: "Assessment submitted" },
      { date: "May 12, 2026", event: "Payment confirmed" },
      { date: "May 13-14", event: "Human review (pending)" },
    ],
    actions: ["Wait for review completion", "Check email for updates"],
  };

  return (
    <main className="min-h-screen pt-20 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="ref-number mb-4">NXR · PORTAL</div>
          <h1 className="heading-austere text-4xl md:text-5xl text-foreground">
            {t("title")}
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Assessment Status */}
          <div className="border border-border bg-surface p-6">
            <div className="ref-number mb-4 text-muted-foreground">
              {sections.status}
            </div>
            <div className="font-serif text-2xl text-accent">{mockData.status}</div>
          </div>

          {/* Payment Status */}
          <div className="border border-border bg-surface p-6">
            <div className="ref-number mb-4 text-muted-foreground">
              {sections.payment}
            </div>
            <div className="font-serif text-xl text-foreground">
              {mockData.payment}
            </div>
          </div>

          {/* AI Estimate */}
          <div className="border border-border bg-surface p-6 md:col-span-2">
            <div className="ref-number mb-4 text-muted-foreground">
              {sections.estimate}
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Complexity
                </div>
                <div className="font-serif text-lg">{mockData.estimate.complexity}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Scope
                </div>
                <div className="font-serif text-lg">{mockData.estimate.scope}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Range
                </div>
                <div className="font-serif text-lg text-accent">
                  {mockData.estimate.range}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="border border-border bg-surface p-6">
            <div className="ref-number mb-4 text-muted-foreground">
              {sections.timeline}
            </div>
            <div className="space-y-3">
              {mockData.timeline.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="ref-number w-24 flex-shrink-0">{item.date}</div>
                  <div className="text-dense">{item.event}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Actions */}
          <div className="border border-border bg-surface p-6">
            <div className="ref-number mb-4 text-muted-foreground">
              {sections.actions}
            </div>
            <ul className="space-y-2">
              {mockData.actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-accent mt-2 flex-shrink-0" />
                  <span className="text-dense">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

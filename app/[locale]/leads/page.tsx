import { LeadsDashboard } from "@/components/LeadsDashboard";

export const metadata = {
  title: "Lead Outreach Dashboard",
  description: "Real-time landscaping & window cleaning lead automation",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LeadsPage() {
  return <LeadsDashboard />;
}

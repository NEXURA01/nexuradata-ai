import {
  CampaignPlanDay,
  CampaignIndustryKey,
  LeadContact,
  buildCampaignEmail,
  sendMailgunEmail,
} from "./email-campaign";

type OutreachResult = {
  sent: number;
  failed: number;
  results: Array<{
    leadId: string;
    channel: "email";
    success: boolean;
    email?: string;
    region: string;
    industry: string;
  }>;
};

export async function sendOutreachSequence(
  leads: LeadContact[],
  plan: CampaignPlanDay,
  industry: CampaignIndustryKey
): Promise<OutreachResult> {
  const results: OutreachResult["results"] = [];
  let sent = 0;
  let failed = 0;

  for (const lead of leads) {
    if (!lead.email) {
      failed += 1;
      results.push({
        leadId: lead.id,
        channel: "email",
        success: false,
        region: plan.region,
        industry,
      });
      continue;
    }

    const draft = buildCampaignEmail({ lead, plan, industry });
    const result = await sendMailgunEmail({
      to: lead.email,
      subject: draft.subject,
      text: draft.text,
      html: draft.html,
    });

    if (result.success) {
      sent += 1;
      results.push({
        leadId: lead.id,
        channel: "email",
        success: true,
        email: lead.email,
        region: draft.region,
        industry: draft.industryLabel,
      });
    } else {
      failed += 1;
      results.push({
        leadId: lead.id,
        channel: "email",
        success: false,
        email: lead.email,
        region: draft.region,
        industry: draft.industryLabel,
      });
    }
  }

  return { sent, failed, results };
}

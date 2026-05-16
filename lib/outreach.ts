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

const OUTREACH_CONCURRENCY = 5;
const CONTACTABLE_STATUS = new Set(["new", "contacted"]);

const normalizeEmail = (email: string | null | undefined) =>
  (email || "").trim().toLowerCase();

const normalizePhone = (phone: string | null | undefined) =>
  (phone || "").replace(/\D/g, "");

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const outputs: R[] = new Array(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;

      if (index >= items.length) {
        return;
      }

      outputs[index] = await worker(items[index], index);
    }
  });

  await Promise.all(workers);
  return outputs;
}

export async function sendOutreachSequence(
  leads: LeadContact[],
  plan: CampaignPlanDay,
  industry: CampaignIndustryKey
): Promise<OutreachResult> {
  const results: OutreachResult["results"] = [];
  const seenLeadIds = new Set<string>();
  const seenEmails = new Set<string>();

  const dedupedLeads = leads.filter((lead) => {
    const email = normalizeEmail(lead.email);

    if (seenLeadIds.has(lead.id)) {
      return false;
    }

    if (email && seenEmails.has(email)) {
      return false;
    }

    seenLeadIds.add(lead.id);
    if (email) {
      seenEmails.add(email);
    }

    return true;
  });

  const perLeadResults = await runWithConcurrency(
    dedupedLeads,
    OUTREACH_CONCURRENCY,
    async (lead): Promise<OutreachResult["results"][number]> => {
      const email = normalizeEmail(lead.email);
      const phone = normalizePhone(lead.phone);
      const consentStatus = (lead.consent_status || "").toLowerCase();
      const status = (lead.status || "new").toLowerCase();

      if (
        lead.do_not_contact ||
        consentStatus === "opted_out" ||
        !phone ||
        !CONTACTABLE_STATUS.has(status)
      ) {
        return {
          leadId: lead.id,
          channel: "email",
          success: false,
          email: email || undefined,
          region: plan.region,
          industry,
        };
      }

      if (!email) {
        return {
          leadId: lead.id,
          channel: "email",
          success: false,
          region: plan.region,
          industry,
        };
      }

      const draft = buildCampaignEmail({ lead, plan, industry });

      try {
        const sendResult = await sendMailgunEmail({
          to: email,
          subject: draft.subject,
          text: draft.text,
          html: draft.html,
          template: draft.template,
          templateVariables: draft.templateVariables,
        });

        return {
          leadId: lead.id,
          channel: "email",
          success: sendResult.success,
          email,
          region: draft.region,
          industry: draft.industryLabel,
        };
      } catch {
        return {
          leadId: lead.id,
          channel: "email",
          success: false,
          email,
          region: draft.region,
          industry: draft.industryLabel,
        };
      }
    }
  );

  results.push(...perLeadResults);

  const sent = results.filter((item) => item.success).length;
  const failed = results.length - sent;

  return { sent, failed, results };
}

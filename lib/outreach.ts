import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || "";
const TWILIO_SMS_NUMBER = process.env.TWILIO_SMS_NUMBER || "";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const messageTemplates = {
  whatsapp_intro: (name: string, calendlyUrl: string) => `👋 Salut ${name},

Rapide question: Tu délègues actuellement la maintenance de ta propriété?

40% des entrepreneurs disent que c'est leur plus grand time-waster. On récupère 3-4h/mois juste avec paysage + vitres.

Ça te parle? → ${calendlyUrl}

— NEXURA Team`,

  whatsapp_followup: (calendlyUrl: string) => `📸 Regarde ce qu'on fait en une semaine.

Tes clients verront la différence. Intéressé?

${calendlyUrl}`,

  sms_confirm: (name: string) => `Hi ${name}, confirm interest or we'll remove you. Reply YES or go here: ${BASE_URL}/confirm-interest`,
};

export async function sendWhatsAppMessage(
  toPhone: string,
  message: string,
  leadId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Format phone: +1234567890
    const formattedPhone = toPhone.startsWith("+") ? toPhone : `+1${toPhone}`;

    const result = await twilioClient.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedPhone}`,
      body: message,
    });

    // Log interaction
    await fetch(`${BASE_URL}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "log_interaction",
        lead_id: leadId,
        interaction_type: "whatsapp_sent",
        status: "sent",
        message_preview: message.substring(0, 100),
        metadata: { twilio_sid: result.sid },
      }),
    });

    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return { success: false, error: String(error) };
  }
}

export async function sendSmsMessage(
  toPhone: string,
  message: string,
  leadId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const formattedPhone = toPhone.startsWith("+") ? toPhone : `+1${toPhone}`;

    const result = await twilioClient.messages.create({
      from: TWILIO_SMS_NUMBER,
      to: formattedPhone,
      body: message,
    });

    // Log interaction
    await fetch(`${BASE_URL}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "log_interaction",
        lead_id: leadId,
        interaction_type: "sms_sent",
        status: "sent",
        message_preview: message.substring(0, 100),
        metadata: { twilio_sid: result.sid },
      }),
    });

    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error("SMS send error:", error);
    return { success: false, error: String(error) };
  }
}

export async function sendOutreachSequence(
  leads: any[],
  calendlyUrl: string
): Promise<{
  sent: number;
  failed: number;
  results: Array<{ leadId: string; channel: string; success: boolean }>;
}> {
  const results = [];
  let sent = 0;
  let failed = 0;

  // Distribute: 70% WhatsApp, 30% SMS
  const whatsappCount = Math.ceil(leads.length * 0.7);

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const useWhatsApp = i < whatsappCount;

    if (useWhatsApp) {
      const message = messageTemplates.whatsapp_intro(
        lead.name.split(" ")[0],
        calendlyUrl
      );
      const result = await sendWhatsAppMessage(lead.phone, message, lead.id);

      if (result.success) {
        sent++;
        results.push({ leadId: lead.id, channel: "whatsapp", success: true });
      } else {
        failed++;
        results.push({
          leadId: lead.id,
          channel: "whatsapp",
          success: false,
        });
      }
    } else {
      const message = messageTemplates.sms_confirm(lead.name.split(" ")[0]);
      const result = await sendSmsMessage(lead.phone, message, lead.id);

      if (result.success) {
        sent++;
        results.push({ leadId: lead.id, channel: "sms", success: true });
      } else {
        failed++;
        results.push({ leadId: lead.id, channel: "sms", success: false });
      }
    }

    // Rate limiting: 5-6 per hour = 1 every ~10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }

  return { sent, failed, results };
}

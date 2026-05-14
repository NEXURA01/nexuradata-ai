import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendTeamPaymentStartedEmail } from "@/lib/server-email";
import { guardPublicPost, jsonWithSecurity } from "@/lib/request-guard";

const PRODUCTS = {
  "operational-review": {
    name: "Operational Review",
    nameFr: "Revue opérationnelle",
    description: "Human review + detailed recommendations",
    descriptionFr: "Revue humaine + recommandations détaillées",
    priceInCents: 25000,
  },
};

const isValidEmail = (value: unknown) => {
  const email = typeof value === "string" ? value.trim() : "";
  if (email.length < 5 || email.length > 254 || /\s/.test(email)) return false;
  const at = email.indexOf("@");
  const lastDot = email.lastIndexOf(".");
  return at > 0 && lastDot > at + 1 && lastDot < email.length - 1;
};

const normalizeText = (value: unknown, maxLength = 500) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";

const getBaseUrl = () => {
  const explicit = normalizeText(process.env.NEXT_PUBLIC_BASE_URL || process.env.PUBLIC_SITE_ORIGIN, 240);
  if (explicit) return explicit.replace(/\/$/, "");

  const vercelUrl = normalizeText(process.env.VERCEL_URL, 240);
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, "")}`;

  return "https://nexuradata.ca";
};

export async function POST(req: Request) {
  const guarded = guardPublicPost(req, { namespace: "stripe-checkout", maxRequests: 3 });

  if (guarded) {
    return guarded;
  }

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

    if (!stripeSecretKey) {
      return jsonWithSecurity({ error: "Stripe is not configured" }, { status: 503 });
    }

    if (!supabaseUrl || !supabaseKey) {
      return jsonWithSecurity({ error: "Payment storage is not configured" }, { status: 503 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json().catch(() => ({}));
    const productId = normalizeText(body.productId, 80);
    const email = normalizeText(body.email, 220).toLowerCase();
    const locale = normalizeText(body.locale, 12) === "en" ? "en" : "fr";

    if (!isValidEmail(email)) {
      return jsonWithSecurity({ error: "Invalid email" }, { status: 400 });
    }

    const product = PRODUCTS[productId as keyof typeof PRODUCTS];
    if (!product) {
      return jsonWithSecurity({ error: "Invalid product" }, { status: 400 });
    }

    const isFr = locale === "fr";
    const baseUrl = getBaseUrl();

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: isFr ? product.nameFr : product.name,
              description: isFr ? product.descriptionFr : product.description,
            },
            unit_amount: product.priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/${locale}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/${locale}/operational-assessment`,
      metadata: {
        productId,
        locale,
        customerEmail: email,
      },
    });

    const amount = (product.priceInCents / 100).toLocaleString(locale === "fr" ? "fr-CA" : "en-CA", {
      style: "currency",
      currency: "CAD",
    });

    const { error: storageError } = await supabase.from("payment_sessions").upsert({
      stripe_session_id: session.id,
      customer_email: email,
      product_id: productId,
      locale,
      amount_total: product.priceInCents,
      currency: "cad",
      status: "created",
      checkout_url: session.url,
      metadata: {
        productName: isFr ? product.nameFr : product.name,
      },
    }, { onConflict: "stripe_session_id" });

    if (storageError) {
      console.error("Payment session storage error:", storageError);
      return jsonWithSecurity({ error: "Payment storage failed" }, { status: 503 });
    }

    const teamDelivery = await sendTeamPaymentStartedEmail({
      email,
      locale,
      checkoutUrl: session.url,
      productName: isFr ? product.nameFr : product.name,
      amount,
      sessionId: session.id,
    }, req);

    return jsonWithSecurity({
      url: session.url,
      sessionId: session.id,
      delivery: {
        team: teamDelivery.sent ? "sent" : teamDelivery.reason,
      },
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return jsonWithSecurity({ error: "Failed to create checkout session" }, { status: 500 });
  }
}

import Stripe from "stripe";
import {
  sendClientPaymentLinkEmail,
  sendTeamPaymentStartedEmail,
} from "@/lib/server-email";
import { guardPublicPost, jsonWithSecurity } from "@/lib/request-guard";

const PRODUCTS = {
  "operational-review": {
    name: "Operational Review",
    nameFr: "Revue opérationnelle",
    description: "Human review + detailed recommendations",
    descriptionFr: "Revue humaine + recommandations détaillées",
    priceInCents: 25000, // $250 CAD
  },
};

const isValidEmail = (value: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(`${value || ""}`);

export async function POST(req: Request) {
  const guarded = guardPublicPost(req, { namespace: "stripe-checkout", maxRequests: 8 });

  if (guarded) {
    return guarded;
  }

  try {
    const stripeSecretKey =
      process.env.STRIPE_SECRET_KEY ||
      process.env.NEXURA_STRIPE_SECRET_KEY ||
      process.env.nexadura_STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return jsonWithSecurity(
        { error: "Stripe is not configured" },
        { status: 503 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const { productId, email, locale } = await req.json();

    if (!isValidEmail(email)) {
      return jsonWithSecurity({ error: "Invalid email" }, { status: 400 });
    }

    const product = PRODUCTS[productId as keyof typeof PRODUCTS];
    if (!product) {
      return jsonWithSecurity({ error: "Invalid product" }, { status: 400 });
    }

    const isFr = locale === "fr";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://nexuradata.ca";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
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

    const paymentPayload = {
      email,
      locale,
      checkoutUrl: session.url,
      productName: isFr ? product.nameFr : product.name,
      amount: "$250 CAD",
      sessionId: session.id,
    };
    const [clientDelivery, teamDelivery] = await Promise.allSettled([
      sendClientPaymentLinkEmail(paymentPayload, req),
      sendTeamPaymentStartedEmail(paymentPayload, req),
    ]);

    return jsonWithSecurity({
      url: session.url,
      delivery: {
        client: clientDelivery.status === "fulfilled"
          ? (clientDelivery.value.sent ? "sent" : clientDelivery.value.reason)
          : "notification-error",
        team: teamDelivery.status === "fulfilled"
          ? (teamDelivery.value.sent ? "sent" : teamDelivery.value.reason)
          : "notification-error",
      },
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return jsonWithSecurity(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

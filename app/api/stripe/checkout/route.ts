import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRODUCTS = {
  "operational-review": {
    name: "Operational Review",
    nameFr: "Revue opérationnelle",
    description: "Human review + detailed recommendations",
    descriptionFr: "Revue humaine + recommandations détaillées",
    priceInCents: 25000, // $250 CAD
  },
};

export async function POST(req: Request) {
  try {
    const { productId, email, locale } = await req.json();

    const product = PRODUCTS[productId as keyof typeof PRODUCTS];
    if (!product) {
      return Response.json({ error: "Invalid product" }, { status: 400 });
    }

    const isFr = locale === "fr";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://nexura.ai";

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
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return Response.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

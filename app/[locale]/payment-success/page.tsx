import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PaymentSuccessContent } from "@/components/PaymentSuccessContent";
import { buildPageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata("payment-success", locale);
}

export default async function PaymentSuccessPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PaymentSuccessContent />;
}

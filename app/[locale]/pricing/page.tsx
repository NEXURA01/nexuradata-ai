import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PricingContent } from "@/components/PricingContent";
import { buildPageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata("pricing", locale);
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PricingContent />;
}

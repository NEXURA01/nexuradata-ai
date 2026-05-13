import { setRequestLocale } from "next-intl/server";
import { PricingContent } from "@/components/PricingContent";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PricingContent />;
}

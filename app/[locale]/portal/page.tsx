import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PortalContent } from "@/components/PortalContent";
import { buildPageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata("portal", locale);
}

export default async function PortalPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PortalContent />;
}

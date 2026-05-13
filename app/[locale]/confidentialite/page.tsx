import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPageContent } from "@/components/LegalPageContent";
import { buildPageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata("confidentialite", locale);
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalPageContent pageKey="privacy" />;
}

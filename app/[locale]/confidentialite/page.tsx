import { setRequestLocale } from "next-intl/server";
import { LegalPageContent } from "@/components/LegalPageContent";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalPageContent pageKey="privacy" />;
}

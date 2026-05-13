import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { EvaluationContent } from "@/components/EvaluationContent";
import { buildPageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata("evaluation", locale);
}

export default async function EvaluationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <EvaluationContent />;
}

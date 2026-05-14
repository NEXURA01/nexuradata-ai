import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AssessmentForm } from "@/components/AssessmentForm";
import { buildPageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata("operational-assessment", locale);
}

export default async function OperationalAssessmentPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AssessmentForm />;
}

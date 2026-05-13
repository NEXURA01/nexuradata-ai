import { setRequestLocale } from "next-intl/server";
import { EvaluationContent } from "@/components/EvaluationContent";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function EvaluationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <EvaluationContent />;
}

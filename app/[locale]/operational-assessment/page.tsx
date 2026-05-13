import { setRequestLocale } from "next-intl/server";
import { AssessmentForm } from "@/components/AssessmentForm";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function OperationalAssessmentPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AssessmentForm />;
}

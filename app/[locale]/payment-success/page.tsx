import { setRequestLocale } from "next-intl/server";
import { PaymentSuccessContent } from "@/components/PaymentSuccessContent";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PaymentSuccessPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PaymentSuccessContent />;
}

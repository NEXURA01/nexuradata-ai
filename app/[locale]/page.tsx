import { setRequestLocale } from "next-intl/server";
import { HomePage } from "@/components/HomePage";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomePage />;
}

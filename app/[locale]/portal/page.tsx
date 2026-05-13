import { setRequestLocale } from "next-intl/server";
import { PortalContent } from "@/components/PortalContent";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PortalPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PortalContent />;
}

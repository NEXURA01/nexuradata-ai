import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { EmployeeAccessContent } from "@/components/EmployeeAccessContent";
import { buildPageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata("employe", locale);
}

export default async function EmployePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <EmployeeAccessContent />;
}

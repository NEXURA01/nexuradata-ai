import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { EmployeeAccessContent } from "@/components/EmployeeAccessContent";
import { EmployeeLoginForm } from "@/components/EmployeeLoginForm";
import { buildPageMetadata } from "@/lib/seo";
import { getEmployeContext } from "@/lib/employe-role";

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

  const context = await getEmployeContext();

  if (!context) {
    return <EmployeeLoginForm />;
  }

  return <EmployeeAccessContent role={context.role} />;
}

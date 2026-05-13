import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { HeroSection } from "@/components/HeroSection";
import { ServicesSection } from "@/components/ServicesSection";
import { CTASection } from "@/components/CTASection";
import { NewsletterSection } from "@/components/NewsletterSection";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HeroSection />
      <ServicesSection />
      <CTASection />
      <NewsletterSection />
    </>
  );
}

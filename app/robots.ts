import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/fr/portal",
          "/en/portal",
          "/fr/payment-success",
          "/en/payment-success",
          "/fr/employe",
          "/en/employe",
          "/fr/leads",
          "/en/leads",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nexura",
    short_name: "Nexura",
    description: "Operational intelligence infrastructure for modern companies.",
    lang: "fr-CA",
    start_url: "/fr",
    scope: "/",
    display: "standalone",
    background_color: "#080806",
    theme_color: "#080806",
    icons: [
      {
        src: "/assets/icons/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/assets/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

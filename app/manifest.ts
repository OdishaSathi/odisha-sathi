import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/siteConfig";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.siteName,
    short_name: "Odisha Sathi",
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b63ce",
    icons: [
      {
        src: "/odisha-sathi-logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/odisha-sathi-logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

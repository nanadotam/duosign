import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://duosign.nanaamoako.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/dev", "/settings", "/history", "/auth/"] }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}

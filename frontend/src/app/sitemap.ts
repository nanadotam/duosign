import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://duosign.nanaamoako.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/translate`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/research`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/get-involved`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/guide`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}

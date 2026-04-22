import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "giugeo.site";
  const proto = headerStore.get("x-forwarded-proto") ?? "https";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${proto}://${host}/sitemap.xml`,
  };
}

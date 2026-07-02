import type { MetadataRoute } from "next";

// Private beta: disallow all crawling. Remove this once the product
// is ready for a public launch and SEO is intentionally enabled.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}

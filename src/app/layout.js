import "./globals.css";
import { inter, kinan, minervaModern } from "@/lib/fonts";
import Loader from "@/components/Loader";

import { getSectionContent, buildDefaultsFromFields } from "@/lib/content";
import { SEO_FIELDS } from "@/content/sections/seo";
import { APPEARANCE_FIELDS } from "@/content/sections/appearance";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

async function getSeoContent() {
  return getSectionContent("seo", buildDefaultsFromFields(SEO_FIELDS));
}

async function getAppearanceContent() {
  return getSectionContent(
    "appearance",
    buildDefaultsFromFields(APPEARANCE_FIELDS),
  );
}

function resolveImageUrl(image) {
  return image?.startsWith("http") ? image : `${siteUrl}${image}`;
}

/*
 * JSON.stringify does not escape `<`, `>`, or `&`, and the HTML parser
 * closes a <script> element on the raw byte sequence `</script`
 * regardless of the tag's type attribute. Since every value below comes
 * from admin-editable text fields, an editor could otherwise type
 * `</script><script>…` into (say) the structured-data business name and
 * have it execute on every visitor's browser. Escaping to the \u00xx
 * form keeps the JSON semantically identical — JSON parsers read
 * < exactly as `<` — while making it impossible for stored content
 * to break out of the script tag.
 */
function toSafeJsonLd(data) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export async function generateMetadata() {
  const seo = await getSeoContent();
  const ogImage = resolveImageUrl(seo["og-image"]);

  /*
   * Omitted entirely (not just left blank) when unset, since Next.js
   * still renders an empty `<meta name="google-site-verification"
   * content="">` tag otherwise — which Search Console/Bing would try
   * to read as a real (empty) verification attempt.
   */
  const verification = {};

  if (seo["google-site-verification"]) {
    verification.google = seo["google-site-verification"];
  }

  if (seo["bing-site-verification"]) {
    verification.other = { "msvalidate.01": seo["bing-site-verification"] };
  }

  return {
    metadataBase: new URL(siteUrl),
    title: seo["meta-title"],
    description: seo["meta-description"],
    ...(Object.keys(verification).length > 0 ? { verification } : {}),
    openGraph: {
      title: seo["og-title"],
      description: seo["og-description"],
      url: siteUrl,
      siteName: "Movenpick",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: seo["og-title"],
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo["og-title"],
      description: seo["og-description"],
      images: [ogImage],
    },
  };
}

export default async function RootLayout({ children }) {
  const seo = await getSeoContent();
  const appearance = await getAppearanceContent();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: seo["schema-name"],
    description: seo["schema-description"],
    url: siteUrl,
    image: resolveImageUrl(seo["og-image"]),
    address: {
      "@type": "PostalAddress",
      addressLocality: seo["schema-address-locality"],
      addressRegion: seo["schema-address-region"],
      addressCountry: seo["schema-address-country"],
    },
    containedInPlace: {
      "@type": "Organization",
      name: seo["schema-org-name"],
      url: seo["schema-org-url"],
    },
  };

  return (
    <html
      lang="en"
      className={[inter.variable, kinan.variable, minervaModern.variable].join(
        " ",
      )}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toSafeJsonLd(jsonLd) }}
        />
        <Loader logoUrl={appearance.logo} />
        {children}
      </body>
    </html>
  );
}

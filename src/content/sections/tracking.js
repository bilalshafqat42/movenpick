/*
 * Third-party analytics, site-level configuration rather than everyday
 * content — same reasoning as SEO & Sharing: this is a technical setting a
 * customer's own Admin can change without a developer, not something an
 * Editor or Manager should reach for. SUPER_ADMIN, not ADMIN — see this
 * section's own minRole in content/sections/index.js for why.
 *
 * Two independent fields, deliberately: GTM and GA4 are two different ways
 * to get analytics running, not two steps of one setup. Recommended, and
 * the simpler path: GTM alone, with GA4 added as a tag inside the GTM
 * container's own dashboard — that is what the GTM field's own helper text
 * still says. The direct GA4 field exists for whoever would rather skip
 * GTM's dashboard entirely. Do not fill in both pointed at the same GA4
 * property: GTM configured to also load GA4 would fire every pageview
 * twice, once from each script.
 *
 * Neither loads unconditionally. src/components/GoogleTagManager only
 * renders once a visitor has allowed the "analytics" cookie category —
 * see src/lib/cookieConsent.js's hasConsent() and the Cookie Banner
 * section's own fields, which describe this to the visitor. An empty
 * value here means nothing loads at all, regardless of consent.
 */
export const TRACKING_FIELDS = [
  {
    key: "gtm-container-id",
    label: "Google Tag Manager container ID",
    type: "TEXT",
    helperText:
      "e.g. GTM-XXXXXXX. Recommended: configure Google Analytics (GA4) as a tag inside your GTM container's own dashboard rather than filling in the GA4 field below too — see this section's own note on why not both. Only loads once a visitor allows the Analytics cookie category.",
    defaultValue: "",
  },
  {
    key: "ga4-measurement-id",
    label: "Google Analytics (GA4) measurement ID",
    type: "TEXT",
    helperText:
      "e.g. G-XXXXXXXXXX. Only needed if you are not using GTM to load GA4 — leave blank if GA4 is already configured as a tag inside your GTM container above. Only loads once a visitor allows the Analytics cookie category.",
    defaultValue: "",
  },
];

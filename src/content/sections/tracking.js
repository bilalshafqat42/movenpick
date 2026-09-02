/*
 * Third-party analytics, site-level configuration rather than everyday
 * content — same reasoning as SEO & Sharing: this is a technical setting a
 * customer's own Admin can change without a developer, not something an
 * Editor or Manager should reach for.
 *
 * One field, deliberately: Google Analytics (GA4) is configured as a tag
 * inside the Tag Manager container's own dashboard once the container ID
 * below is set, not as a second code snippet here. Adding GA4 directly
 * would duplicate what GTM already does and give two independent places
 * that could disagree about whether analytics is even on.
 *
 * Never loads unconditionally. src/components/GoogleTagManager only
 * renders the actual script once a visitor has allowed the "analytics"
 * cookie category — see src/lib/cookieConsent.js's hasConsent() and the
 * Cookie Banner section's own fields, which describe this to the visitor.
 * An empty value here means nothing loads at all, regardless of consent.
 */
export const TRACKING_FIELDS = [
  {
    key: "gtm-container-id",
    label: "Google Tag Manager container ID",
    type: "TEXT",
    helperText:
      "e.g. GTM-XXXXXXX. Configure Google Analytics (GA4) as a tag inside your GTM container's own dashboard — no separate GA4 field is needed here. Only loads once a visitor allows the Analytics cookie category.",
    defaultValue: "",
  },
];

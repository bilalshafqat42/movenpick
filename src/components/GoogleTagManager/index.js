import { getSectionContent, buildDefaultsFromFields } from "@/lib/content";
import { TRACKING_FIELDS } from "@/content/sections/tracking";
import GoogleTagManagerClient from "./GoogleTagManagerClient";
import GoogleAnalyticsClient from "./GoogleAnalyticsClient";

/*
 * Both read from the same "tracking" section, and both are independently
 * optional — either field can be empty, set, or (deliberately unusual) both
 * set at once for two unrelated GA4 properties. See tracking.js's own
 * comment for the one combination to avoid: the same GA4 property
 * configured in both places at once, which would double-count.
 */
export default async function GoogleTagManager() {
  const content = await getSectionContent(
    "tracking",
    buildDefaultsFromFields(TRACKING_FIELDS),
  );

  return (
    <>
      <GoogleTagManagerClient containerId={content["gtm-container-id"]} />
      <GoogleAnalyticsClient measurementId={content["ga4-measurement-id"]} />
    </>
  );
}

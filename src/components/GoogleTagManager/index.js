import { getSectionContent, buildDefaultsFromFields } from "@/lib/content";
import { TRACKING_FIELDS } from "@/content/sections/tracking";
import GoogleTagManagerClient from "./GoogleTagManagerClient";

export default async function GoogleTagManager() {
  const content = await getSectionContent(
    "tracking",
    buildDefaultsFromFields(TRACKING_FIELDS),
  );

  return <GoogleTagManagerClient containerId={content["gtm-container-id"]} />;
}

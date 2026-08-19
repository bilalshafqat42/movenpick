import { getSectionContent, buildDefaultsFromFields } from "@/lib/content";
import {
  NAVIGATION_FIELDS,
  shapeNavigationContent,
  shapeHeaderCta,
} from "@/content/sections/navigation";
import { APPEARANCE_FIELDS } from "@/content/sections/appearance";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const navigationContent = await getSectionContent(
    "navigation",
    buildDefaultsFromFields(NAVIGATION_FIELDS),
  );

  const appearanceContent = await getSectionContent(
    "appearance",
    buildDefaultsFromFields(APPEARANCE_FIELDS),
  );

  const menuItems = shapeNavigationContent(navigationContent);
  const headerCta = shapeHeaderCta(navigationContent);

  return (
    <HeaderClient
      menuItems={menuItems}
      logoUrl={appearanceContent.logo}
      ctaLabel={headerCta.label}
      ctaHref={headerCta.href}
    />
  );
}

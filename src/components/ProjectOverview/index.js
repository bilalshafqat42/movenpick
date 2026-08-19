import { getSectionContent, buildDefaultsFromFields } from "@/lib/content";
import { PROJECT_OVERVIEW_FIELDS } from "@/content/sections/projectOverview";
import ProjectOverviewClient from "./ProjectOverviewClient";

export default async function ProjectOverview() {
  const content = await getSectionContent(
    "projectOverview",
    buildDefaultsFromFields(PROJECT_OVERVIEW_FIELDS),
  );

  const stats = [1, 2, 3, 4].map((n) => ({
    value: content[`stat-${n}-value`],
    label: content[`stat-${n}-label`],
  }));

  return (
    <ProjectOverviewClient
      description={content.description}
      stats={stats}
      cta1Label={content["cta-1-label"]}
      cta1Href={content["cta-1-href"]}
      cta2Label={content["cta-2-label"]}
      cta2Href={content["cta-2-href"]}
    />
  );
}

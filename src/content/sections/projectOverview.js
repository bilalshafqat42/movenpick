/*
 * Field definitions for the Project Overview section — the description
 * paragraph, four key-fact stats, and two call-to-action buttons that sit
 * directly under the Hero.
 */
export const PROJECT_OVERVIEW_FIELDS = [
  {
    key: "description",
    label: "Description paragraph",
    type: "TEXT",
    long: true,
    defaultValue: "[Project overview paragraph]",
  },
  {
    key: "stat-1-value",
    label: "Key fact 1 — value",
    type: "TEXT",
    defaultValue: "[Value]",
  },
  {
    key: "stat-1-label",
    label: "Key fact 1 — label",
    type: "TEXT",
    defaultValue: "[Label]",
  },
  {
    key: "stat-2-value",
    label: "Key fact 2 — value",
    type: "TEXT",
    defaultValue: "[Value]",
  },
  {
    key: "stat-2-label",
    label: "Key fact 2 — label",
    type: "TEXT",
    defaultValue: "[Label]",
  },
  {
    key: "stat-3-value",
    label: "Key fact 3 — value",
    type: "TEXT",
    defaultValue: "[Value]",
  },
  {
    key: "stat-3-label",
    label: "Key fact 3 — label",
    type: "TEXT",
    defaultValue: "[Label]",
  },
  {
    key: "stat-4-value",
    label: "Key fact 4 — value",
    type: "TEXT",
    defaultValue: "[Value]",
  },
  {
    key: "stat-4-label",
    label: "Key fact 4 — label",
    type: "TEXT",
    defaultValue: "[Label]",
  },
  {
    key: "cta-1-label",
    label: "Primary button label",
    type: "TEXT",
    defaultValue: "Discover More",
  },
  {
    key: "cta-1-href",
    label: "Primary button link",
    type: "LINK",
    helperText: "Leave as #contact to open the enquiry form.",
    defaultValue: "#contact",
  },
  {
    key: "cta-2-label",
    label: "Secondary button label",
    type: "TEXT",
    defaultValue: "Download Brochure",
  },
  {
    key: "cta-2-href",
    label: "Secondary button link (brochure PDF)",
    type: "LINK",
    defaultValue: "/pdf/oceara-brochure.pdf",
  },
];

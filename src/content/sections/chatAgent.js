/*
 * The two agent photos shown in the chat widget: the large intro-card
 * photo (shown before a visitor opens the chat) and the small square
 * avatar shown in the open chat panel's header.
 *
 * project-name/project-short-name were previously hardcoded as
 * PROJECT_NAME/PROJECT_SHORT_NAME literals in chatFlow.js, copy-pasted
 * into 22 separate strings (the chat header, the teaser bubble, the
 * greeting, and every WhatsApp template, in both languages). Declaring
 * them here means marketing can set the real project name once, in the
 * panel, and every one of those 22 places picks it up automatically via
 * fillTemplate's {{project_name}}/{{project_short}} tokens — see
 * chatFlow.js and Chat.js's own fillProject() helper.
 */
export const CHAT_AGENT_FIELDS = [
  {
    key: "agent-photo",
    label: "Intro card photo — shown before the chat opens (portrait)",
    type: "IMAGE",
    defaultValue: "/images/agent/avatar.avif",
  },
  {
    key: "agent-photo-square",
    label: "Chat header avatar — square, shown once the chat is open",
    type: "IMAGE",
    defaultValue: "/images/agent/avatar-square.avif",
  },
  {
    key: "project-name",
    label: "Project name, in full — used in the chat header and every message that names the project",
    type: "TEXT",
    defaultValue: "[Movenpick Project Name]",
  },
  {
    key: "project-short-name",
    label: "Project name, shortened — used only where space is tight (the teaser bubble, one broker question)",
    type: "TEXT",
    defaultValue: "[Movenpick Project]",
  },
];

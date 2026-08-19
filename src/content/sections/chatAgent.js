/*
 * The two agent photos shown in the chat widget: the large intro-card
 * photo (shown before a visitor opens the chat) and the small square
 * avatar shown in the open chat panel's header.
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
];

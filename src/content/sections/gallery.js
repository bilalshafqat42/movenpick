/*
 * Matches what's currently hardcoded in
 * src/components/Gallery/GalleryClient.js.
 *
 * Items are a real add/remove LIST field in the panel (Manager role and
 * above — see permissions.js's content.edit.list). GalleryClient's
 * looping/index-bounds math now reads the real item count it was given at
 * render time rather than a fixed constant, so this is safe to add to or
 * remove from freely.
 */
const DEFAULT_ITEMS = [
  {
    image: "/images/gallery/wellness.avif",
    alt: "Hot stone wellness treatment",
    title: "Amenities Name",
    description:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  },
  {
    image: "/images/gallery/garden.avif",
    alt: "Woman enjoying an active outdoor lifestyle",
    title: "Amenities Name",
    description:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  },
  {
    image: "/images/gallery/yoga.avif",
    alt: "Landscaped outdoor community retreat",
    title: "Amenities Name",
    description:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  },
  {
    image: "/images/gallery/drawing.avif",
    alt: "Resort-inspired outdoor lifestyle",
    title: "Amenities Name",
    description:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  },
];

export const GALLERY_FIELDS = [
  {
    key: "heading",
    label: "Heading",
    type: "TEXT",
    defaultValue: "Duis Aute Irure Dolor In Reprehenderit",
  },
  {
    key: "text",
    label: "Intro text",
    type: "TEXT",
    long: true,
    defaultValue:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  },
  {
    key: "items",
    label: "Items",
    type: "LIST",
    itemLabel: "Item",
    helperText:
      "Use + to add an item, the trash icon to remove one. Needs at least 3 items for the carousel's left/right/centre layout to make sense.",
    itemFields: [
      { key: "image", label: "Image", type: "IMAGE" },
      { key: "alt", label: "Image alt text", type: "TEXT" },
      { key: "title", label: "Title", type: "TEXT" },
      { key: "description", label: "Description", type: "TEXT", long: true },
    ],
  },
];

export function shapeGalleryContent(content) {
  const rawItems = Array.isArray(content.items) ? content.items : [];

  const items =
    rawItems.length > 0
      ? rawItems.map((item) => ({
          image: item?.image ?? "",
          alt: item?.alt ?? "",
          title: item?.title ?? "",
          description: item?.description ?? "",
        }))
      : DEFAULT_ITEMS;

  return {
    heading: content.heading,
    text: content.text,
    items,
  };
}

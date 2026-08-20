/*
 * Matches what's currently hardcoded in
 * src/components/Gallery/GalleryClient.js. The carousel logic depends on
 * a fixed item count (looping/index-bounds math runs outside the
 * component, at module scope) so, like Amenities, the admin can edit
 * each item's content but not add or remove cards.
 */
const GALLERY_ITEMS = [
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

export const GALLERY_ITEM_COUNT = GALLERY_ITEMS.length;

function itemFieldKey(itemNumber, fieldName) {
  return `item-${itemNumber}-${fieldName}`;
}

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

  ...GALLERY_ITEMS.flatMap((item, index) => {
    const itemNumber = index + 1;

    return [
      {
        key: itemFieldKey(itemNumber, "image"),
        label: `Item ${itemNumber} — Image`,
        type: "IMAGE",
        defaultValue: item.image,
      },
      {
        key: itemFieldKey(itemNumber, "alt"),
        label: `Item ${itemNumber} — Image alt text`,
        type: "TEXT",
        defaultValue: item.alt,
      },
      {
        key: itemFieldKey(itemNumber, "title"),
        label: `Item ${itemNumber} — Title`,
        type: "TEXT",
        defaultValue: item.title,
      },
      {
        key: itemFieldKey(itemNumber, "description"),
        label: `Item ${itemNumber} — Description`,
        type: "TEXT",
        long: true,
        defaultValue: item.description,
      },
    ];
  }),
];

export function shapeGalleryContent(content) {
  const items = Array.from({ length: GALLERY_ITEM_COUNT }, (_, index) => {
    const itemNumber = index + 1;

    return {
      image: content[itemFieldKey(itemNumber, "image")],
      alt: content[itemFieldKey(itemNumber, "alt")],
      title: content[itemFieldKey(itemNumber, "title")],
      description: content[itemFieldKey(itemNumber, "description")],
    };
  });

  return {
    heading: content.heading,
    text: content.text,
    items,
  };
}

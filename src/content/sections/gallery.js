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
    title: "Wellness Resort",
    description:
      "[Movenpick gallery intro copy]",
  },
  {
    image: "/images/gallery/garden.avif",
    alt: "Woman enjoying an active outdoor lifestyle",
    title: "Active Living",
    description:
      "Thoughtfully planned spaces encourage movement, recreation and a more balanced way of living.",
  },
  {
    image: "/images/gallery/yoga.avif",
    alt: "Landscaped outdoor community retreat",
    title: "Nature Retreat",
    description:
      "Immersive landscaped spaces create quiet moments for reflection, connection and relaxation.",
  },
  {
    image: "/images/gallery/drawing.avif",
    alt: "Resort-inspired outdoor lifestyle",
    title: "Resort Moments",
    description:
      "Everyday life is elevated through carefully considered leisure spaces and resort-inspired surroundings.",
  },
];

export const GALLERY_ITEM_COUNT = GALLERY_ITEMS.length;

function itemFieldKey(itemNumber, fieldName) {
  return `item-${itemNumber}-${fieldName}`;
}

export const GALLERY_FIELDS = [
  {
    key: "eyebrow",
    label: "Eyebrow",
    type: "TEXT",
    defaultValue: "Designed",
  },
  {
    key: "heading",
    label: "Heading",
    type: "TEXT",
    defaultValue: "Around Life's Better Moments",
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
    eyebrow: content.eyebrow,
    heading: content.heading,
    items,
  };
}

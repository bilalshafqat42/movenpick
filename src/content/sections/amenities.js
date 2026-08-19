/*
 * Field definitions for the Amenities section, matching exactly what's
 * currently hardcoded in src/components/Amenities/AmenitiesClient.js as
 * of the day this was wired up to the database. These defaultValues are
 * what getSectionContent() falls back to for any field not yet saved in
 * the database (or if the database is briefly unreachable) — the public
 * site never regresses because of this integration.
 *
 * This is also the pattern every future section (and every future
 * project reusing this admin system) follows: a plain array of
 * { key, label, type, defaultValue } describing what's editable, nothing
 * page-specific baked into the admin code itself.
 */

const ITEMS = [
  {
    title: "[Feature 1 title]",
    description: "[Feature 1 description]",
    image: "/images/amenities/feature-1.svg",
    imageAlt: "Placeholder — replace with a real photo",
  },
  {
    title: "[Feature 2 title]",
    description: "[Feature 2 description]",
    image: "/images/amenities/feature-2.svg",
    imageAlt: "Placeholder — replace with a real photo",
  },
  {
    title: "[Feature 3 title]",
    description: "[Feature 3 description]",
    image: "/images/amenities/feature-3.svg",
    imageAlt: "Placeholder — replace with a real photo",
  },
  {
    title: "[Feature 4 title]",
    description: "[Feature 4 description]",
    image: "/images/amenities/feature-4.svg",
    imageAlt: "Placeholder — replace with a real photo",
  },
  {
    title: "[Feature 5 title]",
    description: "[Feature 5 description]",
    image: "/images/amenities/feature-5.svg",
    imageAlt: "Placeholder — replace with a real photo",
  },
];

export const AMENITIES_ITEM_COUNT = ITEMS.length;

function itemFieldKey(itemNumber, fieldName) {
  return `item-${itemNumber}-${fieldName}`;
}

export const AMENITIES_FIELDS = [
  {
    key: "eyebrow",
    label: "Eyebrow",
    type: "TEXT",
    defaultValue: "[Eyebrow]",
  },

  ...ITEMS.flatMap((item, index) => {
    const itemNumber = index + 1;

    return [
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
      {
        key: itemFieldKey(itemNumber, "image"),
        label: `Item ${itemNumber} — Image`,
        type: "IMAGE",
        defaultValue: item.image,
      },
      {
        key: itemFieldKey(itemNumber, "imageAlt"),
        label: `Item ${itemNumber} — Image alt text`,
        type: "TEXT",
        defaultValue: item.imageAlt,
      },
    ];
  }),
];

/*
 * Reshapes the flat key -> value content map (what getSectionContent()
 * returns) into the { eyebrow, items } prop shape AmenitiesClient
 * actually renders.
 */
export function shapeAmenitiesContent(content) {
  const items = Array.from({ length: AMENITIES_ITEM_COUNT }, (_, index) => {
    const itemNumber = index + 1;

    return {
      title: content[itemFieldKey(itemNumber, "title")],
      description: content[itemFieldKey(itemNumber, "description")],
      image: content[itemFieldKey(itemNumber, "image")],
      imageAlt: content[itemFieldKey(itemNumber, "imageAlt")],
    };
  });

  return {
    eyebrow: content.eyebrow,
    items,
  };
}

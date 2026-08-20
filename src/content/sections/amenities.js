/*
 * Field definitions for the Amenities section: a centered heading and
 * intro paragraph, a static list of key points — each with its own
 * photo AND its own description, swapped in together on hover/focus —
 * and a closing "Submit Request" button.
 */

/*
 * Reusing four of the Project Gallery's photos (public/images/gallery/)
 * so each item shows a distinct real image instead of the same
 * placeholder repeated four times.
 */
const ITEMS = [
  {
    title: "Duis Aute Irure Dolor In Reprehenderit",
    description:
      "Lorem Ipsum Dolor Sit Amet, Consectetur Adipiscing Elit, Sed Do Eiusmod Tempor Incididunt Ut Labore Et Dolore Magna Aliqua.",
    image: "/images/gallery/boy.avif",
    imageAlt: "Placeholder — replace with a real photo",
  },
  {
    title: "Duis Aute Irure Dolor In Reprehenderit",
    description:
      "Lorem Ipsum Dolor Sit Amet, Consectetur Adipiscing Elit, Sed Do Eiusmod Tempor Incididunt Ut Labore Et Dolore Magna Aliqua.",
    image: "/images/gallery/yacht.avif",
    imageAlt: "Placeholder — replace with a real photo",
  },
  {
    title: "Duis Aute Irure Dolor In Reprehenderit",
    description:
      "Lorem Ipsum Dolor Sit Amet, Consectetur Adipiscing Elit, Sed Do Eiusmod Tempor Incididunt Ut Labore Et Dolore Magna Aliqua.",
    image: "/images/gallery/wellness.avif",
    imageAlt: "Placeholder — replace with a real photo",
  },
  {
    title: "Duis Aute Irure Dolor In Reprehenderit",
    description:
      "Lorem Ipsum Dolor Sit Amet, Consectetur Adipiscing Elit, Sed Do Eiusmod Tempor Incididunt Ut Labore Et Dolore Magna Aliqua.",
    image: "/images/gallery/garden.avif",
    imageAlt: "Placeholder — replace with a real photo",
  },
];

export const AMENITIES_ITEM_COUNT = ITEMS.length;

function itemFieldKey(itemNumber, fieldName) {
  return `item-${itemNumber}-${fieldName}`;
}

export const AMENITIES_FIELDS = [
  {
    key: "heading",
    label: "Heading",
    type: "TEXT",
    defaultValue: "Duis Aute Irure Dolor In Reprehenderit",
  },
  {
    key: "intro-text",
    label: "Intro text",
    type: "TEXT",
    long: true,
    defaultValue:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
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

  {
    key: "cta-label",
    label: "Button label",
    type: "TEXT",
    defaultValue: "Submit Request",
  },
];

/*
 * Reshapes the flat key -> value content map (what getSectionContent()
 * returns) into the prop shape AmenitiesClient actually renders.
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
    heading: content.heading,
    introText: content["intro-text"],
    items,
    ctaLabel: content["cta-label"],
  };
}

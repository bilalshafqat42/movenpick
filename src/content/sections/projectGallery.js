/*
 * Field definitions for the Project Gallery — a full-bleed sequence the
 * visitor scrolls through horizontally. Like Amenities and Gallery, the
 * slide count here is fixed; the admin can edit each slide's photo and
 * caption but not add or remove slides.
 *
 * Note that only the first SCROLL_SLIDE_COUNT of these appear on the
 * page (see ProjectGalleryClient) — the horizontal journey is
 * deliberately capped so it does not hold the visitor in place for a
 * viewport height per slide. The rest stay defined and editable here so
 * raising that cap needs no content work.
 */
const SLIDES = [
  {
    image: "/images/slider.avif",
    alt: "Movenpick building exterior",
    heading: "Excepteur sint occaecat cupidatat",
    text:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
  },
  {
    image: "/images/gallery/game.avif",
    alt: "Placeholder — replace with a real photo",
    heading: "Excepteur sint occaecat cupidatat",
    text:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
  },
  {
    image: "/images/gallery/stone.avif",
    alt: "Placeholder — replace with a real photo",
    heading: "Excepteur sint occaecat cupidatat",
    text:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
  },
  {
    image: "/images/gallery/yacht.avif",
    alt: "Placeholder — replace with a real photo",
    heading: "Excepteur sint occaecat cupidatat",
    text:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
  },
  {
    image: "/images/gallery/wellness.avif",
    alt: "Placeholder — replace with a real photo",
    heading: "Excepteur sint occaecat cupidatat",
    text:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
  },
  {
    image: "/images/gallery/garden.avif",
    alt: "Placeholder — replace with a real photo",
    heading: "Excepteur sint occaecat cupidatat",
    text:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
  },
];

export const PROJECT_GALLERY_SLIDE_COUNT = SLIDES.length;

function slideFieldKey(slideNumber, fieldName) {
  return `slide-${slideNumber}-${fieldName}`;
}

export const PROJECT_GALLERY_FIELDS = SLIDES.flatMap((slide, index) => {
  const slideNumber = index + 1;

  return [
    {
      key: slideFieldKey(slideNumber, "image"),
      label: `Slide ${slideNumber} — Image`,
      type: "IMAGE",
      defaultValue: slide.image,
    },
    {
      key: slideFieldKey(slideNumber, "alt"),
      label: `Slide ${slideNumber} — Image alt text`,
      type: "TEXT",
      defaultValue: slide.alt,
    },
    {
      key: slideFieldKey(slideNumber, "heading"),
      label: `Slide ${slideNumber} — Heading`,
      type: "TEXT",
      defaultValue: slide.heading,
    },
    {
      key: slideFieldKey(slideNumber, "text"),
      label: `Slide ${slideNumber} — Caption`,
      type: "TEXT",
      long: true,
      defaultValue: slide.text,
    },
  ];
});

export function shapeProjectGalleryContent(content) {
  return Array.from({ length: PROJECT_GALLERY_SLIDE_COUNT }, (_, index) => {
    const slideNumber = index + 1;

    return {
      image: content[slideFieldKey(slideNumber, "image")],
      alt: content[slideFieldKey(slideNumber, "alt")],
      heading: content[slideFieldKey(slideNumber, "heading")],
      text: content[slideFieldKey(slideNumber, "text")],
    };
  });
}

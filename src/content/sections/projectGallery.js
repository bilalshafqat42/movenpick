/*
 * Field definitions for the Project Gallery — a full-bleed, auto-advancing,
 * drag-to-navigate slideshow. Like Amenities and Gallery, the slide count
 * is fixed (the autoplay/loop math depends on a stable count); the admin
 * can edit each slide's photo and caption but not add or remove slides.
 */
const SLIDES = [
  {
    image: "/images/gallery/boy.avif",
    alt: "Placeholder — replace with a real photo",
    heading: "[Slide 1 heading]",
    text: "[Slide 1 caption]",
  },
  {
    image: "/images/gallery/game.avif",
    alt: "Placeholder — replace with a real photo",
    heading: "[Slide 2 heading]",
    text: "[Slide 2 caption]",
  },
  {
    image: "/images/gallery/stone.avif",
    alt: "Placeholder — replace with a real photo",
    heading: "[Slide 3 heading]",
    text: "[Slide 3 caption]",
  },
  {
    image: "/images/gallery/yacht.avif",
    alt: "Placeholder — replace with a real photo",
    heading: "[Slide 4 heading]",
    text: "[Slide 4 caption]",
  },
  {
    image: "/images/gallery/wellness.avif",
    alt: "Placeholder — replace with a real photo",
    heading: "[Slide 5 heading]",
    text: "[Slide 5 caption]",
  },
  {
    image: "/images/gallery/garden.avif",
    alt: "Placeholder — replace with a real photo",
    heading: "[Slide 6 heading]",
    text: "[Slide 6 caption]",
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

/*
 * Shared entrance-animation timing, so every GSAP entrance sequence on the
 * site reads as one consistent rhythm instead of each component picking
 * its own numbers. Change these three values to retune pacing everywhere
 * at once — the same idea as the brand color variables in globals.css,
 * just on the JS side since GSAP timelines aren't driven by CSS custom
 * properties.
 */
/*
 * Whether a stagger reads as a sequence depends on its size RELATIVE to
 * the duration, not on the size of the gap alone. Below about a fifth
 * of the duration, each element is still most of the way through its
 * own fade when the next one starts, and the group looks like it
 * arrived together.
 *
 * That is what was wrong here. The duration was 0.9s against a 0.15s
 * gap — 17% — so entrances read as simultaneous. Widening the gaps to
 * 0.225s and 0.34s made them legible but slow, because it treated the
 * symptom: the total wait grew while the ratio barely moved.
 *
 * Shortening the duration fixes both at once. At 0.6s the same 0.15s
 * gap is 25% of it, which is comfortably inside the range where a
 * sequence reads, and every entrance on the site finishes sooner than
 * it did before.
 */
export const ENTRANCE_STAGGER = 0.15;
export const ENTRANCE_DURATION = 0.6;
export const ENTRANCE_EASE = "power3.out";

/*
 * For runs of six or more — form fields, footer columns, a list of
 * destinations. At the full ENTRANCE_STAGGER a long list turns into a
 * queue: nine form fields would take 1.35s to finish arriving. This
 * keeps the cascade visible without making the reader wait for it.
 */
export const LIST_STAGGER = 0.08;

/*
 * How far an element travels as it fades in. Two values only: text
 * lifts a little, media a little more, and nothing else invents its
 * own distance.
 */
export const ENTRANCE_RISE = 24;
export const ENTRANCE_RISE_MEDIA = 32;

/*
 * Page-load intro on the home page, desktop only.
 *
 * Three groups arrive in order — the hero's opening copy, then the
 * header's controls, then the pattern and the building photo — all on
 * the load clock, so no scrolling is needed to bring any of them in.
 *
 * These are absolute start times measured from the moment the sequence
 * begins, and the groups deliberately overlap: each one sets off while
 * the one before it is still arriving, which reads as a single
 * unfolding rather than three separate events. They are listed
 * outright rather than derived from durations, because the pacing is a
 * judgement about how the page should feel, not arithmetic.
 *
 * The schedule lives here, not in the components, because the groups
 * are spread across two of them — the copy and the photo belong to
 * Hero, the controls to Header.
 */
export const INTRO_BREAKPOINT = "(min-width: 1025px)";

/*
 * The hero's opening uses the same gap as every other section. It was
 * half again as wide while the durations were long; now that the
 * durations are short it does not need to be, and the opening is a
 * second shorter for it.
 */
export const HERO_COPY_STAGGER = ENTRANCE_STAGGER;

/*
 * Where a section's entrance fires, as a ScrollTrigger start.
 *
 * "top 50%" means the section's top edge has reached the middle of the
 * screen, so the section already fills the lower half before anything
 * animates. The reader is looking at it when it moves.
 *
 * The starts these replaced were 72-82%, which fired when the section
 * filled only its first sliver of the screen: measured at 1440x900,
 * between 23% and 30% of the viewport. The animation was largely over
 * by the time the section was properly in view, so it read as content
 * that simply appeared.
 */
export const ENTRANCE_START = "top 50%";

/*
 * How many lines the hero's copy has — eyebrow, heading, description,
 * Discover More, Scroll Down. Named because the header's start is
 * derived from it: the header begins one step after the last line of
 * copy, so adding or removing a line moves the header with it instead
 * of leaving a gap or an overlap to notice later.
 */
const HERO_COPY_LINES = 5;

/*
 * How many controls the header introduces — logo, menu, callback,
 * rule. The pattern and photo pick up one step after the last of them,
 * for the same reason the header picks up after the copy: the whole
 * opening is one chain, and every link is derived from the one before
 * it rather than written down separately.
 */
const HEADER_CONTROL_LINES = 4;

const INTRO_STEP_STARTS = [
  /* 0 — the hero's first line of copy */
  0.1,
  /*
   * 1 — the header's controls, picking up one step after the hero's
   * last line rather than at a figure of their own.
   */
  0.1 + HERO_COPY_STAGGER * HERO_COPY_LINES,
  /* 2 — the pattern, then the building photo one step after it */
  0.1 +
    HERO_COPY_STAGGER * HERO_COPY_LINES +
    HERO_COPY_STAGGER * HEADER_CONTROL_LINES,
];

export function introStepStart(index) {
  return INTRO_STEP_STARTS[index] ?? 0;
}

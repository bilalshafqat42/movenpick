/*
 * Shared entrance-animation timing, so every GSAP entrance sequence on the
 * site reads as one consistent rhythm instead of each component picking
 * its own numbers. Change these three values to retune pacing everywhere
 * at once — the same idea as the brand color variables in globals.css,
 * just on the JS side since GSAP timelines aren't driven by CSS custom
 * properties.
 */
export const ENTRANCE_STAGGER = 0.15;
export const ENTRANCE_DURATION = 0.9;
export const ENTRANCE_EASE = "power3.out";

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
 * The gap between one line of the opening and the next, used by the
 * hero's copy and by the header's controls so the two read as one
 * continuous sequence rather than two that happen to follow each other.
 *
 * Half again the site-wide ENTRANCE_STAGGER: this is the first thing
 * anyone sees and it is worth reading as a sequence.
 */
export const HERO_COPY_STAGGER = ENTRANCE_STAGGER * 1.5;

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

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

const INTRO_STEP_STARTS = [
  /* 0 — hero eyebrow, heading, subtitle and scroll cue */
  0.1,
  /* 1 — header menu, logo, callback and divider */
  0.3,
  /* 2 — pattern and building photo */
  0.5,
];

export function introStepStart(index) {
  return INTRO_STEP_STARTS[index] ?? 0;
}

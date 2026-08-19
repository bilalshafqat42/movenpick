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

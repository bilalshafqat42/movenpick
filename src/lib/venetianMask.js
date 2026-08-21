/*
 * Venetian blind reveal.
 *
 * The image is split into horizontal bands, each with its own "slat" —
 * a hard-edged stripe centred in the band that starts as a hairline and
 * widens to fill the band's full height. Bands stagger their start
 * bottom-to-top, so the blind reads as opening upward as the visitor
 * scrolls, rather than every slat opening in lockstep.
 *
 * Built as a plain mask-image string recomputed from `progress` (0-1)
 * rather than a GSAP tween with a duration, so callers can pin it
 * exactly to scroll position or scrub it through a timeline, whichever
 * suits the section.
 *
 * Shared by the Payment and Amenities photos so the two read as the
 * same move rather than two hand-tuned near-misses.
 */

const BAND_COUNT = 30;
const BAND_HEIGHT = 100 / BAND_COUNT;
const WINDOW = 0.3;
const SPREAD = 1 - WINDOW;

export function buildVenetianMask(progress) {
  const stops = [];

  for (let i = 0; i < BAND_COUNT; i += 1) {
    const bandStart = (i / (BAND_COUNT - 1)) * SPREAD;
    const local = Math.min(1, Math.max(0, (progress - bandStart) / WINDOW));

    const bandBottom = i * BAND_HEIGHT;
    const bandTop = bandBottom + BAND_HEIGHT;
    const bandCenter = bandBottom + BAND_HEIGHT / 2;
    const half = (local * BAND_HEIGHT) / 2;
    const revealBottom = bandCenter - half;
    const revealTop = bandCenter + half;

    /*
     * White, not black, for the "revealed" stops: mask-image defaults
     * to luminance mode in modern spec-compliant browsers (mask value
     * = luminance × alpha), and black has zero luminance — so black
     * reads as fully MASKED OUT there, not revealed, leaving only
     * anti-aliased slivers at the hard-stop edges visible. White has
     * full luminance, so it reads as revealed under luminance mode,
     * and under the older alpha-only mode it's still fully opaque
     * (alpha 1) either way — correct under both.
     */
    stops.push(
      `transparent ${bandBottom}%`,
      `transparent ${revealBottom}%`,
      `white ${revealBottom}%`,
      `white ${revealTop}%`,
      `transparent ${revealTop}%`,
      `transparent ${bandTop}%`,
    );
  }

  return `linear-gradient(0deg, ${stops.join(", ")})`;
}

export function clearVenetianMask(element) {
  element.style.maskImage = "none";
  element.style.webkitMaskImage = "none";
}

/*
 * Reversible: callers scrub this both ways, so a progress that drops
 * back below 1 has to bring the blind back rather than stay cleared.
 */
export function applyVenetianMask(element, progress) {
  /*
   * Drop the mask entirely once every slat is fully open. At progress
   * 1 each band's white stop ends exactly where the next one's begins,
   * and the zero-width transparent stops between them can leave faint
   * antialiased seam lines across the photo. Clearing also takes the
   * element back off the mask compositing path for the rest of the
   * page's life, which is the state it spends most of its time in.
   */
  if (progress >= 1) {
    clearVenetianMask(element);

    return;
  }

  const mask = buildVenetianMask(progress);

  element.style.maskImage = mask;
  element.style.webkitMaskImage = mask;
}

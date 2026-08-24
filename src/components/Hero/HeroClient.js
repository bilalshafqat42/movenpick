"use client";

import Image from "next/image";
import SafeImage from "@/components/SafeImage";
import { useCallback, useRef } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import {
  ENTRANCE_STAGGER,
  ENTRANCE_DURATION,
  ENTRANCE_EASE,
  INTRO_BREAKPOINT,
  introStepStart,
} from "@/lib/motion";
import styles from "./Hero.module.css";

/*
 * The framed photo grows from its framed size to the full width and
 * height of its panel as that panel arrives on screen: it starts as a
 * picture sitting on the pattern and ends as the whole section.
 *
 * width and height, not scale. Scale cannot get from a 904:624 frame to
 * the screen's own proportions without stretching the building, and the
 * photo is the subject — a non-uniform scale would distort it on every
 * frame of the way up. Sizing the box instead lets object-fit: cover
 * reframe the photograph at each step, which is what keeps it
 * undistorted.
 *
 * Desktop only: tablet and mobile have their own frame widths and are
 * short enough that the panel arrives all at once anyway.
 */

/*
 * Where the image panel comes to rest: the scroll position that puts
 * its bottom edge on the viewport's bottom edge, so the whole
 * composition is visible without scrolling past it.
 *
 * Shared by the Scroll Down jump and by the growth's scroll range, so
 * the growth is guaranteed to finish exactly where the jump lands
 * rather than the two being tuned separately and drifting.
 */
function panelRestScrollY(imageSection) {
  const rect = imageSection.getBoundingClientRect();

  return Math.max(0, rect.bottom + window.scrollY - window.innerHeight);
}

export default function HeroClient({
  mainImage,
  mainImageFallback,
  mainImageAlt,
  eyebrow,
  heading,
  text,
  ctaLabel,
  ctaHref,
}) {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const scrollIndicatorRef = useRef(null);
  const imageSectionRef = useRef(null);
  const patternRef = useRef(null);
  const imageFrameRef = useRef(null);

  /*
   * Clicking Scroll Down reveals the full-height pattern + building photo
   * panel below the text, rather than jumping straight into the About
   * section after it. The target aligns the bottom of that panel with the
   * bottom of the viewport, so the whole composition becomes visible
   * without scrolling past it.
   *
   * Driven by GSAP's ScrollToPlugin rather than the native
   * scrollIntoView(): the browser's own smooth scroll uses a fixed, fairly
   * quick easing that isn't adjustable, whereas this gives the motion the
   * same longer, gentler ease used for the header's own scroll-to-section
   * jumps.
   */
  const revealImage = useCallback((event) => {
    event.preventDefault();

    const section = sectionRef.current;
    const imageSection = imageSectionRef.current;

    if (!section || !imageSection) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    /*
     * On mobile the hero is already one screen with the photo panel
     * in it, so there is nothing left inside the section to reveal —
     * Scroll Down moves on to the next section instead. Read from the
     * DOM rather than by id so it follows the page order rather than
     * needing to know what comes next.
     */
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const nextSection = section.nextElementSibling;

    let targetY = panelRestScrollY(imageSection);

    if (mobile && nextSection) {
      /*
       * Land on the position the next section's snap point will settle
       * at, not merely at its top.
       *
       * That offset is the page's scroll-padding PLUS the section's own
       * scroll-margin, and on mobile those cancel out (see globals.css:
       * 90px of padding against -90px of margin, so a full-screen
       * section rests flush). Subtracting only the padding left the
       * tween 90px short, and restoring snapping afterwards yanked the
       * page that 90px in a single frame — the abrupt jolt at the end.
       */
      const rootStyle = window.getComputedStyle(document.documentElement);
      const nextStyle = window.getComputedStyle(nextSection);

      const snapOffset =
        (parseFloat(rootStyle.scrollPaddingTop) || 0) +
        (parseFloat(nextStyle.scrollMarginTop) || 0);

      targetY = Math.max(
        0,
        nextSection.getBoundingClientRect().top + window.scrollY - snapOffset,
      );
    }

    /*
     * CSS scroll snapping is suspended for the duration.
     *
     * The browser re-snaps after every frame a scripted scroll writes,
     * so the tween and the snap end up taking turns dragging the page —
     * the same fight that made this button stutter badly enough to be
     * reported as broken once before. Restored on completion and on
     * interrupt, so a tween that never finishes cannot leave the page
     * without snapping.
     */
    const root = document.documentElement;
    const restoreSnap = () => {
      root.style.removeProperty("scroll-snap-type");
    };

    root.style.scrollSnapType = "none";

    gsap.to(window, {
      scrollTo: { y: targetY, autoKill: false },
      duration: reduceMotion ? 0 : 1.4,
      ease: "power2.inOut",
      overwrite: true,
      onComplete: restoreSnap,
      onInterrupt: restoreSnap,
    });
  }, []);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const content = contentRef.current;
      const scrollIndicator = scrollIndicatorRef.current;
      const patternEl = patternRef.current;
      const imageFrameEl = imageFrameRef.current;

      if (!section || !content) {
        return;
      }

      const eyebrowEl = content.querySelector(`.${styles.eyebrow}`);
      const titleEl = content.querySelector(`.${styles.title}`);
      const subtitleEl = content.querySelector(`.${styles.subtitle}`);

      if (!eyebrowEl || !titleEl || !subtitleEl) {
        return;
      }

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set(
          [
            eyebrowEl,
            titleEl,
            subtitleEl,
            scrollIndicator,
            imageFrameEl,
            patternEl,
          ],
          { autoAlpha: 1, y: 0 },
        );

        return;
      }

      /*
       * Desktop opens in three deliberate beats instead of one cascade:
       * the copy, then the header's controls (Header runs that one — see
       * introStepStart in lib/motion), then the pattern and the
       * building photo. Each group waits for the previous one to land
       * and then holds for a beat, so the page introduces itself in the
       * order it wants to be read.
       *
       * Each group moves as a single block. A stagger inside a group
       * would blur the boundary between the beats, which is the whole
       * point of the sequence.
       */
      if (window.matchMedia(INTRO_BREAKPOINT).matches) {
        gsap.fromTo(
          [eyebrowEl, titleEl, subtitleEl, scrollIndicator],
          { autoAlpha: 0, y: 32 },
          {
            autoAlpha: 1,
            y: 0,
            duration: ENTRANCE_DURATION,
            ease: ENTRANCE_EASE,
            delay: introStepStart(0),
          },
        );

        /*
         * Third beat: the pattern and the photo, together, from below.
         * They sit in the panel under the copy and do not move from
         * there — this is only about when they arrive, not where.
         */
        gsap.fromTo(
          [imageFrameEl, patternEl],
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            duration: ENTRANCE_DURATION,
            ease: ENTRANCE_EASE,
            delay: introStepStart(2),
          },
        );

        return;
      }

      /*
       * Below 1025px, the original cascade: each element one
       * ENTRANCE_STAGGER after the previous. The three-beat sequence
       * above is a desktop composition — it depends on the copy and the
       * photo occupying separate screens, which they do not here.
       */
      gsap
        .timeline({ defaults: { ease: ENTRANCE_EASE } })
        .fromTo(
          eyebrowEl,
          { autoAlpha: 0, y: 22 },
          { autoAlpha: 1, y: 0, duration: ENTRANCE_DURATION },
          0,
        )
        .fromTo(
          titleEl,
          { autoAlpha: 0, y: 32 },
          { autoAlpha: 1, y: 0, duration: ENTRANCE_DURATION },
          ENTRANCE_STAGGER,
        )
        .fromTo(
          subtitleEl,
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: ENTRANCE_DURATION },
          ENTRANCE_STAGGER * 2,
        )
        .fromTo(
          scrollIndicator,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: ENTRANCE_DURATION },
          ENTRANCE_STAGGER * 3,
        )
        .fromTo(
          imageFrameEl,
          { autoAlpha: 0, y: 28 },
          { autoAlpha: 1, y: 0, duration: ENTRANCE_DURATION },
          ENTRANCE_STAGGER * 4,
        )
        .fromTo(
          patternEl,
          { autoAlpha: 0, y: 28 },
          { autoAlpha: 1, y: 0, duration: ENTRANCE_DURATION },
          ENTRANCE_STAGGER * 5,
        );
    },
    { scope: sectionRef },
  );

  useGSAP(
    () => {
      const section = sectionRef.current;
      const imageSection = imageSectionRef.current;
      const imageFrameEl = imageFrameRef.current;

      if (!section || !imageSection || !imageFrameEl) {
        return undefined;
      }

      const matchMedia = gsap.matchMedia();

      matchMedia.add(
        {
          desktop: "(min-width: 1025px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { desktop = false, reduceMotion = false } =
            context.conditions ?? {};

          /*
           * Below 1025px the frame has its own width (see
           * Hero.module.css), and reduced motion gets the framed size
           * with no growth at all.
           */
          if (!desktop || reduceMotion) {
            gsap.set(imageFrameEl, { clearProps: "width,height" });

            return undefined;
          }

          /*
           * The framed size is read from the CSS rather than restated
           * here, so the two cannot drift: the inline width and height
           * this tween writes are cleared first, which drops the
           * element back to the rule in Hero.module.css, and then it is
           * measured.
           *
           * Re-run on every refresh, before ScrollTrigger evaluates the
           * function-based values below, so a resized window is
           * measured again instead of animating from a size that
           * belonged to the old viewport.
           */
          const restingSize = { width: 0, height: 0 };

          const measureRestingSize = () => {
            gsap.set(imageFrameEl, { clearProps: "width,height" });

            restingSize.width = imageFrameEl.offsetWidth;
            restingSize.height = imageFrameEl.offsetHeight;
          };

          measureRestingSize();

          const growth = gsap.fromTo(
            imageFrameEl,
            {
              width: () => restingSize.width,
              height: () => restingSize.height,
            },
            {
              /*
               * The panel's own box, so the photo finishes as the
               * section rather than at a number that happens to match
               * it today.
               */
              width: () => imageSection.clientWidth,
              height: () => imageSection.clientHeight,

              /*
               * Linear, with the smoothing left to scrub. An ease here
               * would make the frame speed up and slow down against a
               * steady scroll, which reads as the page fighting the
               * wheel rather than following it.
               */
              ease: "none",

              scrollTrigger: {
                trigger: section,

                /*
                 * Ranged over exactly the Scroll Down journey: framed
                 * at the page's own resting position, filling the panel
                 * at the point where the panel's bottom edge meets the
                 * viewport's.
                 *
                 * Anchored to the hero section rather than the panel
                 * because the panel already peeks into view at page
                 * load. Triggering on the panel's own top edge crossing
                 * the viewport bottom would put progress at about a
                 * third before the visitor had touched anything, so the
                 * sliver they first see would already be part-grown.
                 */
                start: "top top",
                end: () => `+=${Math.max(1, panelRestScrollY(imageSection))}`,

                onRefreshInit: measureRestingSize,

                /*
                 * A little weight, so the frame glides to the scroll
                 * position rather than being nailed to it frame by
                 * frame.
                 */
                scrub: 0.6,
                invalidateOnRefresh: true,
              },
            },
          );

          return () => {
            growth.scrollTrigger?.kill();
            growth.kill();
          };
        },
      );

      return () => {
        matchMedia.revert();
      };
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="home"
      className={styles.hero}
      aria-labelledby="hero-title"
    >
      {/*
       * The copy and the scroll cue travel together, so they share a
       * panel. On desktop that panel is the layer the photo slides up
       * over; below 1025px it is `display: contents`, so the box is not
       * there at all and the two sit in the hero's own flex column
       * exactly as before.
       */}
      <div className={styles.textPanel}>
        <div ref={contentRef} className={styles.content}>
          <p className={styles.eyebrow}>{eyebrow}</p>

          <h1 id="hero-title" className={styles.title}>
            {heading}
          </h1>

          <p className={styles.subtitle}>{text}</p>

          {ctaLabel && ctaHref ? (
            <a
              href={ctaHref}
              className={styles.ctaButton}
              {...(ctaHref === "#contact" ? { "data-contact-popup": true } : {})}
            >
              <span>{ctaLabel}</span>
              <span className={styles.ctaIcon} aria-hidden="true">
                →
              </span>
            </a>
          ) : null}
        </div>

        <a
          ref={scrollIndicatorRef}
          href="#hero-image"
          className={styles.scrollIndicator}
          aria-label="Scroll down to discover Movenpick"
          onClick={revealImage}
        >
          <span className={styles.scrollLine} aria-hidden="true" />
          <span className={styles.scrollText}>Scroll Down</span>
        </a>
      </div>

      <div
        ref={imageSectionRef}
        id="hero-image"
        className={styles.imageSection}
      >
        <Image
          ref={patternRef}
          src="/images/hero/pattern.avif"
          alt=""
          aria-hidden="true"
          fill
          quality={80}
          sizes="100vw"
          priority
          className={styles.patternShape}
        />

        <div ref={imageFrameRef} className={styles.imageFrame}>
          <SafeImage
            src={mainImage}
            fallbackSrc={mainImageFallback}
            alt={mainImageAlt}
            fill
            quality={85}
            sizes="(max-width: 767px) 88vw, (max-width: 1024px) 74vw, 100vw"
            priority
            className={styles.image}
          />
        </div>
      </div>
    </section>
  );
}

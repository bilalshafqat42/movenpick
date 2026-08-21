"use client";

import Image from "next/image";
import SafeImage from "@/components/SafeImage";
import { useCallback, useRef } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import { ENTRANCE_STAGGER, ENTRANCE_DURATION, ENTRANCE_EASE } from "@/lib/motion";
import styles from "./Hero.module.css";

/*
 * The framed photo grows from 8 of the page's 12 columns to 10 as its
 * panel arrives on screen.
 *
 * Held at 8/10 of the finished size and released to 1, rather than
 * animating `width` from one column count to the other. Animating width
 * would reflow a 1200px-wide image and its panel on every scroll frame,
 * and it would upscale a raster captured at the 8-column size on the way
 * up. See the .imageFrame comment in Hero.module.css - the CSS width is
 * the 10-column size, so scale 1 IS 10 columns.
 *
 * Desktop only: tablet and mobile have their own frame widths and are
 * short enough that the panel arrives all at once anyway.
 */
const FRAME_COLUMNS_FROM = 8;
const FRAME_COLUMNS_TO = 10;
const FRAME_START_SCALE = FRAME_COLUMNS_FROM / FRAME_COLUMNS_TO;

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
  eyebrow,
  heading,
  text,
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
       * Each element starts one ENTRANCE_STAGGER after the previous —
       * building photo first, pattern shape last, per the requested order.
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
           * Hero.module.css), and reduced motion gets the finished
           * 10-column size with no growth at all.
           */
          if (!desktop || reduceMotion) {
            gsap.set(imageFrameEl, { clearProps: "scale" });

            return undefined;
          }

          const growth = gsap.fromTo(
            imageFrameEl,
            { scale: FRAME_START_SCALE },
            {
              scale: 1,

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
                 * Ranged over exactly the Scroll Down journey: 8 columns
                 * at the page's own resting position, 10 columns at the
                 * point where the panel's bottom edge meets the
                 * viewport's.
                 *
                 * Anchored to the hero section rather than the panel
                 * because the panel already peeks into view at page
                 * load. Triggering on the panel's own top edge crossing
                 * the viewport bottom would put progress at about a
                 * third before the visitor had touched anything, so the
                 * sliver they first see would already be 8.7 columns
                 * instead of 8.
                 */
                start: "top top",
                end: () => `+=${Math.max(1, panelRestScrollY(imageSection))}`,

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
      <div ref={contentRef} className={styles.content}>
        <p className={styles.eyebrow}>Duis aute irure</p>

        <h1 id="hero-title" className={styles.title}>
          The home of active wellness
        </h1>

        <p className={styles.subtitle}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
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

      <div ref={imageSectionRef} id="hero-image" className={styles.imageSection}>
        <Image
          ref={patternRef}
          src="/images/hero/pattern.avif"
          alt=""
          aria-hidden="true"
          fill
          quality={80}
          sizes="100vw"
          className={styles.patternShape}
        />

        <div ref={imageFrameRef} className={styles.imageFrame}>
          <SafeImage
            src={mainImage}
            fallbackSrc={mainImageFallback}
            alt="[Add Movenpick hero image description]"
            fill
            quality={85}
            sizes="(max-width: 767px) 88vw, (max-width: 1024px) 74vw, 83.333vw"
            className={styles.image}
          />
        </div>
      </div>
    </section>
  );
}

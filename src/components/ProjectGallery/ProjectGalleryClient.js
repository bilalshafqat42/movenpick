"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import styles from "./ProjectGallery.module.css";

/*
 * How many slides the horizontal journey actually covers.
 *
 * The CMS defines six (see @/content/sections/projectGallery) and all
 * six stay editable in the panel, but holding a visitor in place for
 * six viewport heights of scroll just to get past one section reads as
 * being held hostage. Three establishes the sequence and hands the
 * page back. Raising this number is the only change needed to show
 * more — the wrapper height, rail width, travel distance and pagination
 * are all derived from it.
 */
const SCROLL_SLIDE_COUNT = 3;

export default function ProjectGalleryClient({ slides }) {
  const visibleSlides = slides.slice(0, SCROLL_SLIDE_COUNT);
  const slideCount = visibleSlides.length;

  const [activeIndex, setActiveIndex] = useState(0);

  const scrollWrapperRef = useRef(null);
  const viewportRef = useRef(null);
  const railRef = useRef(null);
  const trackFillRef = useRef(null);
  const activeIndexRef = useRef(0);

  const setActive = useCallback((index) => {
    if (index === activeIndexRef.current) {
      return;
    }

    activeIndexRef.current = index;
    setActiveIndex(index);
  }, []);

  /*
   * The scrubber is repositioned every scroll frame, so it is written
   * straight to the DOM rather than held in React state — three
   * caption changes per journey belong in state, several hundred
   * scrubber positions do not.
   *
   * The classic range-slider-thumb trick: positioning the fill's left
   * edge at X% and then shifting it back by X% of its OWN width (via
   * transform, not a track-relative unit) means it lands flush against
   * the track's left edge at X=0 and flush against the right edge at
   * X=100 — regardless of whether the fill's width is a percentage or,
   * on desktop, a fixed 150px. A plain percentage `left` alone would
   * push a fixed-width fill past the track's right edge at X=100.
   */
  const positionTrackFill = useCallback((progress) => {
    const trackFill = trackFillRef.current;

    if (!trackFill) {
      return;
    }

    gsap.set(trackFill, {
      left: `${progress * 100}%`,
      xPercent: -progress * 100,
    });
  }, []);

  useGSAP(
    () => {
      const wrapper = scrollWrapperRef.current;
      const viewport = viewportRef.current;
      const rail = railRef.current;

      if (!wrapper || !viewport || !rail || slideCount <= 1) {
        return undefined;
      }

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      /*
       * Reduced motion gets no scroll-driven movement at all. The CSS
       * turns .rail into a plain overflow-x container with x snapping,
       * so the same three slides are still reachable by swipe or by
       * the keyboard — just without the page scroll moving them. The
       * scroll listener below is only there to keep the caption and
       * scrubber honest about which one is showing.
       */
      if (reduceMotion) {
        gsap.set(rail, { clearProps: "transform" });
        positionTrackFill(0);

        const handleRailScroll = () => {
          const travel = rail.scrollWidth - rail.clientWidth;
          const progress = travel > 0 ? rail.scrollLeft / travel : 0;

          positionTrackFill(progress);
          setActive(Math.round(progress * (slideCount - 1)));
        };

        rail.addEventListener("scroll", handleRailScroll, { passive: true });

        return () => {
          rail.removeEventListener("scroll", handleRailScroll);
        };
      }

      gsap.set(rail, { xPercent: 0 });
      positionTrackFill(0);

      /*
       * .rail is slideCount viewports wide, and xPercent is a share of
       * the element's OWN width, so one slide of travel is
       * 100 / slideCount percent rather than a flat 100. Expressed as a
       * share rather than in pixels so it survives a resize without
       * needing to be recalculated.
       */
      const railTravelPercent = (100 * (slideCount - 1)) / slideCount;

      const drift = gsap.to(rail, {
        xPercent: -railTravelPercent,

        /*
         * Linear, with the smoothing left to scrub. An ease here would
         * make the photos speed up and slow down against a steady
         * scroll gesture, which reads as the page fighting the wheel.
         */
        ease: "none",

        scrollTrigger: {
          trigger: wrapper,
          start: "top top",

          /*
           * Measured rather than declared as "bottom bottom": .viewport
           * is position: sticky, so the real travel is the wrapper's
           * height minus the one viewport height that stays on screen.
           * A short screen where .viewport hits its min-height would
           * otherwise leave the last slide arriving after the section
           * had already unstuck.
           */
          end: () => `+=${wrapper.offsetHeight - viewport.offsetHeight}`,

          /*
           * The whole point of the request: scrub gives the rail a
           * little weight so it glides to the scroll position instead
           * of being nailed to it frame by frame.
           */
          scrub: 0.7,
          invalidateOnRefresh: true,

          /*
           * One gesture, one whole slide - never resting half way
           * between two photos.
           *
           * snapTo lands progress on 0, 0.5, 1 for three slides, which
           * are exactly the positions where a slide fills the viewport.
           * `directional` is what makes a single flick advance rather
           * than fall back: the snap resolves in the direction the
           * visitor was already scrolling, so even a short scroll down
           * commits to the next slide instead of settling back onto the
           * one they were leaving.
           *
           * The delay is deliberately short. It is the pause after
           * scrolling stops before the snap takes over, and anything
           * longer reads as the page hesitating.
           */
          snap: {
            snapTo: 1 / (slideCount - 1),
            duration: { min: 0.25, max: 0.6 },
            delay: 0.06,
            ease: "power2.inOut",
            directional: true,
          },

          onUpdate: (self) => {
            positionTrackFill(self.progress);
            setActive(Math.round(self.progress * (slideCount - 1)));
          },
        },
      });

      return () => {
        drift.scrollTrigger?.kill();
        drift.kill();
      };
    },
    { dependencies: [slideCount], revertOnUpdate: true },
  );

  /*
   * Keep the caption in step if the slide count ever shrinks beneath a
   * stale index (content edit, hot reload).
   */
  useEffect(() => {
    if (activeIndexRef.current > slideCount - 1) {
      setActive(Math.max(0, slideCount - 1));
    }
  }, [slideCount, setActive]);

  const activeSlide = visibleSlides[activeIndex] ?? visibleSlides[0];

  if (!activeSlide) {
    return null;
  }

  return (
    <section
      id="project-gallery"
      className={styles.gallery}
      aria-label="Project gallery"
      role="region"
    >
      <div
        ref={scrollWrapperRef}
        className={styles.scrollWrapper}
        style={{ "--pg-slides": slideCount }}
      >
        <div ref={viewportRef} className={styles.viewport}>
          <div ref={railRef} className={styles.rail}>
            {visibleSlides.map((slide, index) => (
              <div key={index} className={styles.slide}>
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  priority={index === 0}
                  draggable={false}
                  quality={90}
                  sizes="100vw"
                  className={styles.image}
                />
              </div>
            ))}
          </div>

          <div className={styles.overlay} aria-hidden="true" />

          <div className={styles.content}>
            <h2 key={`heading-${activeIndex}`} className={styles.heading}>
              {activeSlide.heading}
            </h2>

            <p key={`text-${activeIndex}`} className={styles.text}>
              {activeSlide.text}
            </p>

            <div className={styles.pagination}>
              <div className={styles.track} aria-hidden="true">
                <div ref={trackFillRef} className={styles.trackFill} />
              </div>

              <span className={styles.counter}>
                {String(activeIndex + 1).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

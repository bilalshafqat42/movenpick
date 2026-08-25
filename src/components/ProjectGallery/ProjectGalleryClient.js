"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import { ENTRANCE_EASE } from "@/lib/motion";
import styles from "./ProjectGallery.module.css";

/*
 * Viewport heights of scrolling per slide transition.
 *
 * Above 1 the photos move less per unit of scroll, which is what makes
 * free scrolling through the section feel deliberate rather than
 * skittish. It costs the visitor nothing in effort, because the snap
 * below carries them a whole slide per gesture regardless of how long
 * the runway is.
 */
const SCROLL_VIEWPORTS_PER_TRANSITION = 1.4;

/*
 * Viewport heights the section is held, filling the screen, BEFORE any
 * horizontal travel begins.
 *
 * Without this the rail started moving on the exact scroll pixel the
 * section first covered the viewport — measured, they were the same
 * position — so arriving and changing slide were one indivisible
 * motion. The photo was already sliding before the visitor had seen it
 * whole, which reads as the section getting ahead of them.
 *
 * This buys arrival its own beat: the section locks full-screen and
 * holds on slide one, and only the next push starts the sequence.
 *
 * Deliberately short. Its job is not to be a long pause — it is to
 * guarantee the tail of the gesture that brought the section in cannot
 * leak into the horizontal travel. At 0.35 of a viewport it took three
 * separate pushes to get the first slide to change, which is a beat too
 * many; the snap threshold above does the rest of the work.
 */
const ARRIVAL_VIEWPORTS = 0.15;

/*
 * Share of one transition a gesture must cover before it commits to the
 * next slide. Below this the snap returns to the slide it started from.
 *
 * This is the swipe threshold every touch carousel has. It keeps a
 * stray pixel of scroll, a trackpad tremor, or the tail of the gesture
 * that brought the section in from counting as "next slide".
 */
const COMMIT_THRESHOLD = 0.06;

/*
 * How long the snap takes to carry one slide into place.
 *
 * This is the single biggest lever on how fast the section FEELS. A
 * slide is a full viewport wide, so at the previous 0.25-0.6s the photo
 * crossed the screen at roughly 3,500px/s, which read as a flick rather
 * than a transition. Note that the scrub below adds its own settling
 * time on top of these figures — the two were tuned together against a
 * measured target of a little over a second for the whole move, the
 * pace of a camera push rather than a cut.
 */
const SNAP_DURATION = { min: 0.6, max: 0.9 };

/*
 * Pause after scrolling stops before the snap takes over.
 *
 * At the previous 0.06s it could fire between two wheel events inside a
 * single continuous gesture, so the page appeared to lurch away
 * mid-scroll. This is long enough to be confident the gesture has
 * actually ended and still short enough not to read as hesitation.
 */
const SNAP_DELAY = 0.12;

const CAPTION_OUT_DURATION = 0.28;
const CAPTION_IN_DURATION = 0.55;

export default function ProjectGalleryClient({ slides }) {
  /*
   * How many slides actually appear is decided upstream, in
   * shapeProjectGalleryContent (@/content/sections/projectGallery) — it
   * only counts a slide as "added" once an editor has uploaded a real
   * photo for it. The wrapper height, rail width, travel distance and
   * pagination below are all derived from whatever length this array is,
   * so raising or lowering the count in the panel needs no code change.
   */
  const visibleSlides = slides;
  const slideCount = visibleSlides.length;
  const transitionCount = Math.max(1, slideCount - 1);

  const [activeIndex, setActiveIndex] = useState(0);

  const scrollWrapperRef = useRef(null);
  const viewportRef = useRef(null);
  const railRef = useRef(null);
  const trackRef = useRef(null);
  const trackFillRef = useRef(null);
  const captionRef = useRef(null);
  const activeIndexRef = useRef(0);

  /*
   * Track geometry, cached on ScrollTrigger refresh rather than read
   * per frame: measuring offsetWidth mid-scroll forces a synchronous
   * layout, which is exactly the stutter this section is meant not to
   * have.
   */
  const trackTravelRef = useRef(0);

  const setActive = useCallback((index) => {
    if (index === activeIndexRef.current) {
      return;
    }

    activeIndexRef.current = index;
    setActiveIndex(index);
  }, []);

  /*
   * The scrubber moves every scroll frame, so it is written straight to
   * the DOM rather than held in React state, and it is moved with
   * `x` only. The previous version animated `left`, which is not a
   * compositable property — every frame invalidated layout for the
   * whole pagination row to move a 150px bar.
   */
  const positionTrackFill = useCallback((progress) => {
    const trackFill = trackFillRef.current;

    if (!trackFill) {
      return;
    }

    gsap.set(trackFill, { x: progress * trackTravelRef.current });
  }, []);

  const measureTrack = useCallback(() => {
    const track = trackRef.current;
    const trackFill = trackFillRef.current;

    if (!track || !trackFill) {
      return;
    }

    trackTravelRef.current = Math.max(
      0,
      track.offsetWidth - trackFill.offsetWidth,
    );
  }, []);

  useGSAP(
    () => {
      const wrapper = scrollWrapperRef.current;
      const viewport = viewportRef.current;
      const rail = railRef.current;
      const caption = captionRef.current;

      if (!wrapper || !viewport || !rail || !caption || slideCount <= 1) {
        return undefined;
      }

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      measureTrack();

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
        gsap.set(caption, { clearProps: "opacity,visibility,y" });
        positionTrackFill(0);

        const handleRailScroll = () => {
          const travel = rail.scrollWidth - rail.clientWidth;
          const progress = travel > 0 ? rail.scrollLeft / travel : 0;

          positionTrackFill(progress);
          setActive(Math.round(progress * transitionCount));
        };

        rail.addEventListener("scroll", handleRailScroll, { passive: true });
        window.addEventListener("resize", measureTrack);

        return () => {
          rail.removeEventListener("scroll", handleRailScroll);
          window.removeEventListener("resize", measureTrack);
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
      const railTravelPercent = (100 * transitionCount) / slideCount;
      const increment = 1 / transitionCount;

      const arrivalDistance = () => viewport.offsetHeight * ARRIVAL_VIEWPORTS;
      const travelDistance = () =>
        viewport.offsetHeight *
        transitionCount *
        SCROLL_VIEWPORTS_PER_TRANSITION;

      /*
       * One gesture, one whole slide — computed from where the section
       * actually IS, not from where GSAP predicts the scroll would
       * coast to.
       *
       * This is the bug that made the section feel violent. GSAP hands
       * a snap function a velocity projection, and with a scrubbed
       * trigger a single wheel flick from the very start of the journey
       * projected 0.79 of the way through it while the real progress
       * was 0.11. Rounding that projection to the nearest slide sent
       * the visitor to the LAST slide, skipping the middle one
       * entirely, from one flick.
       *
       * Quantising the real position instead makes it deterministic:
       * round away from where we are, in the direction of travel, so
       * any gesture commits to exactly the next slide and a long
       * gesture can still carry further. Momentum projection belongs to
       * inertial scrolling, not to a pager.
       */
      const snapToSlide = (naturalValue, self) => {
        const raw = self.progress / increment;
        const forward = self.direction !== -1;

        /*
         * The slide being left behind, then how far past it the gesture
         * actually carried. Taken from the direction of travel rather
         * than from the nearest slide: past the half way point the
         * nearest slide is the one ahead, and rounding to it would send
         * a backward gesture forwards.
         */
        const from = forward ? Math.floor(raw) : Math.ceil(raw);
        const travelled = Math.abs(raw - from);

        const index =
          travelled < COMMIT_THRESHOLD ? from : from + (forward ? 1 : -1);

        return gsap.utils.clamp(0, 1, index * increment);
      };

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

          /*
           * Both ends measured off .viewport rather than declared
           * against the wrapper, because .viewport is position: sticky —
           * the wrapper's own height includes the arrival hold, and a
           * short screen where .viewport hits a min-height would put
           * the two out of step.
           *
           * Start is offset by the arrival hold, so progress 0 is the
           * section already filling the screen and settled, not the
           * moment it first touches full coverage.
           */
          start: () => `top top-=${arrivalDistance()}`,
          end: () => `top top-=${arrivalDistance() + travelDistance()}`,

          /*
           * Low deliberately, because it STACKS with the snap. The snap
           * animates the scroll position and the rail follows the scroll
           * through this smoothing, so the photo keeps easing for
           * roughly this long after the snap tween has already
           * finished. At 0.8 the full settle measured just over two
           * seconds, which overshot "cinematic" into "sluggish". The
           * snap owns the pacing; this only takes the edge off a raw
           * wheel gesture.
           */
          scrub: 0.3,
          invalidateOnRefresh: true,
          onRefresh: measureTrack,

          snap: {
            snapTo: snapToSlide,
            duration: SNAP_DURATION,
            delay: SNAP_DELAY,
            ease: "power2.inOut",

            /*
             * The caption steps aside while the photo travels, rather
             * than the old text being swapped out from under the
             * reader mid-move. Fading out is tied to the snap starting;
             * fading back in is tied to the index changing (below), so
             * the text cannot be left invisible if a snap is
             * interrupted before it completes.
             */
            onStart: () => {
              gsap.to(caption, {
                autoAlpha: 0,
                y: -8,
                duration: CAPTION_OUT_DURATION,
                ease: "power2.in",
                overwrite: "auto",
              });
            },

            onInterrupt: () => {
              gsap.to(caption, {
                autoAlpha: 1,
                y: 0,
                duration: CAPTION_IN_DURATION,
                ease: ENTRANCE_EASE,
                overwrite: "auto",
              });
            },

            onComplete: () => {
              gsap.to(caption, {
                autoAlpha: 1,
                y: 0,
                duration: CAPTION_IN_DURATION,
                ease: ENTRANCE_EASE,
                overwrite: "auto",
              });
            },
          },

          onUpdate: (self) => {
            positionTrackFill(self.progress);
            setActive(Math.round(self.progress * transitionCount));
          },
        },
      });

      return () => {
        drift.scrollTrigger?.kill();
        drift.kill();
      };
    },
    {
      dependencies: [
        slideCount,
        transitionCount,
        measureTrack,
        positionTrackFill,
        setActive,
      ],
      revertOnUpdate: true,
    },
  );

  /*
   * Bring the caption back as the new slide's text lands. Keyed to the
   * index rather than to the snap finishing, so the text is always
   * restored by the same thing that changed it.
   */
  useGSAP(
    () => {
      const caption = captionRef.current;

      if (!caption) {
        return;
      }

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set(caption, { autoAlpha: 1, y: 0 });

        return;
      }

      gsap.fromTo(
        caption,
        { autoAlpha: 0, y: 10 },
        {
          autoAlpha: 1,
          y: 0,
          duration: CAPTION_IN_DURATION,
          ease: ENTRANCE_EASE,
          overwrite: "auto",
        },
      );
    },
    { dependencies: [activeIndex] },
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
        style={{
          "--pg-slides": slideCount,
          "--pg-scroll-viewports":
            1 +
            ARRIVAL_VIEWPORTS +
            (slideCount - 1) * SCROLL_VIEWPORTS_PER_TRANSITION,
        }}
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
            <div ref={captionRef} className={styles.caption}>
              <h2 className={styles.heading}>{activeSlide.heading}</h2>

              <p className={styles.text}>{activeSlide.text}</p>
            </div>

            <div className={styles.pagination}>
              <div ref={trackRef} className={styles.track} aria-hidden="true">
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

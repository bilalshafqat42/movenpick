"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { ENTRANCE_STAGGER, ENTRANCE_DURATION, ENTRANCE_EASE } from "@/lib/motion";
import styles from "./Amenities.module.css";

/*
 * Each item's photo wipes open from a different edge — matching the
 * approved design spec (item 1 right-to-left, item 2 top-to-bottom,
 * item 3 left-to-right, item 4 top-to-bottom). Expressed as the
 * clip-path inset() an item's image starts fully hidden at, since it
 * always animates to inset(0% 0% 0% 0%) (fully revealed) from there —
 * the hidden edge is simply the one the reveal grows outward from.
 */
const WIPE_START_CLIP_PATHS = [
  "inset(0% 0% 0% 100%)", // right to left
  "inset(0% 0% 100% 0%)", // top to bottom
  "inset(0% 100% 0% 0%)", // left to right
  "inset(0% 0% 100% 0%)", // top to bottom
];
const WIPE_END_CLIP_PATH = "inset(0% 0% 0% 0%)";

function wipeStartClipPath(index) {
  return WIPE_START_CLIP_PATHS[index % WIPE_START_CLIP_PATHS.length];
}

export default function AmenitiesClient({ heading, introText, items, ctaLabel }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const introRef = useRef(null);
  const itemsGroupRef = useRef(null);
  const ctaGroupRef = useRef(null);
  const descriptionRef = useRef(null);
  const stageWrapperRef = useRef(null);
  const imagePanelRef = useRef(null);
  const imageLayerRef = useRef(null);
  const progressFillRef = useRef(null);

  /*
   * One persistent wipe layer per item, stacked on top of each other,
   * rather than swapping a single <Image> in and out. Swapping meant
   * the outgoing photo vanished the instant the active index changed,
   * so the (beige) page background showed through underneath the new
   * photo's wipe instead of the previous photo — and remounting
   * next/image's <Image> on every swap re-triggered its load, which is
   * what made the transition feel janky rather than smooth. Keeping
   * all four mounted and simply re-ordering/animating their clip-paths
   * fixes both: the previous photo stays put underneath, so the new
   * one visibly wipes over it, and nothing ever re-loads.
   */
  const imageLayersRef = useRef([]);
  const layerZIndexRef = useRef(0);

  const isFirstSwapRef = useRef(true);
  const activeIndexRef = useRef(0);
  const stageTriggerRef = useRef(null);
  const isJumpingRef = useRef(false);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const headingEl = headingRef.current;
      const introEl = introRef.current;
      const itemsGroup = itemsGroupRef.current;
      const ctaGroup = ctaGroupRef.current;
      const imagePanel = imagePanelRef.current;
      const imageLayer = imageLayerRef.current;

      if (
        !section ||
        !headingEl ||
        !introEl ||
        !itemsGroup ||
        !ctaGroup ||
        !imagePanel ||
        !imageLayer
      ) {
        return;
      }

      const contentReveal = [headingEl, introEl, itemsGroup, ctaGroup];
      const matchMedia = gsap.matchMedia();

      matchMedia.add(
        {
          desktop: "(min-width: 1025px)",
          mobile: "(max-width: 767px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { desktop = false, mobile = false, reduceMotion = false } =
            context.conditions ?? {};

          if (reduceMotion) {
            gsap.set(imagePanel, { clipPath: "none" });
            gsap.set(imageLayer, { clearProps: "transform" });
            gsap.set(contentReveal, { autoAlpha: 1, y: 0 });

            return;
          }

          /*
           * Content: heading, intro text, item list, then closing
           * text + button — each ENTRANCE_STAGGER after the previous,
           * same rhythm as every other entrance on the site.
           */
          gsap.set(contentReveal, {
            autoAlpha: 0,
            y: mobile ? 24 : 32,
          });

          const contentTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: mobile ? "top 78%" : "top 72%",
              once: true,
            },
          });

          contentTimeline.to(contentReveal, {
            autoAlpha: 1,
            y: 0,
            duration: ENTRANCE_DURATION,
            stagger: ENTRANCE_STAGGER,
            ease: ENTRANCE_EASE,
          });

          /*
           * Image: right-to-left clip-path wipe scrubbed to scroll
           * position, same technique as the Payment section's photo.
           * This is the FIRST reveal only — the pinned, stage-by-stage
           * journey below is a separate, later scroll range. It wipes
           * .imagePanel itself (revealing whichever item layer is on
           * top — item 0 — beneath it); the item layers' own clip-paths
           * below are for swapping between items, not this entrance.
           */
          const layers = imageLayersRef.current;

          layers.forEach((layer, index) => {
            if (!layer) return;

            gsap.set(layer, {
              clipPath: index === 0 ? WIPE_END_CLIP_PATH : wipeStartClipPath(index),
              zIndex: index === 0 ? layers.length : index,
            });
          });

          layerZIndexRef.current = layers.length;

          gsap.set(imagePanel, {
            clipPath: wipeStartClipPath(0),
          });

          gsap.set(imageLayer, {
            scale: mobile ? 1.035 : 1.055,
            xPercent: mobile ? 2 : 4,
            transformOrigin: "center center",
          });

          const imageTimeline = gsap.timeline({
            defaults: { ease: "none" },

            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "top top",
              scrub: mobile ? 0.55 : 0.8,
              invalidateOnRefresh: true,
            },
          });

          imageTimeline
            .to(imagePanel, { clipPath: WIPE_END_CLIP_PATH, duration: 1 }, 0)
            .to(imageLayer, { scale: 1, xPercent: 0, duration: 1 }, 0);

          let stageTrigger;

          /*
           * Pinned, scroll-driven stages — desktop only. .stageWrapper is
           * a tall (items.length * 100vh) block; .stickyViewport inside
           * it is `position: sticky`, so it stays put on screen for that
           * entire scroll distance without needing GSAP's own pinning.
           * As the visitor scrolls through it, this maps scroll progress
           * (0 to 1) onto which item is "active" and how far the
           * continuous progress fill has grown — both a step index and a
           * smooth parallax drift on the photo, all from one number.
           */
          if (desktop) {
            const stageWrapper = stageWrapperRef.current;
            const progressFill = progressFillRef.current;

            if (stageWrapper && progressFill) {
              gsap.set(progressFill, {
                scaleY: 0,
                transformOrigin: "top center",
              });

              stageTrigger = ScrollTrigger.create({
                trigger: stageWrapper,
                start: "top top",
                end: "bottom bottom",
                scrub: 0.3,
                invalidateOnRefresh: true,

                onUpdate: (self) => {
                  gsap.set(progressFill, { scaleY: self.progress });

                  gsap.set(imageLayer, {
                    yPercent: (self.progress - 0.5) * 6,
                  });

                  /*
                   * Skipped while a click-triggered jump (see
                   * jumpToStage below) is scrolling the page there
                   * programmatically — otherwise every intermediate
                   * step the scroll passes through on the way would
                   * flash its own swap animation before landing on
                   * the one actually clicked.
                   */
                  if (isJumpingRef.current) {
                    return;
                  }

                  const stepIndex = Math.min(
                    items.length - 1,
                    Math.floor(self.progress * items.length),
                  );

                  if (stepIndex !== activeIndexRef.current) {
                    activeIndexRef.current = stepIndex;
                    setActiveIndex(stepIndex);
                  }
                },
              });

              stageTriggerRef.current = stageTrigger;
            }
          }

          return () => {
            contentTimeline.kill();
            imageTimeline.kill();
            stageTrigger?.kill();
            stageTriggerRef.current = null;
          };
        },
      );

      return () => {
        matchMedia.revert();
      };
    },
    { scope: sectionRef, dependencies: [items.length] },
  );

  /*
   * Swapping the active item: a separate animation from the entrance
   * above, driven by the pinned scroll journey on desktop (or by
   * hover/focus/click as a fallback everywhere the pin is disabled).
   * Skipped only on this component's very first render — every change
   * after that runs it, regardless of whether the entrance timeline
   * above has fired yet. (An earlier version gated this on the entrance
   * timeline actually completing, which meant interacting with the
   * section before that finished silently disarmed it forever.)
   */
  useGSAP(
    () => {
      if (isFirstSwapRef.current) {
        isFirstSwapRef.current = false;

        return;
      }

      const description = descriptionRef.current;
      const layer = imageLayersRef.current[activeIndex];

      if (!description || !layer) {
        return;
      }

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      /*
       * Bring the incoming layer above every other item's layer before
       * animating it in, so it visibly wipes over whichever photo was
       * showing before — not the page background.
       */
      layerZIndexRef.current += 1;
      gsap.set(layer, { zIndex: layerZIndexRef.current });

      if (reduceMotion) {
        gsap.set([description, layer], { autoAlpha: 1, clipPath: "none" });

        return;
      }

      gsap.set(description, { autoAlpha: 0, y: 16 });
      gsap.set(layer, { clipPath: wipeStartClipPath(activeIndex) });

      gsap.to(description, {
        autoAlpha: 1,
        y: 0,
        duration: ENTRANCE_DURATION,
        ease: ENTRANCE_EASE,
      });

      gsap.to(layer, {
        clipPath: WIPE_END_CLIP_PATH,
        duration: ENTRANCE_DURATION,
        ease: ENTRANCE_EASE,
        overwrite: "auto",
      });
    },
    { scope: sectionRef, dependencies: [activeIndex] },
  );

  const activeItem = items[activeIndex] ?? items[0];

  const selectIndex = (index) => {
    activeIndexRef.current = index;
    setActiveIndex(index);
  };

  /*
   * Clicking a heading: on desktop, the active stage is normally
   * driven purely by scroll position, so just setting state (like
   * selectIndex above, used for hover/focus) would get overwritten by
   * the very next scroll tick's recomputed step — the click would
   * flash and immediately revert. Scrolling the page itself to a
   * point inside that stage's range makes the change actually stick.
   * Falls back to selectIndex wherever the pin is disabled (tablet,
   * mobile, reduced motion) and no stage ScrollTrigger exists.
   */
  const jumpToStage = (index) => {
    const trigger = stageTriggerRef.current;

    if (!trigger || index === activeIndexRef.current) {
      selectIndex(index);
      return;
    }

    isJumpingRef.current = true;
    activeIndexRef.current = index;
    setActiveIndex(index);

    const stageProgress = (index + 0.5) / items.length;
    const targetY = trigger.start + stageProgress * (trigger.end - trigger.start);

    gsap.to(window, {
      scrollTo: { y: targetY, autoKill: true },
      duration: 0.9,
      ease: ENTRANCE_EASE,
      onComplete: () => {
        isJumpingRef.current = false;
      },
    });
  };

  return (
    <section
      ref={sectionRef}
      id="amenities"
      className={styles.amenities}
      aria-labelledby="amenities-heading"
    >
      <div className={styles.intro}>
        <h2 ref={headingRef} id="amenities-heading" className={styles.heading}>
          {heading}
        </h2>

        <p ref={introRef} className={styles.introText}>
          {introText}
        </p>
      </div>

      <div
        ref={stageWrapperRef}
        className={styles.stageWrapper}
        style={{ height: `${items.length * 100}vh` }}
      >
        <div className={styles.stickyViewport}>
          <div className={styles.body}>
            <div className={styles.content}>
              <div className={styles.itemsWrapper}>
                <div className={styles.progressTrack} aria-hidden="true">
                  <div ref={progressFillRef} className={styles.progressFill} />
                </div>

                <ul ref={itemsGroupRef} className={styles.items}>
                  {items.map((item, index) => (
                    <li key={index}>
                      <button
                        type="button"
                        className={styles.item}
                        data-active={index === activeIndex}
                        onMouseEnter={() => selectIndex(index)}
                        onFocus={() => selectIndex(index)}
                        onClick={() => jumpToStage(index)}
                      >
                        <span className={styles.itemTitle}>{item.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <hr className={styles.divider} />

              <div ref={ctaGroupRef} className={styles.ctaGroup}>
                <p ref={descriptionRef} className={styles.ctaText}>
                  {activeItem.description}
                </p>

                <button
                  type="button"
                  className={styles.requestButton}
                  data-contact-popup
                >
                  <span>{ctaLabel}</span>
                  <span className={styles.linkIcon} aria-hidden="true">
                    →
                  </span>
                </button>
              </div>
            </div>

            <div ref={imagePanelRef} className={styles.imagePanel}>
              <div ref={imageLayerRef} className={styles.imageLayer}>
                {items.map((item, index) => (
                  <div
                    key={index}
                    ref={(node) => {
                      imageLayersRef.current[index] = node;
                    }}
                    className={styles.imageWipe}
                  >
                    <Image
                      src={item.image}
                      alt={item.imageAlt}
                      fill
                      quality={90}
                      priority={index === 0}
                      sizes="(max-width: 767px) 100vw, 60vw"
                      className={styles.image}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { useRef } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import styles from "./Amenities.module.css";

export default function AmenitiesClient({ eyebrow, items }) {
  const sectionRef = useRef(null);
  const stickyRef = useRef(null);
  const imagePanelRef = useRef(null);
  const contentPanelRef = useRef(null);

  const itemRefs = useRef([]);
  const imageRefs = useRef([]);
  const progressRefs = useRef([]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const sticky = stickyRef.current;
      const imagePanel = imagePanelRef.current;
      const contentPanel = contentPanelRef.current;

      const itemEls = itemRefs.current.filter(Boolean);
      const images = imageRefs.current.filter(Boolean);
      const progressLines = progressRefs.current.filter(Boolean);

      if (
        !section ||
        !sticky ||
        !imagePanel ||
        !contentPanel ||
        itemEls.length !== items.length ||
        images.length !== items.length
      ) {
        return;
      }

      const matchMedia = gsap.matchMedia();

      matchMedia.add(
        {
          desktop: "(min-width: 768px)",
          mobile: "(max-width: 767px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { mobile = false, reduceMotion = false } =
            context.conditions ?? {};

          const setActiveProgress = (activeIndex) => {
            progressLines.forEach((line, index) => {
              if (!line) {
                return;
              }

              line.dataset.active = index === activeIndex ? "true" : "false";
            });
          };

          if (reduceMotion) {
            gsap.set(sticky, {
              clipPath: "none",
            });

            gsap.set([imagePanel, contentPanel], {
              clearProps: "transform",
            });

            gsap.set(itemEls, {
              position: "relative",
              autoAlpha: 1,
              y: 0,
              pointerEvents: "auto",
              clearProps: "transform",
            });

            images.forEach((image, index) => {
              gsap.set(image, {
                clipPath: "none",
                scale: 1,
                yPercent: 0,
                autoAlpha: index === 0 ? 1 : 0,
              });
            });

            progressLines.forEach((line) => {
              if (line) {
                line.dataset.active = "false";
              }
            });

            return;
          }

          /*
           * Motion settings.
           *
           * These values keep the animation smooth
           * and editorial without making it feel slow.
           */
          const travelDistance = mobile ? 64 : 88;
          const openingHold = mobile ? 0.26 : 0.34;
          const readingHold = mobile ? 0.24 : 0.32;
          const exitDuration = mobile ? 0.4 : 0.46;
          const emptyGap = mobile ? 0.04 : 0.06;
          const enterDuration = mobile ? 0.56 : 0.64;
          const finalHold = mobile ? 0.32 : 0.4;

          /*
           * Initial section reveal from bottom to top.
           */
          gsap.set(sticky, {
            clipPath: "inset(100% 0% 0% 0%)",
          });

          const revealTween = gsap.to(sticky, {
            clipPath: "inset(0% 0% 0% 0%)",
            ease: "none",

            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "top top",
              scrub: mobile ? 0.55 : 0.75,
              invalidateOnRefresh: true,
            },
          });

          /*
           * Subtle image settling movement.
           */
          const imageTween = gsap.fromTo(
            imagePanel,
            {
              yPercent: mobile ? 6 : 9,
              scale: mobile ? 1.025 : 1.035,
            },
            {
              yPercent: 0,
              scale: 1,
              ease: "none",

              scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "top top",
                scrub: mobile ? 0.55 : 0.75,
                invalidateOnRefresh: true,
              },
            },
          );

          /*
           * Right panel settles gently into place.
           */
          const contentTween = gsap.fromTo(
            contentPanel,
            {
              y: mobile ? 28 : 42,
            },
            {
              y: 0,
              ease: "none",

              scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "top top",
                scrub: mobile ? 0.55 : 0.75,
                invalidateOnRefresh: true,
              },
            },
          );

          /*
           * Only the first item is initially visible.
           */
          itemEls.forEach((item, index) => {
            gsap.set(item, {
              autoAlpha: index === 0 ? 1 : 0,
              y: index === 0 ? 0 : travelDistance,
              pointerEvents: index === 0 ? "auto" : "none",
              force3D: true,
            });
          });

          /*
           * Only the first image is initially revealed.
           * The rest sit clipped away behind it, ready to
           * rise into view like the About section's reveal.
           */
          images.forEach((image, index) => {
            gsap.set(image, {
              clipPath:
                index === 0 ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)",
              scale: index === 0 ? 1 : mobile ? 1.05 : 1.08,
              yPercent: index === 0 ? 0 : mobile ? 5 : 8,
              transformOrigin: "center center",
            });
          });

          setActiveProgress(0);

          let activeProgressIndex = 0;

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom bottom",

              scrub: mobile ? 0.65 : 0.9,
              invalidateOnRefresh: true,

              snap: {
                snapTo: "labelsDirectional",

                duration: {
                  min: 0.35,
                  max: mobile ? 0.62 : 0.82,
                },

                delay: mobile ? 0.2 : 0.16,
                ease: "power2.inOut",
                inertia: false,
              },

              onUpdate: () => {
                const duration = timeline.duration();

                if (!duration) {
                  return;
                }

                const currentTime = timeline.time();

                let nearestIndex = 0;
                let nearestDistance = Number.POSITIVE_INFINITY;

                items.forEach((_, index) => {
                  const labelTime = timeline.labels[`item-${index}`];

                  if (typeof labelTime !== "number") {
                    return;
                  }

                  const distance = Math.abs(currentTime - labelTime);

                  if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = index;
                  }
                });

                if (nearestIndex !== activeProgressIndex) {
                  activeProgressIndex = nearestIndex;
                  setActiveProgress(nearestIndex);
                }
              },
            },
          });

          /*
           * First stable reading state.
           */
          timeline.addLabel("item-0", 0);

          /*
           * Give the first item enough time to be read
           * before starting the transition sequence.
           */
          timeline.to(
            {},
            {
              duration: openingHold,
            },
          );

          items.slice(0, -1).forEach((_, index) => {
            const currentItem = itemEls[index];
            const nextItem = itemEls[index + 1];
            const nextImage = images[index + 1];

            /*
             * Stable reading period.
             */
            timeline.to(
              {},
              {
                duration: readingHold,
              },
            );

            timeline.addLabel(`transition-${index}`);

            /*
             * Current content exits upward.
             */
            timeline.to(currentItem, {
              autoAlpha: 0,
              y: -travelDistance,
              pointerEvents: "none",
              duration: exitDuration,
              ease: "power2.inOut",
            });

            /*
             * Small visual pause between items.
             */
            timeline.to(
              {},
              {
                duration: emptyGap,
              },
            );

            /*
             * Next content rises smoothly from below.
             */
            timeline.fromTo(
              nextItem,
              {
                autoAlpha: 0,
                y: travelDistance,
                pointerEvents: "none",
              },
              {
                autoAlpha: 1,
                y: 0,
                pointerEvents: "auto",
                duration: enterDuration,
                ease: "power3.out",
              },
            );

            /*
             * The next image rises into view over the
             * current one, bottom to top, the same reveal
             * used for the About section's green panel.
             */
            const imageRevealDuration =
              exitDuration + emptyGap + enterDuration;

            timeline.fromTo(
              nextImage,
              {
                clipPath: "inset(100% 0% 0% 0%)",
                scale: mobile ? 1.05 : 1.08,
                yPercent: mobile ? 5 : 8,
              },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                scale: 1,
                yPercent: 0,
                duration: imageRevealDuration,
                ease: "power2.inOut",
              },
              `transition-${index}`,
            );

            timeline.addLabel(`item-${index + 1}`);
          });

          /*
           * Keep the final item readable before
           * the sticky section releases.
           */
          timeline.to(
            {},
            {
              duration: finalHold,
            },
          );

          return () => {
            timeline.kill();
            revealTween.kill();
            imageTween.kill();
            contentTween.kill();
          };
        },
      );

      return () => {
        matchMedia.revert();
      };
    },
    {
      scope: sectionRef,
      dependencies: [items],
    },
  );

  return (
    <section
      ref={sectionRef}
      id="amenities"
      className={styles.amenities}
      style={{
        "--amenities-height": `${items.length * 100}svh`,
        "--amenities-mobile-height": `${items.length * 90}svh`,
      }}
      aria-labelledby="amenities-heading"
    >
      <div ref={stickyRef} className={styles.stickyViewport}>
        <div ref={imagePanelRef} className={styles.imagePanel}>
          {items.map((item, index) => (
            <div
              key={item.title}
              ref={(element) => {
                imageRefs.current[index] = element;
              }}
              className={styles.imageFrame}
            >
              <Image
                src={item.image}
                alt={item.imageAlt}
                fill
                quality={90}
                priority={index === 0}
                sizes="(max-width: 767px) 100vw, 50vw"
                className={styles.image}
              />
            </div>
          ))}

          <div className={styles.imageOverlay} aria-hidden="true" />
        </div>

        <div ref={contentPanelRef} className={styles.contentPanel}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>{eyebrow}</p>
          </div>

          <div className={styles.items}>
            {items.map((item, index) => (
              <article
                key={item.title}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                className={styles.item}
              >
                <h3 className={styles.title}>{item.title}</h3>

                <p className={styles.description}>{item.description}</p>
              </article>
            ))}
          </div>

          <button
            type="button"
            className={styles.requestLink}
            data-contact-popup
          >
            <span>Submit Request</span>
            <span className={styles.linkIcon} aria-hidden="true">
              →
            </span>
          </button>

          <div className={styles.progress} aria-hidden="true">
            {items.map((item, index) => (
              <span
                key={item.title}
                ref={(element) => {
                  progressRefs.current[index] = element;
                }}
                className={styles.progressLine}
                data-active={index === 0 ? "true" : "false"}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

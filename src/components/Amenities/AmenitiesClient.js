"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import { ENTRANCE_STAGGER, ENTRANCE_DURATION, ENTRANCE_EASE } from "@/lib/motion";
import styles from "./Amenities.module.css";

export default function AmenitiesClient({
  heading,
  introText,
  items,
  ctaText,
  ctaLabel,
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const introRef = useRef(null);
  const itemsGroupRef = useRef(null);
  const ctaGroupRef = useRef(null);
  const imagePanelRef = useRef(null);
  const imageLayerRef = useRef(null);

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
          mobile: "(max-width: 767px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { mobile = false, reduceMotion = false } =
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
           */
          gsap.set(imagePanel, {
            clipPath: "inset(0% 0% 0% 100%)",
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
            .to(imagePanel, { clipPath: "inset(0% 0% 0% 0%)", duration: 1 }, 0)
            .to(imageLayer, { scale: 1, xPercent: 0, duration: 1 }, 0);

          return () => {
            contentTimeline.kill();
            imageTimeline.kill();
          };
        },
      );

      return () => {
        matchMedia.revert();
      };
    },
    { scope: sectionRef },
  );

  const activeItem = items[activeIndex] ?? items[0];

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

      <div className={styles.body}>
        <div className={styles.content}>
          <ul ref={itemsGroupRef} className={styles.items}>
            {items.map((item, index) => (
              <li key={item.title}>
                <button
                  type="button"
                  className={styles.item}
                  data-active={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                >
                  <span className={styles.itemBar} aria-hidden="true" />
                  <span className={styles.itemTitle}>{item.title}</span>
                </button>
              </li>
            ))}
          </ul>

          <hr className={styles.divider} />

          <div ref={ctaGroupRef} className={styles.ctaGroup}>
            <p className={styles.ctaText}>{ctaText}</p>

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
            <Image
              key={activeIndex}
              src={activeItem.image}
              alt={activeItem.imageAlt}
              fill
              quality={90}
              sizes="(max-width: 767px) 100vw, 60vw"
              className={styles.image}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

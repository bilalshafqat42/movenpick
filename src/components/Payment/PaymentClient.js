"use client";

import SafeImage from "@/components/SafeImage";
import { useRef } from "react";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { ENTRANCE_STAGGER, ENTRANCE_DURATION, ENTRANCE_EASE } from "@/lib/motion";
import styles from "./Payment.module.css";

export default function PaymentClient({
  heading,
  text,
  image,
  imageFallback,
  imageAlt,
  milestones,
}) {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const textRef = useRef(null);
  const imagePanelRef = useRef(null);
  const imageLayerRef = useRef(null);
  const tableRef = useRef(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const headingEl = headingRef.current;
      const textEl = textRef.current;
      const imagePanel = imagePanelRef.current;
      const imageLayer = imageLayerRef.current;
      const table = tableRef.current;

      if (
        !section ||
        !headingEl ||
        !textEl ||
        !imagePanel ||
        !imageLayer ||
        !table
      ) {
        return;
      }

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set([headingEl, textEl, table], { autoAlpha: 1, y: 0 });
        gsap.set(imagePanel, { clipPath: "none" });
        gsap.set(imageLayer, { clearProps: "transform" });

        return;
      }

      const mobile = window.matchMedia("(max-width: 767px)").matches;

      /*
       * Top heading + intro, same staggered rhythm as every other section.
       */
      gsap.set([headingEl, textEl], { autoAlpha: 0, y: 24 });

      const introTrigger = ScrollTrigger.create({
        trigger: section,
        start: "top 78%",
        once: true,

        onEnter: () => {
          gsap.to([headingEl, textEl], {
            autoAlpha: 1,
            y: 0,
            duration: ENTRANCE_DURATION,
            stagger: ENTRANCE_STAGGER,
            ease: ENTRANCE_EASE,
          });
        },
      });

      /*
       * Photo: right-to-left clip-path wipe scrubbed to scroll position,
       * same technique used across the site (Amenities, Trusted Partner).
       */
      gsap.set(imagePanel, { clipPath: "inset(0% 0% 0% 100%)" });
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

      /*
       * Milestone rows, staggered in once the table scrolls into view.
       */
      const rows = Array.from(table.children);

      gsap.set(rows, { autoAlpha: 0, y: 18 });

      const rowsTrigger = ScrollTrigger.create({
        trigger: table,
        start: "top 82%",
        once: true,

        onEnter: () => {
          gsap.to(rows, {
            autoAlpha: 1,
            y: 0,
            duration: ENTRANCE_DURATION,
            stagger: ENTRANCE_STAGGER * 0.6,
            ease: ENTRANCE_EASE,
          });
        },
      });

      return () => {
        introTrigger.kill();
        imageTimeline.kill();
        rowsTrigger.kill();
      };
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="payment-plan"
      className={styles.payment}
      aria-labelledby="payment-title"
    >
      <div className={styles.intro}>
        <h2 ref={headingRef} id="payment-title" className={styles.heading}>
          {heading}
        </h2>

        <p ref={textRef} className={styles.text}>
          {text}
        </p>
      </div>

      <div className={styles.body}>
        <div ref={imagePanelRef} className={styles.imagePanel}>
          <div ref={imageLayerRef} className={styles.imageLayer}>
            <SafeImage
              src={image}
              fallbackSrc={imageFallback}
              alt={imageAlt}
              fill
              quality={90}
              sizes="(max-width: 767px) 100vw, 50vw"
              className={styles.image}
            />
          </div>
        </div>

        <div className={styles.tablePanel}>
          <div className={styles.tableHeader}>
            <span>Milestone</span>
            <span>%</span>
          </div>

          <div ref={tableRef} className={styles.table}>
            {milestones.map((milestone, index) => (
              <div className={styles.row} key={index}>
                <div className={styles.rowTop}>
                  <span className={styles.rowLabel}>{milestone.label}</span>
                  <span className={styles.rowPercent}>{milestone.percent}</span>
                </div>

                <p className={styles.rowSublabel}>{milestone.sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useRef } from "react";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { ENTRANCE_STAGGER, ENTRANCE_DURATION, ENTRANCE_EASE } from "@/lib/motion";
import styles from "./ProjectOverview.module.css";

export default function ProjectOverviewClient({
  description,
  stats,
  cta1Label,
  cta1Href,
  cta2Label,
  cta2Href,
}) {
  const sectionRef = useRef(null);
  const descriptionRef = useRef(null);
  const dividerRef = useRef(null);
  const statsRef = useRef(null);
  const ctaRowRef = useRef(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const descriptionEl = descriptionRef.current;
      const divider = dividerRef.current;
      const statItems = statsRef.current
        ? Array.from(statsRef.current.querySelectorAll(`.${styles.stat}`))
        : [];
      const ctaRow = ctaRowRef.current;

      if (!section || !descriptionEl || !divider || !ctaRow) {
        return;
      }

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set([descriptionEl, divider, ...statItems, ctaRow], {
          autoAlpha: 1,
          y: 0,
        });

        return;
      }

      gsap.set([descriptionEl, divider, ...statItems, ctaRow], {
        autoAlpha: 0,
        y: 24,
      });

      ScrollTrigger.create({
        trigger: section,
        start: "top 78%",
        once: true,

        onEnter: () => {
          const timeline = gsap.timeline({ defaults: { ease: ENTRANCE_EASE } });

          timeline
            .to(descriptionEl, {
              autoAlpha: 1,
              y: 0,
              duration: ENTRANCE_DURATION,
            })
            .to(
              divider,
              { autoAlpha: 1, y: 0, duration: ENTRANCE_DURATION },
              ENTRANCE_STAGGER,
            )
            .to(statItems, {
              autoAlpha: 1,
              y: 0,
              duration: ENTRANCE_DURATION,
              stagger: ENTRANCE_STAGGER,
            }, ENTRANCE_STAGGER * 2)
            .to(
              ctaRow,
              { autoAlpha: 1, y: 0, duration: ENTRANCE_DURATION },
              ENTRANCE_STAGGER * 2 + ENTRANCE_STAGGER * statItems.length + ENTRANCE_STAGGER,
            );
        },
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="project-overview"
      className={styles.projectOverview}
      aria-labelledby="project-overview-description"
    >
      <h2
        ref={descriptionRef}
        id="project-overview-description"
        className={styles.description}
      >
        {description}
      </h2>

      <hr ref={dividerRef} className={styles.divider} />

      <div ref={statsRef} className={styles.stats}>
        {stats.map((stat, index) => (
          <div className={styles.stat} key={index}>
            <p className={styles.statValue}>{stat.value}</p>
            <p className={styles.statLabel}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div ref={ctaRowRef} className={styles.ctaRow}>
        <a
          href={cta1Href}
          className={styles.ctaButton}
          {...(cta1Href === "#contact" ? { "data-contact-popup": true } : {})}
        >
          <span>{cta1Label}</span>
          <span className={styles.ctaIcon} aria-hidden="true">
            →
          </span>
        </a>

        <a
          href={cta2Href}
          download="movenpick-brochure.pdf"
          className={styles.ctaButton}
        >
          <span>{cta2Label}</span>
          <span className={styles.ctaIcon} aria-hidden="true">
            ↓
          </span>
        </a>
      </div>
    </section>
  );
}

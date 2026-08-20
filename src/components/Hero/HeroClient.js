"use client";

import Image from "next/image";
import SafeImage from "@/components/SafeImage";
import { useCallback, useRef } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import { ENTRANCE_STAGGER, ENTRANCE_DURATION, ENTRANCE_EASE } from "@/lib/motion";
import styles from "./Hero.module.css";

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

    const imageSection = imageSectionRef.current;

    if (!imageSection) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const rect = imageSection.getBoundingClientRect();
    const targetY = window.scrollY + rect.bottom - window.innerHeight;

    gsap.to(window, {
      scrollTo: { y: targetY, autoKill: false },
      duration: reduceMotion ? 0 : 1.4,
      ease: "power2.inOut",
      overwrite: true,
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
            sizes="(max-width: 1024px) 88vw, 66.667vw"
            className={styles.image}
          />
        </div>
      </div>
    </section>
  );
}

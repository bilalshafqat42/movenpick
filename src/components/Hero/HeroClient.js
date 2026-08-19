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
  const imageBlockRef = useRef(null);

  /*
   * Clicking Scroll Down reveals the rest of the Hero itself — the framed
   * building photo and the pattern behind it — rather than jumping straight
   * into the About section below. `block: "end"` aligns the bottom of the
   * image block with the bottom of the viewport, so the whole composition
   * becomes visible without scrolling past it.
   */
  const revealImage = useCallback((event) => {
    event.preventDefault();

    const imageBlock = imageBlockRef.current;

    if (!imageBlock) {
      return;
    }

    imageBlock.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const content = contentRef.current;
      const scrollIndicator = scrollIndicatorRef.current;
      const imageBlock = imageBlockRef.current;

      if (!section || !content) {
        return;
      }

      const eyebrowEl = content.querySelector(`.${styles.eyebrow}`);
      const titleEl = content.querySelector(`.${styles.title}`);
      const subtitleEl = content.querySelector(`.${styles.subtitle}`);
      const imageFrameEl = imageBlock?.querySelector(`.${styles.imageFrame}`);
      const patternEl = imageBlock?.querySelector(`.${styles.patternShape}`);

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
The home of active wellness        </h1>

        <p className={styles.subtitle}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </p>
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

      <div ref={imageBlockRef} id="hero-image" className={styles.imageBlock}>
        <Image
          src="/images/hero/pattern.avif"
          alt=""
          aria-hidden="true"
          fill
          quality={80}
          sizes="100vw"
          className={styles.patternShape}
        />

        <div className={styles.imageFrame}>
          <SafeImage
            src={mainImage}
            fallbackSrc={mainImageFallback}
            alt="[Add Movenpick hero image description]"
            fill
            quality={85}
            sizes="(max-width: 1024px) 88vw, 904px"
            className={styles.image}
          />
        </div>
      </div>
    </section>
  );
}

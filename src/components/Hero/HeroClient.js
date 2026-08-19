"use client";

import SafeImage from "@/components/SafeImage";
import { useCallback, useRef } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import styles from "./Hero.module.css";

export default function HeroClient({
  mainImage,
  mainImageFallback,
  eyebrow,
  heading,
  text,
  ctaLabel,
  ctaHref,
  ctaIcon,
}) {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const contentRef = useRef(null);
  const scrollIndicatorRef = useRef(null);

  /*
   * Clicking Scroll Down moves the page to the end
   * of the shared Hero/About scene.
   *
   * The Hero-to-About transition remains controlled
   * by the timeline inside page.js.
   */
  const revealAbout = useCallback((event) => {
    event.preventDefault();

    const scene = document.getElementById("hero-about-scene");

    if (!scene) {
      return;
    }

    const destination =
      scene.offsetTop + scene.offsetHeight - window.innerHeight;

    window.scrollTo({
      top: destination,
      behavior: "smooth",
    });
  }, []);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const image = imageRef.current;
      const content = contentRef.current;
      const scrollIndicator = scrollIndicatorRef.current;

      if (!section || !image || !content) {
        return;
      }

      const eyebrow = content.querySelector(`.${styles.eyebrow}`);
      const title = content.querySelector(`.${styles.title}`);
      const subtitle = content.querySelector(`.${styles.subtitle}`);
      const discoverLink = content.querySelector(`.${styles.discoverLink}`);

      if (!eyebrow || !title || !subtitle || !discoverLink) {
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
          const {
            desktop = false,
            mobile = false,
            reduceMotion = false,
          } = context.conditions ?? {};

          if (reduceMotion) {
            gsap.set(image, {
              scale: 1,
              yPercent: 0,
            });

            gsap.set(
              [eyebrow, title, subtitle, discoverLink, scrollIndicator],
              {
                autoAlpha: 1,
                y: 0,
              },
            );

            return;
          }

          /*
           * Initial Hero entrance.
           *
           * A small image scale is used so the background
           * remains sharper than the previous 1.09 scale.
           */
          const entranceTimeline = gsap.timeline({
            defaults: {
              ease: "power3.out",
            },
          });

          entranceTimeline
            .fromTo(
              image,
              {
                scale: mobile ? 1.01 : 1.015,
              },
              {
                scale: 1,
                duration: mobile ? 1.4 : 1.7,
                ease: "power2.out",
              },
              0,
            )
            .fromTo(
              eyebrow,
              {
                autoAlpha: 0,
                y: mobile ? 22 : 28,
              },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.9,
              },
              0.38,
            )
            .fromTo(
              title,
              {
                autoAlpha: 0,
                y: mobile ? 30 : 42,
              },
              {
                autoAlpha: 1,
                y: 0,
                duration: mobile ? 1 : 1.1,
              },
              0.5,
            )
            .fromTo(
              subtitle,
              {
                autoAlpha: 0,
                y: mobile ? 18 : 24,
              },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.85,
              },
              0.68,
            )
            .fromTo(
              discoverLink,
              {
                autoAlpha: 0,
                y: mobile ? 16 : 22,
              },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.8,
              },
              0.8,
            );

          /*
           * Scroll Down remains visible.
           *
           * It is no longer faded out through ScrollTrigger.
           * The About panel will naturally cover it during
           * the Hero-to-About transition.
           */
          if (scrollIndicator) {
            entranceTimeline.fromTo(
              scrollIndicator,
              {
                autoAlpha: 0,
                y: 14,
              },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.75,
              },
              0.95,
            );
          }

          /*
           * Very subtle vertical background movement.
           *
           * Keeping this movement small prevents the image
           * from looking soft or overly enlarged.
           */
          gsap.to(image, {
            yPercent: desktop ? 2.5 : 1.5,
            ease: "none",

            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom top",
              scrub: mobile ? 0.5 : 0.75,
              invalidateOnRefresh: true,
            },
          });
        },
      );

      return () => {
        matchMedia.revert();
      };
    },
    {
      scope: sectionRef,
    },
  );

  return (
    <section
      ref={sectionRef}
      id="home"
      className={styles.hero}
      aria-labelledby="hero-title"
    >
      <div ref={imageRef} className={styles.imageWrapper}>
        <div ref={imageRef} className={styles.imageWrapper}>
          <SafeImage
            src={mainImage}
            fallbackSrc={mainImageFallback}
            alt="[Add Movenpick hero image description]"
            fill
            quality={75}
            sizes="100vw"
            priority
            className={styles.image}
          />
        </div>
      </div>

      <div className={styles.imageOverlay} aria-hidden="true" />

      <div ref={contentRef} className={styles.content}>
        <p className={styles.eyebrow}>{eyebrow}</p>

        <h1 id="hero-title" className={styles.title}>
          {heading}
        </h1>

        <p className={styles.subtitle}>{text}</p>

        {/*
         * "#contact" (the field's own default) opens the enquiry popup,
         * exactly as before — anything else the panel is told to use is a
         * real, working link, not silently overridden by the popup
         * regardless of what was typed. See hero.js's own field label.
         */}
        <a
          href={ctaHref}
          className={styles.discoverLink}
          {...(ctaHref === "#contact" ? { "data-contact-popup": true } : {})}
        >
          <span>{ctaLabel}</span>
          {ctaIcon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ctaIcon}
              alt=""
              aria-hidden="true"
              className={styles.linkIcon}
            />
          ) : (
            <span className={styles.linkIcon} aria-hidden="true">
              →
            </span>
          )}
        </a>
      </div>

      <a
        ref={scrollIndicatorRef}
        href="#about"
        className={styles.scrollIndicator}
        aria-label="Scroll down to discover Movenpick"
        onClick={revealAbout}
      >
        <span className={styles.scrollText}>Scroll Down</span>

        <span className={styles.scrollLine} aria-hidden="true" />
      </a>
    </section>
  );
}

"use client";

import Image from "next/image";
import { useRef } from "react";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { ENTRANCE_STAGGER, ENTRANCE_DURATION, ENTRANCE_EASE } from "@/lib/motion";
import styles from "./TrustedPartner.module.css";

export default function TrustedPartnerClient({
  logo,
  logoAlt,
  label,
  heading,
  text,
  image,
  imageAlt,
  cardHeading,
  cardText,
  ctaLabel,
  ctaHref,
}) {
  const sectionRef = useRef(null);
  const logoRef = useRef(null);
  const labelRef = useRef(null);
  const headingRef = useRef(null);
  const textRef = useRef(null);
  const mediaRef = useRef(null);
  const cardRef = useRef(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const media = mediaRef.current;
      const card = cardRef.current;

      const textReveal = [
        logoRef.current,
        labelRef.current,
        headingRef.current,
        textRef.current,
      ].filter(Boolean);

      if (!section) {
        return;
      }

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set([...textReveal, media, card].filter(Boolean), {
          autoAlpha: 1,
          y: 0,
        });

        return;
      }

      gsap.set(textReveal, { autoAlpha: 0, y: 24 });

      const textTrigger = ScrollTrigger.create({
        trigger: section,
        start: "top 78%",
        once: true,

        onEnter: () => {
          gsap.to(textReveal, {
            autoAlpha: 1,
            y: 0,
            duration: ENTRANCE_DURATION,
            stagger: ENTRANCE_STAGGER,
            ease: ENTRANCE_EASE,
          });
        },
      });

      let mediaTrigger;

      /*
       * A separate trigger for the photo/card, since it sits further down
       * this (tall) section and would often still be off-screen when the
       * text block above enters — each reveals on its own arrival instead
       * of both firing together based on the section's top edge.
       */
      if (media && card) {
        gsap.set(media, { autoAlpha: 0, y: 28 });
        gsap.set(card, { autoAlpha: 0, y: 24 });

        mediaTrigger = ScrollTrigger.create({
          trigger: media,
          start: "top 80%",
          once: true,

          onEnter: () => {
            gsap
              .timeline({ defaults: { ease: ENTRANCE_EASE } })
              .to(media, { autoAlpha: 1, y: 0, duration: ENTRANCE_DURATION })
              .to(
                card,
                { autoAlpha: 1, y: 0, duration: ENTRANCE_DURATION },
                ENTRANCE_STAGGER,
              );
          },
        });
      }

      return () => {
        textTrigger.kill();
        mediaTrigger?.kill();
      };
    },
    { scope: sectionRef },
  );

  const isExternalCta = /^https?:\/\//.test(ctaHref ?? "");

  return (
    <section
      ref={sectionRef}
      id="trusted-partner"
      className={styles.trustedPartner}
      aria-labelledby="trusted-partner-heading"
    >
      <div className={styles.textBlock}>
        <div ref={logoRef} className={styles.logoWrapper}>
          <Image
            src={logo}
            alt={logoAlt}
            width={96}
            height={96}
            className={styles.logo}
          />
        </div>

        <p ref={labelRef} className={styles.label}>
          {label}
        </p>

        <h2
          ref={headingRef}
          id="trusted-partner-heading"
          className={styles.heading}
        >
          {heading}
        </h2>

        <p ref={textRef} className={styles.text}>
          {text}
        </p>
      </div>

      <div ref={mediaRef} className={styles.mediaBlock}>
        <Image
          src={image}
          alt={imageAlt}
          fill
          quality={85}
          sizes="100vw"
          className={styles.mediaImage}
        />

        <div ref={cardRef} className={styles.card}>
          <h3 className={styles.cardHeading}>{cardHeading}</h3>

          <p className={styles.cardText}>{cardText}</p>

          <a
            href={ctaHref}
            className={styles.ctaButton}
            {...(isExternalCta
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            <span>{ctaLabel}</span>
            <span className={styles.ctaIcon} aria-hidden="true">
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

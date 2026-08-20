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
      let growTrigger;

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

        /*
         * Once the card's own bottom edge reaches the bottom of the
         * screen — exactly where it naturally settles after the reveal
         * above — continuing to scroll grows it from its small centred
         * card into a full-bleed panel covering the entire photo.
         *
         * Pinning all four edges (top/right/bottom/left) as an inset
         * from the media block's own edges, then animating all four
         * straight to 0, is what actually guarantees growth on every
         * side at once: each edge moves independently and by an equal
         * amount, with no dependency on a width/height that's changing
         * at the same time. The previous version instead centred the
         * card with top/left:50% plus a -50% transform and animated
         * only width/height — that trick keeps a *fixed*-size box
         * centred, but once the box's own size is what's changing, the
         * -50% shift (relative to the box's current, moving size) no
         * longer traces a straight line to the edges, so growth looked
         * uneven rather than expanding equally on every side.
         */
        const cardRect = card.getBoundingClientRect();
        const mediaRect = media.getBoundingClientRect();

        const insetX = (mediaRect.width - cardRect.width) / 2;
        const insetY = (mediaRect.height - cardRect.height) / 2;

        gsap.set(card, {
          top: insetY,
          right: insetX,
          bottom: insetY,
          left: insetX,
          xPercent: 0,
          yPercent: 0,
          width: "auto",
          height: "auto",
        });

        growTrigger = ScrollTrigger.create({
          trigger: card,
          start: "bottom bottom",
          /*
           * Tied to the media block's own geometry (via a separate
           * endTrigger) rather than a fixed viewport-height distance —
           * a fixed distance has no relationship to how much of the
           * section is actually still left to scroll through, so
           * depending on the card's own height it could easily still
           * be short of full size by the time the section itself had
           * nearly scrolled out of view. Ending when the media block's
           * own bottom edge reaches 80% down the viewport (i.e. the
           * section has scrolled until only its bottom 20% remains)
           * guarantees it's fully grown well before the section ends,
           * regardless of exactly how tall the card started out.
           */
          endTrigger: media,
          end: "bottom 80%",
          /*
           * Pins the media block on screen for exactly this scroll
           * range. Without it, the card was only ever centred
           * relative to the media block — and since the media block
           * itself keeps scrolling up the page as the card grows, it
           * only looked centred on screen at one particular scroll
           * position; everywhere else in the range, the media block
           * (and the card centred in it) sat off-centre in the
           * viewport. Freezing the media block in place for the
           * duration of the grow keeps it — and the card growing
           * inside it — genuinely centred on screen throughout.
           */
          pin: media,
          pinSpacing: true,
          scrub: 0.5,
          invalidateOnRefresh: true,

          animation: gsap.fromTo(
            card,
            {
              top: insetY,
              right: insetX,
              bottom: insetY,
              left: insetX,
            },
            {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              ease: "none",
            },
          ),
        });
      }

      return () => {
        textTrigger.kill();
        mediaTrigger?.kill();
        growTrigger?.kill();
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

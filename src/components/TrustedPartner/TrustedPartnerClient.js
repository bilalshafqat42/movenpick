"use client";

import Image from "next/image";
import { useRef } from "react";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { ENTRANCE_STAGGER, ENTRANCE_DURATION, ENTRANCE_EASE } from "@/lib/motion";
import styles from "./TrustedPartner.module.css";

/*
 * Viewport heights of scrolling the card's expansion plays across.
 *
 * It used to be tied to the media block's own geometry, which worked out
 * to roughly 320px of scroll — two or three wheel notches to take the
 * card from a small panel to covering the whole photograph. A takeover
 * that large needs to be watchable, not glimpsed, so the distance is
 * now stated outright in terms of the viewport rather than falling out
 * of a chain of relative anchors.
 */
const GROW_VIEWPORTS = 0.9;

/*
 * Viewport heights the photograph is held, centred and untouched,
 * before the card starts taking it over.
 *
 * Same reasoning as the Project Gallery's arrival hold: without it the
 * takeover begins on the very pixel the photo settles into place, so
 * arriving and being covered are one motion and the photograph is never
 * seen on its own.
 */
const GROW_ARRIVAL_VIEWPORTS = 0.2;

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
  const mediaScrollRef = useRef(null);
  const mediaRef = useRef(null);
  const cardRef = useRef(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const mediaScroll = mediaScrollRef.current;
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
      /*
       * The takeover runs wherever the CSS actually holds the photo
       * still, which is what the card needs to grow inside.
       *
       * Asking the element whether it is sticky, rather than repeating
       * a breakpoint here, means the two can never disagree: desktop
       * and mobile each give .mediaBlock a sticky frame and a runway
       * (see the module CSS), while the tablet tier in between leaves
       * it in normal flow and simply shows the card over the photo.
       */
      const heldStill = window.getComputedStyle(media).position === "sticky";

      if (media && card && mediaScroll && heldStill) {
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
         * Scrolling on from the settled reveal grows the card from a
         * small centred panel into a full-bleed one covering the whole
         * photograph.
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

        /*
         * The card's natural size, measured with the four animated
         * edges neutralised so the element falls back to the size its
         * CSS gives it. Without clearing them first there is nothing to
         * measure: after the first frame the card's size IS the inset,
         * so reading it back would just return whatever the animation
         * last set.
         *
         * This is why the insets are recomputed rather than captured
         * once. Measuring a single time at setup baked pixel values
         * from one viewport into the tween, and `invalidateOnRefresh`
         * does not help — it re-derives the trigger's start and end but
         * not a tween's hard-coded endpoints. Resizing from 1440x900 to
         * 1100x800 left the old insets applied to a smaller block and
         * collapsed the card to a 109x349 slither inside a 1085x605
         * photo.
         */
        const measureInsets = () => {
          const edges = ["top", "right", "bottom", "left"];
          const saved = edges.map((edge) => card.style[edge]);

          edges.forEach((edge) => {
            card.style[edge] = "";
          });

          const cardRect = card.getBoundingClientRect();
          const mediaRect = media.getBoundingClientRect();

          edges.forEach((edge, index) => {
            card.style[edge] = saved[index];
          });

          return {
            x: Math.max(0, (mediaRect.width - cardRect.width) / 2),
            y: Math.max(0, (mediaRect.height - cardRect.height) / 2),
          };
        };

        let insets = measureInsets();

        gsap.set(card, {
          xPercent: 0,
          yPercent: 0,
          width: "auto",
          height: "auto",
        });

        growTrigger = ScrollTrigger.create({
          /*
           * Anchored to the media block sitting centred in the
           * viewport, which is both where the pin freezes it and a
           * point the entrance reveal above has comfortably finished
           * by. The old anchor was the card's own bottom edge reaching
           * the viewport bottom, which is a moving target: the card's
           * height depends on its text, so the expansion started at a
           * different moment on every breakpoint.
           */
          /*
           * Anchored to the photo sitting centred in the viewport,
           * which is exactly where the sticky CSS parks it and a point
           * the entrance reveal above has comfortably finished by. The
           * old anchor was the card's own bottom edge reaching the
           * viewport bottom, which is a moving target: the card's
           * height depends on its text, so the expansion started at a
           * different moment on every breakpoint.
           *
           * The offset on the start is the arrival hold — the stretch
           * where the photo is stuck, centred, and nothing is growing
           * over it yet.
           */
          trigger: media,
          start: () => `center center-=${window.innerHeight * GROW_ARRIVAL_VIEWPORTS}`,
          end: () =>
            `center center-=${
              window.innerHeight * (GROW_ARRIVAL_VIEWPORTS + GROW_VIEWPORTS)
            }`,
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
          /*
           * No `pin`. The photo is held by position: sticky in the CSS
           * instead, the same pattern Amenities and Project Gallery
           * use.
           *
           * GSAP's pin wraps the element in a pin-spacer, and this
           * section carries one of the page's scroll-snap points (see
           * globals.css). The browser trying to snap to a box whose
           * geometry the pin is rewriting fought the scroll hard:
           * 7,200px of wheel input moved the page only about 1,570px,
           * so the section felt heavy and reluctant. Sticky changes no
           * boxes and the resistance goes away entirely.
           */
          scrub: 0.6,
          invalidateOnRefresh: true,

          /*
           * Re-measure before every refresh, so a resize or an
           * orientation change rebuilds the expansion against the
           * block's new size instead of the one it was born in.
           */
          onRefreshInit: () => {
            insets = measureInsets();
          },

          animation: gsap.fromTo(
            card,
            {
              top: () => insets.y,
              right: () => insets.x,
              bottom: () => insets.y,
              left: () => insets.x,
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

      <div
        ref={mediaScrollRef}
        className={styles.mediaScroll}
        style={{
          "--tp-runway": GROW_ARRIVAL_VIEWPORTS + GROW_VIEWPORTS,
        }}
      >
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
      </div>

    </section>
  );
}

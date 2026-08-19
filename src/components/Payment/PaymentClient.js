"use client";

import SafeImage from "@/components/SafeImage";
import { useRef } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import styles from "./Payment.module.css";

export default function PaymentClient({
  eyebrow,
  heading,
  planNumber1,
  planNumber2,
  planLabel1,
  planLabel2,
  image,
  imageAlt,
  imageFallback,
  brochureButtonLabel,
  brochureUrl,
  submitButtonLabel,
}) {
  const sectionRef = useRef(null);
  const eyebrowRef = useRef(null);
  const headingRef = useRef(null);
  const planNumbersRef = useRef(null);
  const planLabelsRef = useRef(null);
  const ctaGroupRef = useRef(null);
  const imagePanelRef = useRef(null);
  const imageLayerRef = useRef(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const eyebrow = eyebrowRef.current;
      const heading = headingRef.current;
      const planNumbers = planNumbersRef.current;
      const planLabels = planLabelsRef.current;
      const ctaGroup = ctaGroupRef.current;
      const imagePanel = imagePanelRef.current;
      const imageLayer = imageLayerRef.current;

      if (
        !section ||
        !eyebrow ||
        !heading ||
        !planNumbers ||
        !planLabels ||
        !ctaGroup ||
        !imagePanel ||
        !imageLayer
      ) {
        return;
      }

      /*
       * Reveal order while scrolling down:
       * "Payment" -> "Plan" -> the 20/80 numbers -> the labels -> the
       * two CTAs.
       */
      const contentReveal = [eyebrow, heading, planNumbers, planLabels, ctaGroup];
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

          if (reduceMotion) {
            gsap.set(imagePanel, {
              clipPath: "none",
            });

            gsap.set(imageLayer, {
              clearProps: "transform",
            });

            gsap.set(contentReveal, {
              autoAlpha: 1,
              y: 0,
            });

            return;
          }

          /*
           * The left beige panel remains fully visible.
           *
           * Only its content starts slightly lower
           * and fades into position.
           */
          gsap.set(contentReveal, {
            autoAlpha: 0,
            y: mobile ? 28 : 44,
          });

          /*
           * The right image panel already occupies its
           * final 50% position.
           *
           * It is hidden from the left, meaning its
           * right edge is visible first and the reveal
           * opens from right to left.
           */
          gsap.set(imagePanel, {
            clipPath: "inset(0% 0% 0% 100%)",
          });

          /*
           * The image itself stays in place.
           * A very subtle horizontal offset creates depth
           * without making it look like the image is sliding.
           */
          gsap.set(imageLayer, {
            scale: mobile ? 1.035 : 1.055,
            xPercent: mobile ? 2 : 4,
            transformOrigin: "center center",
          });

          /*
           * Right image reveal:
           *
           * Scroll down:
           * right → left opening.
           *
           * Scroll up:
           * left → right closing.
           */
          const imageTimeline = gsap.timeline({
            defaults: {
              ease: "none",
            },

            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "top top",

              scrub: mobile ? 0.55 : 0.8,
              invalidateOnRefresh: true,
            },
          });

          imageTimeline
            .to(
              imagePanel,
              {
                clipPath: "inset(0% 0% 0% 0%)",
                duration: 1,
              },
              0,
            )
            .to(
              imageLayer,
              {
                scale: 1,
                xPercent: 0,
                duration: 1,
              },
              0,
            );

          /*
           * Left content entrance.
           *
           * Each piece fades up from below and reveals
           * one at a time, with a small delay between:
           * eyebrow, heading, plan numbers, then labels.
           */
          const contentTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: mobile ? "top 72%" : "top 68%",
              once: true,
            },
          });

          contentTimeline.to(contentReveal, {
            autoAlpha: 1,
            y: 0,
            duration: mobile ? 0.6 : 0.75,
            stagger: mobile ? 0.16 : 0.22,
            ease: "power3.out",
          });

          return () => {
            imageTimeline.kill();
            contentTimeline.kill();
          };
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
      id="payment-plan"
      className={styles.payment}
      aria-labelledby="payment-title"
    >
      <div className={styles.viewport}>
        <div className={styles.contentPanel}>
          <div className={styles.content}>
            <div className={styles.headingGroup}>
              <p ref={eyebrowRef} className={styles.eyebrow}>
                {eyebrow}
              </p>

              <h2
                ref={headingRef}
                id="payment-title"
                className={styles.heading}
              >
                {heading}
              </h2>
            </div>

            <div className={styles.plan}>
              <div
                ref={planNumbersRef}
                className={styles.planNumbers}
                aria-label={`${planNumber1} percent ${planLabel1} and ${planNumber2} percent ${planLabel2}`}
              >
                <span className={styles.planNumber}>{planNumber1}</span>

                <span className={styles.planDivider} aria-hidden="true">
                  /
                </span>

                <span className={styles.planNumber}>{planNumber2}</span>
              </div>

              <div ref={planLabelsRef} className={styles.planLabels}>
                <p className={styles.planLabel}>{planLabel1}</p>

                <p className={styles.planLabel}>{planLabel2}</p>
              </div>
            </div>

            <div ref={ctaGroupRef} className={styles.ctaGroup}>
              <a
                href={brochureUrl}
                download="movenpick-brochure.pdf"
                className={styles.requestLink}
              >
                {brochureButtonLabel}

                <span className={styles.brochureIcon} aria-hidden="true" />
              </a>

              <button
                type="button"
                className={styles.requestLink}
                data-contact-popup
              >
                <span>{submitButtonLabel}</span>
                <span className={styles.linkIcon} aria-hidden="true">
                  →
                </span>
              </button>
            </div>
          </div>
        </div>

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

          <div className={styles.imageOverlay} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

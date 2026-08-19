"use client";

import { useRef } from "react";

import About from "@/components/About";
import { gsap, useGSAP } from "@/lib/gsap";

import styles from "./page.module.css";

/*
 * Split out from page.js so that file can be a Server Component (needed
 * for sections like Amenities that fetch their own content from the
 * database). This is the one part of the homepage that genuinely needs
 * client-side refs and a GSAP scroll timeline — the pinned three-stage
 * Hero -> About scene. Everything else on the page is either already its
 * own self-contained Client Component or doesn't need client APIs at all.
 *
 * Hero itself is a Server Component (it fetches its content from the
 * database) — a Client Component can't import and render one directly, so
 * page.js renders `<Hero />` and passes the result in as `heroSlot`, the
 * standard Server-Component-as-a-prop composition pattern.
 *
 * About can't use that same trick, though — this component attaches its
 * own `aboutLayerRef` directly to About's root element (queried below via
 * `querySelector` for the GSAP timeline), and a pre-rendered Server
 * Component element can't receive a ref added by its Client Component
 * parent. So About stays a plain Client Component (unchanged), and only
 * its *content* — plain serializable data, not a rendered element —
 * crosses the Server/Client boundary as the `aboutContent` prop, fetched
 * by page.js and spread onto `<About />` here.
 */
export default function HeroAboutScene({ heroSlot, aboutContent }) {
  const sceneRef = useRef(null);
  const heroLayerRef = useRef(null);
  const aboutLayerRef = useRef(null);

  useGSAP(
    () => {
      const scene = sceneRef.current;
      const heroLayer = heroLayerRef.current;
      const aboutLayer = aboutLayerRef.current;

      if (!scene || !heroLayer || !aboutLayer) {
        return;
      }

      const leftPanel = aboutLayer.querySelector("[data-about-left]");
      const rightPanel = aboutLayer.querySelector("[data-about-right]");
      const aboutContent = aboutLayer.querySelector("[data-about-content]");
      const aboutImage = rightPanel?.querySelector("img");

      if (!leftPanel || !rightPanel || !aboutContent || !aboutImage) {
        return;
      }

      const contentChildren = Array.from(aboutContent.children);
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

          /*
           * Accessible fallback:
           * display the Hero and About content without
           * animated clipping when reduced motion is enabled.
           */
          if (reduceMotion) {
            gsap.set([leftPanel, rightPanel], {
              clipPath: "none",
            });

            gsap.set(contentChildren, {
              autoAlpha: 1,
              x: 0,
              y: 0,
            });

            gsap.set([heroLayer, aboutImage], {
              clearProps: "transform",
            });

            return;
          }

          /*
           * Initial state:
           *
           * 1. Hero is fully visible.
           * 2. Beige panel is hidden horizontally.
           * 3. Green panel is hidden vertically.
           */
          gsap.set(leftPanel, {
            clipPath: "inset(0% 100% 0% 0%)",
          });

          gsap.set(rightPanel, {
            clipPath: "inset(100% 0% 0% 0%)",
          });

          gsap.set(contentChildren, {
            autoAlpha: 0,
            x: mobile ? -24 : -42,
            y: 0,
          });

          gsap.set(heroLayer, {
            scale: 1,
            transformOrigin: "center center",
          });

          gsap.set(aboutImage, {
            scale: mobile ? 1.05 : 1.08,
            yPercent: mobile ? 5 : 8,
            transformOrigin: "center center",
          });

          /*
           * Three-stage scroll sequence:
           *
           * 0%:
           * Full Hero.
           *
           * 50%:
           * Beige About panel covers the left half.
           *
           * 100%:
           * Green image panel completes the About section.
           */
          const timeline = gsap.timeline({
            defaults: {
              ease: "none",
            },

            scrollTrigger: {
              trigger: scene,
              start: "top top",
              end: "bottom bottom",

              scrub: mobile ? 0.55 : 0.8,
              invalidateOnRefresh: true,

              snap: {
                /*
                 * 0%–24% returns to the Hero.
                 * 25%–74% settles on the beige-half state.
                 * 75%–100% completes the About section.
                 */
                snapTo: (progress) => {
                  if (progress < 0.25) {
                    return 0;
                  }

                  if (progress < 0.75) {
                    return 0.5;
                  }

                  return 1;
                },

                duration: {
                  min: 0.3,
                  max: mobile ? 0.6 : 0.8,
                },

                delay: mobile ? 0.15 : 0.1,
                ease: "power2.inOut",
                inertia: false,
              },
            },
          });

          timeline
            /*
             * Stage 1 → Stage 2:
             * Beige panel opens from left to right.
             */
            .to(
              leftPanel,
              {
                clipPath: "inset(0% 0% 0% 0%)",
                duration: 0.5,
              },
              0,
            )

            /*
             * About text appears as the beige panel
             * approaches its fully open position.
             */
            .to(
              contentChildren,
              {
                autoAlpha: 1,
                x: 0,
                duration: 0.18,
                stagger: 0.05,
                ease: "power2.out",
              },
              0.27,
            )

            /*
             * Subtle Hero depth while the beige panel opens.
             */
            .to(
              heroLayer,
              {
                scale: desktop ? 1.012 : 1.006,
                duration: 0.5,
              },
              0,
            )

            /*
             * Stage 2 → Stage 3:
             * Green panel opens from bottom to top.
             */
            .to(
              rightPanel,
              {
                clipPath: "inset(0% 0% 0% 0%)",
                duration: 0.5,
              },
              0.5,
            )

            /*
             * The image moves subtly inside its fixed panel.
             */
            .to(
              aboutImage,
              {
                scale: 1,
                yPercent: 0,
                duration: 0.5,
              },
              0.5,
            )

            /*
             * Final subtle Hero depth adjustment.
             */
            .to(
              heroLayer,
              {
                scale: desktop ? 1.018 : 1.008,
                duration: 0.5,
              },
              0.5,
            );
        },
      );

      return () => {
        matchMedia.revert();
      };
    },
    {
      scope: sceneRef,
    },
  );

  return (
    <section
      ref={sceneRef}
      id="hero-about-scene"
      className={styles.heroAboutScene}
      aria-label="Movenpick introduction"
    >
      <div className={styles.stickyViewport}>
        <div ref={heroLayerRef} className={styles.heroLayer}>
          {heroSlot}
        </div>

        <About
          ref={aboutLayerRef}
          className={styles.aboutLayer}
          {...aboutContent}
        />
      </div>
    </section>
  );
}

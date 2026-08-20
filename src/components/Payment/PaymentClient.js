"use client";

import SafeImage from "@/components/SafeImage";
import { useRef } from "react";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { ENTRANCE_STAGGER, ENTRANCE_DURATION, ENTRANCE_EASE } from "@/lib/motion";
import styles from "./Payment.module.css";

/*
 * Venetian blind reveal: 30 horizontal bands, each with its own
 * "slat" — a hard-edged stripe centred in the band that starts as a
 * hairline and widens to fill the band's full 3.3333% (100/30)
 * height. Bands stagger their start bottom-to-top, so the blind reads
 * as opening upward as the visitor scrolls, rather than every slat
 * opening in lockstep. Built as a plain mask-image string recomputed
 * every scroll frame from `progress` (0-1) — no GSAP tween/duration
 * involved, so it's pinned exactly to scroll position rather than
 * timed.
 */
const VENETIAN_BAND_COUNT = 30;
const VENETIAN_BAND_HEIGHT = 100 / VENETIAN_BAND_COUNT;
const VENETIAN_WINDOW = 0.3;
const VENETIAN_SPREAD = 1 - VENETIAN_WINDOW;

function buildVenetianMask(progress) {
  const stops = [];

  for (let i = 0; i < VENETIAN_BAND_COUNT; i += 1) {
    const bandStart = (i / (VENETIAN_BAND_COUNT - 1)) * VENETIAN_SPREAD;
    const local = Math.min(
      1,
      Math.max(0, (progress - bandStart) / VENETIAN_WINDOW),
    );

    const bandBottom = i * VENETIAN_BAND_HEIGHT;
    const bandTop = bandBottom + VENETIAN_BAND_HEIGHT;
    const bandCenter = bandBottom + VENETIAN_BAND_HEIGHT / 2;
    const half = (local * VENETIAN_BAND_HEIGHT) / 2;
    const revealBottom = bandCenter - half;
    const revealTop = bandCenter + half;

    /*
     * White, not black, for the "revealed" stops: mask-image defaults
     * to luminance mode in modern spec-compliant browsers (mask value
     * = luminance × alpha), and black has zero luminance — so black
     * reads as fully MASKED OUT there, not revealed, leaving only
     * anti-aliased slivers at the hard-stop edges visible. White has
     * full luminance, so it reads as revealed under luminance mode,
     * and under the older alpha-only mode it's still fully opaque
     * (alpha 1) either way — correct under both.
     */
    stops.push(
      `transparent ${bandBottom}%`,
      `transparent ${revealBottom}%`,
      `white ${revealBottom}%`,
      `white ${revealTop}%`,
      `transparent ${revealTop}%`,
      `transparent ${bandTop}%`,
    );
  }

  return `linear-gradient(0deg, ${stops.join(", ")})`;
}

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
        imagePanel.style.maskImage = "none";
        imagePanel.style.webkitMaskImage = "none";
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
       * Photo: venetian blind reveal (see buildVenetianMask above),
       * driven directly by scroll progress rather than a GSAP tween —
       * the mask-image is recomputed every scroll frame, so it's
       * pinned exactly to scroll position instead of playing out over
       * a fixed duration. The parallax drift on the layer underneath
       * (same scale/xPercent settle used elsewhere on the site) rides
       * along on the same progress value.
       */
      const layerStartScale = mobile ? 1.035 : 1.055;
      const layerStartXPercent = mobile ? 2 : 4;

      const applyVenetianMask = (progress) => {
        const mask = buildVenetianMask(progress);

        imagePanel.style.maskImage = mask;
        imagePanel.style.webkitMaskImage = mask;
      };

      gsap.set(imageLayer, {
        scale: layerStartScale,
        xPercent: layerStartXPercent,
        transformOrigin: "center center",
      });

      applyVenetianMask(0);

      const imageTrigger = ScrollTrigger.create({
        trigger: section,
        /*
         * The real problem wasn't just when this started — it's that
         * start/end were only ever a fraction of one viewport height
         * apart (e.g. "top 55%" to "top top" is just 55% of the
         * screen's worth of scrolling), so the whole 30-band reveal
         * had to finish within that short a distance, reading as
         * rushed/cut-off rather than something to actually watch
         * play out. Ending at "center center" instead of "top top"
         * gives it roughly a full viewport height of scroll distance
         * to complete across.
         */
        start: "top 90%",
        end: "center center",
        invalidateOnRefresh: true,

        onUpdate: (self) => {
          applyVenetianMask(self.progress);

          gsap.set(imageLayer, {
            scale: gsap.utils.interpolate(layerStartScale, 1, self.progress),
            xPercent: gsap.utils.interpolate(
              layerStartXPercent,
              0,
              self.progress,
            ),
          });
        },
      });

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
        imageTrigger.kill();
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

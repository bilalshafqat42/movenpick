"use client";

import { useRef } from "react";
import Link from "next/link";

import { gsap, useGSAP } from "@/lib/gsap";
import { revealOnArrival } from "@/lib/revealOnArrival";
import styles from "./Footer.module.css";

export default function FooterClient({
  logoUrl,
  phoneDisplay,
  phoneHref,
  tollFreeDisplay,
  tollFreeHref,
  email,
  address,
  copyright,
  cookiesButtonLabel,
}) {
  const logoMaskStyle = logoUrl
    ? { "--logo-mask-url": `url("${logoUrl}")` }
    : undefined;
  const addressLines = address.split("\n");
  const footerRef = useRef(null);
  const contentRef = useRef(null);

  useGSAP(
    () => {
      const footer = footerRef.current;
      const content = contentRef.current;

      if (!footer || !content) {
        return;
      }

      const items = Array.from(content.children);

      const matchMedia = gsap.matchMedia();

      matchMedia.add(
        {
          desktop: "(min-width: 601px)",
          mobile: "(max-width: 600px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { mobile, reduceMotion } = context.conditions;

          if (reduceMotion) {
            gsap.set(content, {
              clearProps: "transform",
            });

            gsap.set(items, {
              clearProps: "all",
              autoAlpha: 1,
            });

            return;
          }

          /*
           * Parallax:
           *
           * The whole content block drifts up into place a
           * little slower than the page scroll as the footer
           * enters the viewport, then settles as it centres.
           */
          gsap.fromTo(
            content,
            {
              y: mobile ? 32 : 60,
            },
            {
              y: 0,
              ease: "none",

              scrollTrigger: {
                trigger: footer,
                start: "top bottom",
                end: "top 45%",

                scrub: 0.6,
                invalidateOnRefresh: true,
              },
            },
          );

          /*
           * Text entrance:
           *
           * Each block fades up from below and appears
           * one at a time, with a small delay between them.
           */
          const footerReveal = gsap.fromTo(
            items,
            {
              autoAlpha: 0,
              y: mobile ? 20 : 28,
            },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.85,
              stagger: 0.08,
              ease: "power3.out",
              paused: true,
            },
          );

          revealOnArrival({
            trigger: footer,
            start: "top 78%",
            onReveal: () => footerReveal.play(),
          });
        },
      );

      return () => {
        matchMedia.revert();
      };
    },
    {
      scope: footerRef,
    },
  );

  return (
    <footer ref={footerRef} className={styles.footer}>
      <div ref={contentRef} className={styles.inner}>
        <a
          href="#home"
          className={styles.logo}
          aria-label="Movenpick home"
        >
          <span
            className={styles.logoMark}
            style={logoMaskStyle}
            aria-hidden="true"
          />
        </a>

        <div className={`${styles.contactBlock} ${styles.telephone}`}>
          <p className={styles.label}>Tel</p>

          <a href={phoneHref} className={styles.value}>
            {phoneDisplay}
          </a>
        </div>

        <div className={`${styles.contactBlock} ${styles.tollFree}`}>
          <p className={styles.label}>UAE Toll Free:</p>

          <a href={tollFreeHref} className={styles.value}>
            {tollFreeDisplay}
          </a>
        </div>

        <div className={`${styles.contactBlock} ${styles.email}`}>
          <p className={styles.label}>Email</p>

          <a href={`mailto:${email}`} className={styles.value}>
            {email}
          </a>
        </div>

        <div className={`${styles.contactBlock} ${styles.address}`}>
          <p className={styles.label}>Address</p>

          <address className={styles.value}>
            {addressLines.map((line, index) => (
              <span key={line}>
                {line}
                {index < addressLines.length - 1 ? <br /> : null}
              </span>
            ))}
          </address>
        </div>

        <p className={styles.copyright}>{copyright}</p>

        <div className={styles.legalRow}>
          <button type="button" className={styles.cookiesButton}>
            {cookiesButtonLabel}
          </button>
          <Link href="/privacy" className={styles.legalLink}>
            Privacy Policy
          </Link>
          <Link href="/terms" className={styles.legalLink}>
            Terms &amp; Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}

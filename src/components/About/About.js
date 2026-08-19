"use client";

import { forwardRef } from "react";
import SafeImage from "@/components/SafeImage";

import styles from "./About.module.css";

const About = forwardRef(function About(
  { className = "", eyebrow, heading, image, imageFallback },
  ref,
) {
  return (
    <section
      ref={ref}
      id="about"
      className={`${styles.about} ${className}`}
      aria-labelledby="about-title"
    >
      <div className={styles.leftPanel} data-about-left>
        <div className={styles.content} data-about-content>
          <p className={styles.eyebrow}>{eyebrow}</p>

          <h2 id="about-title" className={styles.title}>
            {heading}
          </h2>
        </div>
      </div>

      <div className={styles.rightPanel} data-about-right data-about-media>
        <SafeImage
          src={image}
          fallbackSrc={imageFallback}
          alt=""
          fill
          quality={90}
          sizes="(max-width: 767px) 100vw, 50vw"
          className={styles.image}
        />

        <div className={styles.imageOverlay} aria-hidden="true" />
      </div>
    </section>
  );
});

About.displayName = "About";

export default About;

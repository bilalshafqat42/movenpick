import SafeImage from "@/components/SafeImage";

import styles from "./About.module.css";

export default function About({ eyebrow, heading, image, imageFallback }) {
  return (
    <section id="about" className={styles.about} aria-labelledby="about-title">
      <div className={styles.textPanel}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>{eyebrow}</p>

          <h2 id="about-title" className={styles.title}>
            {heading}
          </h2>
        </div>
      </div>

      <div className={styles.imagePanel}>
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
}

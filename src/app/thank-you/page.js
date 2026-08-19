import Link from "next/link";

import AutoRedirect from "./AutoRedirect";
import styles from "./thank-you.module.css";

export const metadata = {
  title: "Thank You | Movenpick",
  description:
    "Thank you for your interest in Movenpick. Our team will contact you shortly.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ThankYouPage() {
  return (
    <main className={styles.page}>
      <AutoRedirect href="/" delay={15000} />

      <section className={styles.content} aria-labelledby="thank-you-title">
        <p className={styles.eyebrow}>Thank You</p>

        <h1 id="thank-you-title" className={styles.heading}>
          Your Request Has Been Received
        </h1>

        <p className={styles.description}>
          Thank you for your interest in Movenpick. A member of our
          dedicated team will contact you shortly.
        </p>

        <Link href="/" className={styles.homeLink}>
          <span>Return To Home</span>
        </Link>
      </section>
    </main>
  );
}

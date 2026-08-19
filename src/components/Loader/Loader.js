"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import styles from "./Loader.module.css";

const SESSION_KEY = "movenpick-loader-shown";

/*
 * One-time branded splash screen:
 *
 * - Full-screen gradient background.
 * - Logo (forced white via CSS filter, see Loader.module.css) enters
 *   from the left while fading in, then continues travelling right
 *   while fading out, like it's passing through rather than just
 *   appearing and disappearing in place.
 * - Shown once per browser session (sessionStorage), so hard
 *   refreshes later in the same session skip straight past it.
 *
 * Always starts rendered (shouldRender defaults to true) so the
 * server-rendered HTML and the first client render match exactly,
 * no hydration mismatch. Whether it actually plays or skips itself
 * for a returning-this-session visitor is decided inside useGSAP,
 * which runs before the browser paints, so there's no visible
 * flash either way.
 */
export default function Loader({ logoUrl = "/logos/movenpick-logo.svg" }) {
  const pathname = usePathname();
  const isAdminPanel = pathname?.startsWith("/admin-panel") ?? false;

  const overlayRef = useRef(null);
  const logoRef = useRef(null);

  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (!shouldRender || isAdminPanel) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [shouldRender, isAdminPanel]);

  useGSAP(() => {
    const overlay = overlayRef.current;
    const logo = logoRef.current;

    if (!overlay || !logo || isAdminPanel) {
      return;
    }

    const finish = () => {
      try {
        window.sessionStorage.setItem(SESSION_KEY, "true");
      } catch {
        // Storage blocked (private browsing, etc). The loader will
        // simply replay next time instead of breaking anything.
      }

      setShouldRender(false);
    };

    let alreadyShown = false;

    try {
      alreadyShown = window.sessionStorage.getItem(SESSION_KEY) === "true";
    } catch {
      alreadyShown = false;
    }

    if (alreadyShown) {
      finish();
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      finish();
      return;
    }

    gsap.set(logo, { autoAlpha: 0, x: -48 });

    gsap
      .timeline({ onComplete: finish })
      .to(logo, {
        autoAlpha: 1,
        x: 0,
        duration: 0.85,
        ease: "power2.out",
      })
      .to(logo, {
        autoAlpha: 0,
        x: 48,
        duration: 0.7,
        ease: "power2.in",
        delay: 0.45,
      })
      .to(
        overlay,
        {
          autoAlpha: 0,
          duration: 0.6,
          ease: "power2.inOut",
        },
        "-=0.15",
      );
  }, [isAdminPanel]);

  if (!shouldRender || isAdminPanel) {
    return null;
  }

  return (
    <div ref={overlayRef} className={styles.overlay} aria-hidden="true">
      <span ref={logoRef} className={styles.logoWrapper}>
        <Image
          src={logoUrl}
          alt=""
          width={500}
          height={140}
          priority
          className={styles.logo}
        />
      </span>
    </div>
  );
}

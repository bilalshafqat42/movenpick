"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { gsap } from "@/lib/gsap";
import styles from "./ProjectGallery.module.css";

const AUTOPLAY_INTERVAL_MS = 5000;
const DRAG_DISTANCE_THRESHOLD = 60;

export default function ProjectGalleryClient({ slides }) {
  const slideCount = slides.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const sectionRef = useRef(null);
  const dragStateRef = useRef({ pointerId: null, startX: 0 });

  const [cursorVisible, setCursorVisible] = useState(false);
  const cursorRef = useRef(null);
  const cursorMoveXRef = useRef(null);
  const cursorMoveYRef = useRef(null);

  /*
   * A JS-driven cursor rather than the native CSS `cursor` property:
   * browsers cap how large a native cursor image can render (well under
   * the 200px this icon needs), so the only reliable way to show it at
   * full size in every browser is to position a real element under the
   * pointer instead.
   *
   * Visibility is driven by a global pointermove listener that checks the
   * pointer's coordinates against the section's bounding box, rather than
   * onMouseEnter/onMouseLeave on the section itself. Those events are
   * unreliable here: handlePointerDown below calls setPointerCapture
   * during a drag, and a captured pointer can leave the section's visible
   * area without ever firing mouseleave, which is exactly what left the
   * icon stuck on screen after a drag that ended outside the section.
   */
  useEffect(() => {
    const cursor = cursorRef.current;

    if (!cursor) {
      return undefined;
    }

    cursorMoveXRef.current = gsap.quickTo(cursor, "x", {
      duration: 0.35,
      ease: "power3.out",
    });

    cursorMoveYRef.current = gsap.quickTo(cursor, "y", {
      duration: 0.35,
      ease: "power3.out",
    });

    let wasInside = false;

    const handlePointerMove = (event) => {
      const section = sectionRef.current;

      if (!section || event.pointerType !== "mouse") {
        return;
      }

      const rect = section.getBoundingClientRect();
      const isInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (isInside && !wasInside) {
        gsap.set(cursor, { x: event.clientX, y: event.clientY });
      }

      wasInside = isInside;

      setCursorVisible(isInside);

      if (isInside) {
        cursorMoveXRef.current?.(event.clientX);
        cursorMoveYRef.current?.(event.clientY);
      }
    };

    const handlePointerLeaveWindow = () => {
      wasInside = false;
      setCursorVisible(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeaveWindow);
    window.addEventListener("blur", handlePointerLeaveWindow);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeaveWindow);
      window.removeEventListener("blur", handlePointerLeaveWindow);
    };
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % slideCount);
  }, [slideCount]);

  const goPrevious = useCallback(() => {
    setActiveIndex((current) => (current - 1 + slideCount) % slideCount);
  }, [slideCount]);

  /*
   * Autoplay. Restarts its wait after every change — automatic or
   * manual — so a visitor who just dragged to a slide gets the full
   * interval to look at it before it advances again.
   */
  useEffect(() => {
    if (isDragging || slideCount <= 1) {
      return undefined;
    }

    const timer = window.setInterval(goNext, AUTOPLAY_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [activeIndex, isDragging, slideCount, goNext]);

  const handlePointerDown = useCallback((event) => {
    if (event.button > 0) {
      return;
    }

    dragStateRef.current = { pointerId: event.pointerId, startX: event.clientX };
    setIsDragging(true);

    sectionRef.current?.setPointerCapture?.(event.pointerId);
  }, []);

  const handlePointerUp = useCallback(
    (event) => {
      const drag = dragStateRef.current;

      if (drag.pointerId !== event.pointerId) {
        return;
      }

      const distance = event.clientX - drag.startX;

      sectionRef.current?.releasePointerCapture?.(event.pointerId);
      setIsDragging(false);
      dragStateRef.current = { pointerId: null, startX: 0 };

      if (Math.abs(distance) < DRAG_DISTANCE_THRESHOLD) {
        return;
      }

      if (distance < 0) {
        goNext();
      } else {
        goPrevious();
      }
    },
    [goNext, goPrevious],
  );

  const handlePointerCancel = useCallback((event) => {
    sectionRef.current?.releasePointerCapture?.(event.pointerId);
    setIsDragging(false);
    dragStateRef.current = { pointerId: null, startX: 0 };
  }, []);

  const activeSlide = slides[activeIndex];

  /*
   * The classic range-slider-thumb trick: positioning the fill's left
   * edge at X% and then shifting it back by X% of its OWN width (via
   * transform, not a track-relative unit) means it lands flush against
   * the track's left edge at X=0 and flush against the right edge at
   * X=100 — regardless of whether the fill's width is a percentage or,
   * on desktop, a fixed 150px. A plain percentage `left` alone would
   * push a fixed-width fill past the track's right edge at X=100.
   */
  const fillLeftPercent =
    slideCount > 1 ? (activeIndex / (slideCount - 1)) * 100 : 0;

  return (
    <section
      ref={sectionRef}
      id="project-gallery"
      className={styles.gallery}
      data-dragging={isDragging ? "true" : "false"}
      role="region"
      aria-roledescription="carousel"
      aria-label="Project gallery. Drag to change image."
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {slides.map((slide, index) => (
        <div
          key={index}
          className={styles.slide}
          data-active={index === activeIndex ? "true" : "false"}
          aria-hidden={index === activeIndex ? undefined : "true"}
        >
          <Image
            src={slide.image}
            alt={slide.alt}
            fill
            priority={index === 0}
            draggable={false}
            quality={85}
            sizes="100vw"
            className={styles.image}
          />
        </div>
      ))}

      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.content}>
        <h2 key={`heading-${activeIndex}`} className={styles.heading}>
          {activeSlide.heading}
        </h2>

        <p key={`text-${activeIndex}`} className={styles.text}>
          {activeSlide.text}
        </p>

        <div className={styles.pagination}>
          <div className={styles.track} aria-hidden="true">
            <div
              className={styles.trackFill}
              style={{
                left: `${fillLeftPercent}%`,
                transform: `translateX(-${fillLeftPercent}%)`,
              }}
            />
          </div>

          <span className={styles.counter}>
            {String(activeIndex + 1).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div
        ref={cursorRef}
        className={styles.customCursor}
        data-visible={cursorVisible ? "true" : "false"}
        aria-hidden="true"
      >
        <Image src="/images/drag-icon.svg" alt="" width={200} height={200} />
      </div>
    </section>
  );
}

"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, useGSAP);

/*
 * GSAP's built-in refresh-on-window-load can fire before the page's
 * true layout has settled (hydration, font swap, and similar late
 * shifts can still change section heights right after "load"). When
 * that happens, every ScrollTrigger on the page locks in start/end
 * positions measured against a shorter, stale document height, so
 * sections further down the page trigger their reveals noticeably
 * too early relative to where they actually end up.
 *
 * Watching the document's own height and refreshing shortly after
 * it stops changing keeps every ScrollTrigger on the page accurate,
 * regardless of what caused the late shift.
 */
if (typeof window !== "undefined" && typeof ResizeObserver !== "undefined") {
  let refreshTimeout;

  const scheduleRefresh = () => {
    window.clearTimeout(refreshTimeout);
    refreshTimeout = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);
  };

  const observer = new ResizeObserver(scheduleRefresh);
  observer.observe(document.documentElement);
}

export { gsap, ScrollTrigger, useGSAP };

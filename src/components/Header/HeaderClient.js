"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import {
  ENTRANCE_STAGGER,
  ENTRANCE_DURATION,
  ENTRANCE_EASE,
  INTRO_BREAKPOINT,
  introStepStart,
} from "@/lib/motion";

import styles from "./Header.module.css";

const DESKTOP_MEDIA_QUERY = "(min-width: 901px)";

const FOCUSABLE_SELECTOR = [
  "a[href]:not([tabindex='-1'])",
  "button:not([disabled]):not([tabindex='-1'])",
  "input:not([disabled]):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const BLOCKED_SCROLL_KEYS = [
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
];

export default function HeaderClient({ menuItems, logoUrl, ctaLabel, ctaHref }) {
  const logoMaskStyle = logoUrl
    ? { "--logo-mask-url": `url("${logoUrl}")` }
    : undefined;

  const headerRef = useRef(null);
  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);
  const closeButtonRef = useRef(null);

  const menuTimelineRef = useRef(null);
  const pendingNavigationRef = useRef("");

  const scrollPositionRef = useRef(0);
  const scrollLockedRef = useRef(false);
  const desktopScrollLockRef = useRef(false);

  const previousStylesRef = useRef({
    bodyOverflow: "",
    bodyPosition: "",
    bodyTop: "",
    bodyLeft: "",
    bodyRight: "",
    bodyWidth: "",
    bodyPaddingRight: "",
    htmlOverflow: "",
    htmlOverflowY: "",
    htmlScrollbarGutter: "",
  });

  const [menuOpen, setMenuOpen] = useState(false);

  const prefersReducedMotion = useCallback(() => {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  /*
   * Desktop:
   * Keep the real scrollbar visible so the layout width
   * remains unchanged.
   *
   * Mobile:
   * Do not reserve a desktop scrollbar gutter. Use a fixed
   * body lock for reliable Safari/iOS background locking.
   */
  const lockPageScroll = useCallback(() => {
    if (scrollLockedRef.current) {
      return;
    }

    const body = document.body;
    const html = document.documentElement;

    const isDesktop = window.matchMedia(DESKTOP_MEDIA_QUERY).matches;

    scrollPositionRef.current = window.scrollY;

    previousStylesRef.current = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyPaddingRight: body.style.paddingRight,
      htmlOverflow: html.style.overflow,
      htmlOverflowY: html.style.overflowY,
      htmlScrollbarGutter: html.style.scrollbarGutter,
    };

    if (isDesktop) {
      html.style.scrollbarGutter = "stable";
      html.style.overflowY = "scroll";
      html.dataset.megaMenuOpen = "true";

      desktopScrollLockRef.current = true;
      scrollLockedRef.current = true;

      return;
    }

    /*
     * Mobile must not reserve a desktop scrollbar column.
     */
    html.style.scrollbarGutter = "auto";
    html.style.overflowY = "auto";

    body.style.position = "fixed";
    body.style.top = `-${scrollPositionRef.current}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    body.style.paddingRight = "0";

    desktopScrollLockRef.current = false;
    scrollLockedRef.current = true;
  }, []);

  const unlockPageScroll = useCallback(() => {
    if (!scrollLockedRef.current) {
      return;
    }

    const body = document.body;
    const html = document.documentElement;

    const previousStyles = previousStylesRef.current;
    const savedScrollY = scrollPositionRef.current;
    const wasDesktopLocked = desktopScrollLockRef.current;

    delete html.dataset.megaMenuOpen;

    body.style.overflow = previousStyles.bodyOverflow;
    body.style.position = previousStyles.bodyPosition;
    body.style.top = previousStyles.bodyTop;
    body.style.left = previousStyles.bodyLeft;
    body.style.right = previousStyles.bodyRight;
    body.style.width = previousStyles.bodyWidth;
    body.style.paddingRight = previousStyles.bodyPaddingRight;

    html.style.overflow = previousStyles.htmlOverflow;
    html.style.overflowY = previousStyles.htmlOverflowY;
    html.style.scrollbarGutter = previousStyles.htmlScrollbarGutter;

    scrollLockedRef.current = false;
    desktopScrollLockRef.current = false;

    /*
     * Desktop never changes body positioning.
     */
    if (wasDesktopLocked) {
      return;
    }

    /*
     * Restore the exact mobile scroll position after
     * removing the fixed-body lock.
     */
    window.scrollTo({
      top: savedScrollY,
      left: 0,
      behavior: "auto",
    });
  }, []);

  const scrollToSection = useCallback(
    (href) => {
      if (!href) {
        return;
      }

      const reduceMotion = prefersReducedMotion();

      /*
       * Several sections (Amenities, Project, the Hero/About scene) pin
       * themselves via a scrubbed, snapping ScrollTrigger. A native
       * window.scrollTo() animates the scroll position completely
       * outside GSAP's control, so it fights that snap for control of
       * the scroll position instead of cooperating with it — the two
       * can visibly get stuck fighting each other partway there,
       * especially on mobile. Driving the jump through GSAP's own
       * ScrollToPlugin keeps it on the same engine ScrollTrigger already
       * coordinates with, so nothing fights it.
       *
       * autoKill is explicitly false: ScrollToPlugin's autoKill can't
       * tell the difference between a user grabbing the scrollbar and
       * one of those snap ScrollTriggers correcting the scroll position
       * as we pass through it — both look like "something else changed
       * the scroll" to it. With autoKill on, that snap correction was
       * killing our tween mid-flight, landing on a completely unrelated
       * section instead of the intended target. Losing "a real scroll
       * gesture interrupts the jump" is an acceptable trade for actually
       * arriving where the link says it goes.
       */
      if (href === "#home") {
        gsap.to(window, {
          scrollTo: { y: 0, autoKill: false },
          duration: reduceMotion ? 0 : 1.1,
          ease: "power2.inOut",
          overwrite: true,
        });

        return;
      }

      const target = document.querySelector(href);

      if (!target) {
        return;
      }

      /*
       * No header-height offset: every full-viewport section (Amenities,
       * Project, Payment, SeaSection, ...) reveals itself via a scrubbed
       * clip-path whose completion trigger is the section's top hitting
       * the true viewport top (y=0). Landing short of that by even the
       * header's height leaves the reveal genuinely incomplete — not
       * just visually lagging — since scrub maps scroll position to
       * animation progress directly. The header is a transparent glass
       * overlay by design (see its "scrolled" state), so it's meant to
       * float over a fully-revealed section rather than sit above it.
       */
      gsap.to(window, {
        scrollTo: {
          y: target,
          autoKill: false,
        },
        duration: reduceMotion ? 0 : 1.1,
        ease: "power2.inOut",
        overwrite: true,
      });
    },
    [prefersReducedMotion],
  );

  /*
   * Header entrance and glassmorphism state.
   */
  useGSAP(
    () => {
      const header = headerRef.current;

      if (!header) {
        return undefined;
      }

      const reduceMotion = prefersReducedMotion();

      let introTimeline;

      if (!reduceMotion) {
        /*
         * On the home page, desktop only, these controls are the second
         * beat of the page-load sequence: they wait for the hero's
         * opening copy to land, hold for a beat, and then come down.
         * The photo and pattern follow them.
         *
         * Gated on the hero actually being present rather than on the
         * route, because the other pages (privacy, terms, thank-you)
         * have no opening copy to wait for — there the header should
         * simply arrive, as it always has.
         */
        const waitsForHero =
          Boolean(document.getElementById("home")) &&
          window.matchMedia(INTRO_BREAKPOINT).matches;

        introTimeline = gsap.timeline({
          delay: waitsForHero ? introStepStart(1) : 0,

          defaults: {
            ease: ENTRANCE_EASE,
          },
        });

        /*
         * fromTo, not from. `from` treats the element's CURRENT state as
         * the destination, and these four now start hidden in CSS so
         * that nothing flashes before the sequence reaches them (see the
         * intro block in Header.module.css). Read that way, `from`
         * animated each control from invisible to invisible and the
         * header never appeared at all. The destination has to be
         * stated.
         */
        introTimeline
          .fromTo(
            `.${styles.menuControl}`,
            { autoAlpha: 0, y: -14 },
            { autoAlpha: 1, y: 0, duration: ENTRANCE_DURATION },
            0,
          )
          .fromTo(
            `.${styles.logo}`,
            { autoAlpha: 0, y: -14 },
            { autoAlpha: 1, y: 0, duration: ENTRANCE_DURATION },
            ENTRANCE_STAGGER,
          )
          .fromTo(
            `.${styles.callback}`,
            { autoAlpha: 0, y: -14 },
            { autoAlpha: 1, y: 0, duration: ENTRANCE_DURATION },
            ENTRANCE_STAGGER * 2,
          )
          .fromTo(
            `.${styles.divider}`,
            { scaleX: 0, transformOrigin: "left center" },
            { scaleX: 1, transformOrigin: "left center", duration: ENTRANCE_DURATION },
            ENTRANCE_STAGGER * 3,
          );
      } else {
        gsap.set(
          [
            `.${styles.menuControl}`,
            `.${styles.logo}`,
            `.${styles.callback}`,
            `.${styles.divider}`,
          ],
          {
            clearProps: "all",
            autoAlpha: 1,
          },
        );
      }

      /*
       * Frosted-glass background past a small scroll threshold. The header
       * is a solid cream bar at rest; this only adds the blur once there is
       * page content behind it to blur.
       */
      const headerScrollTrigger = ScrollTrigger.create({
        start: 24,
        end: "max",

        onUpdate: (self) => {
          header.dataset.scrolled = self.scroll() > 24 ? "true" : "false";
        },
      });

      return () => {
        introTimeline?.kill();
        headerScrollTrigger.kill();
      };
    },
    {
      scope: headerRef,
      dependencies: [prefersReducedMotion],
    },
  );

  /*
   * Full-screen navigation reveal.
   */
  useGSAP(
    () => {
      const menu = menuRef.current;

      if (!menu) {
        return undefined;
      }

      const reduceMotion = prefersReducedMotion();

      gsap.set(menu, {
        clipPath: "inset(0 100% 0 0)",
        visibility: "visible",
        pointerEvents: "none",
      });

      const timeline = gsap.timeline({
        paused: true,

        defaults: {
          ease: reduceMotion ? "none" : "power4.inOut",
        },

        onStart: () => {
          gsap.set(menu, {
            pointerEvents: "auto",
          });
        },

        onComplete: () => {
          window.requestAnimationFrame(() => {
            closeButtonRef.current?.focus({
              preventScroll: true,
            });
          });
        },

        onReverseComplete: () => {
          gsap.set(menu, {
            pointerEvents: "none",
          });

          unlockPageScroll();
          setMenuOpen(false);

          const pendingHref = pendingNavigationRef.current;

          pendingNavigationRef.current = "";

          if (pendingHref) {
            window.requestAnimationFrame(() => {
              scrollToSection(pendingHref);
            });

            return;
          }

          window.requestAnimationFrame(() => {
            menuButtonRef.current?.focus({
              preventScroll: true,
            });
          });
        },
      });

      const openDuration = reduceMotion ? 0.01 : 1.15;
      const itemDuration = reduceMotion ? 0.01 : 0.7;

      timeline
        .to(menu, {
          clipPath: "inset(0 0% 0 0)",
          duration: openDuration,
        })
        .from(
          `.${styles.closeButton}`,
          {
            autoAlpha: 0,
            rotate: reduceMotion ? 0 : -45,
            duration: reduceMotion ? 0.01 : 0.6,
            ease: reduceMotion ? "none" : "power3.out",
          },
          reduceMotion ? 0 : 0.45,
        )
        .from(
          `.${styles.menuLogo}`,
          {
            autoAlpha: 0,
            y: reduceMotion ? 0 : -16,
            duration: itemDuration,
            ease: reduceMotion ? "none" : "power3.out",
          },
          reduceMotion ? 0 : 0.45,
        )
        .from(
          `.${styles.menuItem}`,
          {
            autoAlpha: 0,
            x: reduceMotion ? 0 : -28,
            duration: itemDuration,
            stagger: reduceMotion ? 0 : 0.07,
            ease: reduceMotion ? "none" : "power3.out",
          },
          reduceMotion ? 0 : 0.5,
        );

      menuTimelineRef.current = timeline;

      return () => {
        timeline.kill();
        menuTimelineRef.current = null;
      };
    },
    {
      scope: menuRef,
      dependencies: [prefersReducedMotion, scrollToSection, unlockPageScroll],
    },
  );

  const openMenu = useCallback(() => {
    const timeline = menuTimelineRef.current;

    /*
     * menuOpen stays true for the whole closing animation, so a
     * plain menuOpen check would swallow clicks made while the
     * menu is still reversing. Only a fully open menu (not
     * reversed, not mid-close) should block re-opening.
     */
    const isClosing = timeline?.reversed() ?? false;

    if (menuOpen && !isClosing) {
      return;
    }

    pendingNavigationRef.current = "";

    lockPageScroll();
    setMenuOpen(true);

    if (!timeline) {
      unlockPageScroll();
      setMenuOpen(false);
      return;
    }

    if (isClosing) {
      timeline.play();
      return;
    }

    timeline.restart();
  }, [lockPageScroll, menuOpen, unlockPageScroll]);

  const closeMenu = useCallback(() => {
    pendingNavigationRef.current = "";

    const timeline = menuTimelineRef.current;

    if (!timeline) {
      unlockPageScroll();
      setMenuOpen(false);
      return;
    }

    timeline.reverse();
  }, [unlockPageScroll]);

  const handleHeaderNavigation = useCallback(
    (event, href) => {
      event.preventDefault();
      scrollToSection(href);
    },
    [scrollToSection],
  );

  const handleMenuNavigation = useCallback(
    (event, href) => {
      event.preventDefault();

      pendingNavigationRef.current = href;

      const timeline = menuTimelineRef.current;

      if (!timeline) {
        pendingNavigationRef.current = "";

        unlockPageScroll();
        setMenuOpen(false);
        scrollToSection(href);

        return;
      }

      timeline.reverse();
    },
    [scrollToSection, unlockPageScroll],
  );

  /*
   * Escape closes the open menu.
   */
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && menuOpen) {
        event.preventDefault();
        closeMenu();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen, closeMenu]);

  /*
   * Desktop background-scroll prevention.
   *
   * The scrollbar remains visible, but wheel, trackpad,
   * touch and keyboard scrolling are blocked.
   */
  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const isDesktop = window.matchMedia(DESKTOP_MEDIA_QUERY).matches;

    if (!isDesktop) {
      return undefined;
    }

    const preventScroll = (event) => {
      event.preventDefault();
    };

    const preventScrollKeys = (event) => {
      const activeElement = document.activeElement;

      const isEditable =
        activeElement instanceof HTMLElement &&
        (activeElement.matches("input, textarea, select") ||
          activeElement.isContentEditable);

      if (isEditable) {
        return;
      }

      if (BLOCKED_SCROLL_KEYS.includes(event.key)) {
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", preventScroll, {
      passive: false,
    });

    window.addEventListener("touchmove", preventScroll, {
      passive: false,
    });

    window.addEventListener("keydown", preventScrollKeys);

    return () => {
      window.removeEventListener("wheel", preventScroll);

      window.removeEventListener("touchmove", preventScroll);

      window.removeEventListener("keydown", preventScrollKeys);
    };
  }, [menuOpen]);

  /*
   * Keyboard focus trap.
   */
  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const menu = menuRef.current;

    if (!menu) {
      return undefined;
    }

    const handleFocusTrap = (event) => {
      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        menu.querySelectorAll(FOCUSABLE_SELECTOR),
      ).filter((element) => {
        return (
          element instanceof HTMLElement &&
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !== "true"
        );
      });

      if (focusableElements.length === 0) {
        event.preventDefault();
        closeButtonRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];

      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleFocusTrap);

    return () => {
      document.removeEventListener("keydown", handleFocusTrap);
    };
  }, [menuOpen]);

  /*
   * Cleanup if the component unmounts while locked.
   */
  useEffect(() => {
    return () => {
      if (scrollLockedRef.current) {
        unlockPageScroll();
      }
    };
  }, [unlockPageScroll]);

  return (
    <>
      <header ref={headerRef} className={styles.header} data-scrolled="false">
        <div className={styles.inner}>
          <button
            ref={menuButtonRef}
            type="button"
            className={styles.menuControl}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            aria-controls="movenpick-menu"
            onClick={openMenu}
          >
            <span className={styles.menuIcon} aria-hidden="true" />

            <span className={styles.menuText}>Menu</span>
          </button>

          <a
            href="#home"
            className={styles.logo}
            aria-label="Return to the Movenpick Hero section"
            onClick={(event) => handleHeaderNavigation(event, "#home")}
          >
            <span
              className={styles.logoMark}
              style={logoMaskStyle}
              aria-hidden="true"
            />
          </a>

          {/*
           * "#contact" (the field's own default) opens the enquiry popup,
           * exactly as before — anything else the panel is told to use is
           * a real, working link, not silently overridden by the popup
           * regardless of what was typed. See navigation.js's own field
           * label.
           */}
          <a
            href={ctaHref}
            className={styles.callback}
            {...(ctaHref === "#contact" ? { "data-contact-popup": true } : {})}
          >
            {ctaLabel}
          </a>
        </div>

        <div className={styles.divider} aria-hidden="true" />
      </header>

      <div
        ref={menuRef}
        id="movenpick-menu"
        className={styles.menuOverlay}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className={styles.menuBluePanel}>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            aria-label="Close navigation menu"
            onClick={closeMenu}
            tabIndex={menuOpen ? 0 : -1}
          >
            <span className={styles.closeIcon} aria-hidden="true" />
          </button>

          <a
            href="#home"
            className={styles.menuLogo}
            aria-label="Return to the Movenpick Hero section"
            onClick={(event) => handleMenuNavigation(event, "#home")}
            tabIndex={menuOpen ? 0 : -1}
          >
            <span
              className={styles.menuLogoMark}
              style={logoMaskStyle}
              aria-hidden="true"
            />
          </a>

          <nav className={styles.menuNavigation} aria-label="Main navigation">
            <ul className={styles.menuList}>
              {menuItems.map((item) => (
                <li key={item.href} className={styles.menuItem}>
                  <a
                    href={item.href}
                    className={styles.menuLink}
                    onClick={(event) => handleMenuNavigation(event, item.href)}
                    tabIndex={menuOpen ? 0 : -1}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <button
          type="button"
          className={styles.menuImagePanel}
          aria-label="Close navigation menu"
          onClick={closeMenu}
          tabIndex={menuOpen ? 0 : -1}
        />
      </div>
    </>
  );
}

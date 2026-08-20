"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import { GALLERY_ITEM_COUNT } from "@/content/sections/gallery";
import styles from "./Gallery.module.css";

const DRAG_DISTANCE_THRESHOLD = 64;
const DRAG_VELOCITY_THRESHOLD = 0.45;
const DRAG_RESISTANCE = 0.72;

const getLoopedIndex = (index) => {
  return (index + GALLERY_ITEM_COUNT) % GALLERY_ITEM_COUNT;
};

export default function GalleryClient({ heading, text, items: galleryItems }) {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const carouselRef = useRef(null);

  const [cursorVisible, setCursorVisible] = useState(false);
  const cursorRef = useRef(null);
  const cursorMoveXRef = useRef(null);
  const cursorMoveYRef = useRef(null);

  const cardRefs = useRef([]);
  const imageWrapperRefs = useRef([]);
  const contentRefs = useRef([]);

  const activeIndexRef = useRef(0);
  const animationRef = useRef(null);

  const dragStateRef = useRef({
    isDragging: false,
    pointerId: null,
    startX: 0,
    currentX: 0,
    startTime: 0,
    moved: false,
    basePositions: [],
    startCardIndex: null,
    pointerType: "mouse",
  });

  const ignoreClickRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  /*
   * A JS-driven cursor rather than the native CSS `cursor` property — see
   * ProjectGalleryClient for why: browsers cap how large a native cursor
   * image can render, so a real element positioned under the pointer is
   * the only way to show this icon at full size in every browser.
   *
   * Visibility is driven by a global pointermove listener checked against
   * the carousel's bounding box, rather than onMouseEnter/onMouseLeave on
   * the carousel itself — this carousel calls setPointerCapture during a
   * drag (see handlePointerDown below), and a captured pointer can leave
   * the visible area without ever firing mouseleave, which would leave
   * the icon stuck on screen after a drag ends outside the carousel.
   */
  useEffect(() => {
    const cursor = cursorRef.current;

    if (!cursor) {
      return undefined;
    }

    cursorMoveXRef.current = gsap.quickTo(cursor, "x", {
      duration: 0.12,
      ease: "power3.out",
    });

    cursorMoveYRef.current = gsap.quickTo(cursor, "y", {
      duration: 0.12,
      ease: "power3.out",
    });

    let wasInside = false;

    const handlePointerMove = (event) => {
      const carousel = carouselRef.current;

      if (!carousel || event.pointerType !== "mouse") {
        return;
      }

      const rect = carousel.getBoundingClientRect();
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

  /*
   * Desktop dimensions:
   *
   * Centre: 8 of 12 page columns wide (see the desktop tier below),
   *         900 × 600's own 3:2 aspect ratio preserved at any width
   * Side:   210 × 446
   *
   * Mobile (≤767px) is driven by viewport height instead: the centre
   * card is a tall 50vh portrait card rather than a short landscape
   * strip, so it reads as "vertical" and fills most of the screen.
   */
  const getResponsiveSizes = useCallback(() => {
    const viewportWidth = carouselRef.current?.clientWidth || window.innerWidth;

    if (viewportWidth <= 480) {
      /*
       * Mobile centre card: 50% of the *viewport's height* (not the
       * old width-driven 3:2 landscape crop) — a tall, portrait card
       * that reads as "vertical" and fills most of the screen, rather
       * than a short strip. 0.75 (3:4) is a portrait aspect ratio;
       * the viewportWidth cap keeps it from ever overflowing sideways
       * on unusually tall/narrow devices.
       */
      const centreHeight = window.innerHeight * 0.5;
      const centreWidth = Math.min(centreHeight * 0.75, viewportWidth * 0.86);

      const sideWidth = Math.max(48, viewportWidth * 0.11);
      const sideHeight = sideWidth * (446 / 210);

      return {
        centreWidth,
        centreHeight,
        sideWidth,
        sideHeight,
        sideYOffset: centreHeight - sideHeight,
      };
    }

    if (viewportWidth <= 767) {
      const centreHeight = window.innerHeight * 0.5;
      const centreWidth = Math.min(centreHeight * 0.75, viewportWidth * 0.86);

      const sideWidth = Math.max(62, viewportWidth * 0.13);
      const sideHeight = sideWidth * (446 / 210);

      return {
        centreWidth,
        centreHeight,
        sideWidth,
        sideHeight,
        sideYOffset: centreHeight - sideHeight,
      };
    }

    if (viewportWidth <= 1024) {
      const centreWidth = Math.min(560, viewportWidth * 0.58);
      const centreHeight = centreWidth * (600 / 900);

      const sideWidth = 138;
      const sideHeight = sideWidth * (446 / 210);

      return {
        centreWidth,
        centreHeight,
        sideWidth,
        sideHeight,
        sideYOffset: centreHeight - sideHeight,
      };
    }

    if (viewportWidth <= 1350) {
      const centreWidth = Math.min(620, viewportWidth * 0.5);
      const centreHeight = centreWidth * (600 / 900);

      const sideWidth = 175;
      const sideHeight = sideWidth * (446 / 210);

      return {
        centreWidth,
        centreHeight,
        sideWidth,
        sideHeight,
        sideYOffset: centreHeight - sideHeight,
      };
    }

    /*
     * 8 of the page's 12 columns wide, same technique as Hero's framed
     * building photo (Hero.module.css .imageFrame): 66.667vw is 8/12
     * of the viewport, capped so it doesn't grow unreasonably large
     * on very wide screens.
     */
    const centreWidth = Math.min(viewportWidth * 0.66667, 1100);
    const centreHeight = centreWidth * (600 / 900);

    return {
      centreWidth,
      centreHeight,
      sideWidth: 210,
      sideHeight: 446,
      sideYOffset: centreHeight - 446,
    };
  }, []);

  const getCardPosition = useCallback((cardIndex, nextActiveIndex) => {
    if (cardIndex === nextActiveIndex) {
      return "centre";
    }

    if (cardIndex === getLoopedIndex(nextActiveIndex - 1)) {
      return "left";
    }

    if (cardIndex === getLoopedIndex(nextActiveIndex + 1)) {
      return "right";
    }

    return "hidden";
  }, []);

  const getCardState = useCallback(
    (cardIndex, nextActiveIndex) => {
      const carousel = carouselRef.current;

      if (!carousel) {
        return null;
      }

      const { centreWidth, centreHeight, sideWidth, sideHeight, sideYOffset } =
        getResponsiveSizes();

      const carouselWidth = carousel.clientWidth;
      const position = getCardPosition(cardIndex, nextActiveIndex);

      const leftX = -(carouselWidth / 2) + sideWidth / 2;
      const rightX = carouselWidth / 2 - sideWidth / 2;

      if (position === "centre") {
        return {
          position: "centre",
          x: 0,
          y: 0,
          width: centreWidth,
          imageHeight: centreHeight,
          cardOpacity: 1,
          contentOpacity: 1,
          contentY: 0,
          visibility: "visible",
          zIndex: 4,
          pointerEvents: "auto",
        };
      }

      if (position === "left") {
        return {
          position: "left",
          x: leftX,
          y: sideYOffset,
          width: sideWidth,
          imageHeight: sideHeight,
          cardOpacity: 0.62,
          contentOpacity: 0,
          contentY: 14,
          visibility: "visible",
          zIndex: 2,
          pointerEvents: "auto",
        };
      }

      if (position === "right") {
        return {
          position: "right",
          x: rightX,
          y: sideYOffset,
          width: sideWidth,
          imageHeight: sideHeight,
          cardOpacity: 0.62,
          contentOpacity: 0,
          contentY: 14,
          visibility: "visible",
          zIndex: 2,
          pointerEvents: "auto",
        };
      }

      return {
        position: "hidden",
        x: 0,
        y: sideYOffset,
        width: sideWidth,
        imageHeight: sideHeight,
        cardOpacity: 0,
        contentOpacity: 0,
        contentY: 14,
        visibility: "hidden",
        zIndex: 1,
        pointerEvents: "none",
      };
    },
    [getCardPosition, getResponsiveSizes],
  );

  const positionCards = useCallback(
    ({ nextActiveIndex, immediate = false, duration = 1.05, onComplete }) => {
      const cards = cardRefs.current;
      const imageWrappers = imageWrapperRefs.current;
      const contents = contentRefs.current;

      const allElementsReady =
        cards.filter(Boolean).length === galleryItems.length &&
        imageWrappers.filter(Boolean).length === galleryItems.length &&
        contents.filter(Boolean).length === galleryItems.length;

      if (!allElementsReady) {
        onComplete?.();
        return;
      }

      animationRef.current?.kill();
      animationRef.current = null;

      if (immediate) {
        cards.forEach((card, index) => {
          const imageWrapper = imageWrappers[index];
          const content = contents[index];
          const state = getCardState(index, nextActiveIndex);

          if (!card || !imageWrapper || !content || !state) {
            return;
          }

          card.dataset.position = state.position;

          gsap.set(card, {
            xPercent: -50,
            x: state.x,
            y: state.y,
            width: state.width,
            autoAlpha: state.cardOpacity,
            visibility: state.visibility,
            zIndex: state.zIndex,
            pointerEvents: state.pointerEvents,
          });

          gsap.set(imageWrapper, {
            height: state.imageHeight,
          });

          gsap.set(content, {
            autoAlpha: state.contentOpacity,
            y: state.contentY,
          });
        });

        onComplete?.();
        return;
      }

      const timeline = gsap.timeline({
        defaults: {
          overwrite: "auto",
        },

        onComplete: () => {
          cards.forEach((card, index) => {
            const state = getCardState(index, nextActiveIndex);

            if (!card || !state) {
              return;
            }

            card.dataset.position = state.position;

            gsap.set(card, {
              visibility: state.visibility,
              pointerEvents: state.pointerEvents,
              zIndex: state.zIndex,
            });
          });

          animationRef.current = null;
          onComplete?.();
        },

        onInterrupt: () => {
          animationRef.current = null;
        },
      });

      animationRef.current = timeline;

      cards.forEach((card, index) => {
        const imageWrapper = imageWrappers[index];
        const content = contents[index];
        const state = getCardState(index, nextActiveIndex);

        if (!card || !imageWrapper || !content || !state) {
          return;
        }

        const previousPosition = card.dataset.position;
        const isCurrentlyHidden = previousPosition === "hidden";
        const willBecomeHidden = state.position === "hidden";

        /*
         * Hidden card enters directly from its new edge
         * rather than travelling visibly behind the centre.
         */
        if (isCurrentlyHidden && !willBecomeHidden) {
          gsap.set(card, {
            xPercent: -50,
            x: state.x,
            y: state.y,
            width: state.width,
            autoAlpha: 0,
            visibility: "visible",
            zIndex: state.zIndex,
            pointerEvents: "none",
          });

          gsap.set(imageWrapper, {
            height: state.imageHeight,
          });

          gsap.set(content, {
            autoAlpha: 0,
            y: state.contentY,
          });

          card.dataset.position = state.position;

          timeline.to(
            card,
            {
              autoAlpha: state.cardOpacity,
              pointerEvents: state.pointerEvents,
              duration: 0.48,
              ease: "power3.out",
            },
            duration * 0.46,
          );

          return;
        }

        /*
         * Card leaving the visible carousel fades out
         * without looping visibly behind the images.
         */
        if (willBecomeHidden) {
          timeline.to(
            content,
            {
              autoAlpha: 0,
              y: 14,
              duration: 0.24,
              ease: "power2.in",
            },
            0,
          );

          timeline.to(
            card,
            {
              autoAlpha: 0,
              pointerEvents: "none",
              duration: 0.4,
              ease: "power2.in",
            },
            0,
          );

          timeline.set(
            card,
            {
              visibility: "hidden",
              zIndex: 1,
            },
            0.41,
          );

          timeline.set(
            imageWrapper,
            {
              height: state.imageHeight,
            },
            0.41,
          );

          card.dataset.position = "hidden";

          return;
        }

        card.dataset.position = state.position;

        timeline.to(
          card,
          {
            xPercent: -50,
            x: state.x,
            y: state.y,
            width: state.width,
            autoAlpha: state.cardOpacity,
            visibility: "visible",
            zIndex: state.zIndex,
            pointerEvents: state.pointerEvents,
            duration,
            ease: "power4.inOut",
          },
          0,
        );

        timeline.to(
          imageWrapper,
          {
            height: state.imageHeight,
            duration,
            ease: "power4.inOut",
          },
          0,
        );

        if (state.position === "centre") {
          timeline.to(
            content,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.5,
              ease: "power3.out",
            },
            duration * 0.54,
          );
        } else {
          timeline.to(
            content,
            {
              autoAlpha: 0,
              y: 14,
              duration: 0.24,
              ease: "power2.in",
            },
            0,
          );
        }
      });
    },
    /*
     * galleryItems.length is a constant: the carousel's loop arithmetic
     * depends on a stable count, so items cannot be added or removed (only
     * their content is editable). Listed anyway because it is genuinely read
     * here, and as a stable primitive it never re-creates the callback.
     */
    [getCardState, galleryItems.length],
  );

  const selectSlide = useCallback(
    (nextIndex) => {
      if (isAnimating || nextIndex === activeIndexRef.current) {
        return;
      }

      setIsAnimating(true);

      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);

      positionCards({
        nextActiveIndex: nextIndex,
        duration: 1.05,

        onComplete: () => {
          setIsAnimating(false);
        },
      });
    },
    [isAnimating, positionCards],
  );

  const showPrevious = useCallback(() => {
    selectSlide(getLoopedIndex(activeIndexRef.current - 1));
  }, [selectSlide]);

  const showNext = useCallback(() => {
    selectSlide(getLoopedIndex(activeIndexRef.current + 1));
  }, [selectSlide]);

  /*
   * Return cards to their normal position when a drag
   * is released without reaching the switching threshold.
   */
  const resetAfterDrag = useCallback(() => {
    const cards = cardRefs.current.filter(Boolean);

    const timeline = gsap.timeline({
      defaults: {
        overwrite: true,
      },

      onComplete: () => {
        animationRef.current = null;
      },
    });

    animationRef.current = timeline;

    cards.forEach((card, index) => {
      const state = getCardState(index, activeIndexRef.current);

      if (!state || state.position === "hidden") {
        return;
      }

      timeline.to(
        card,
        {
          x: state.x,
          duration: 0.62,
          ease: "power3.out",
        },
        0,
      );
    });
  }, [getCardState]);

  const handlePointerDown = useCallback(
    (event) => {
      if (isAnimating || event.button > 0) {
        return;
      }

      const carousel = carouselRef.current;

      if (!carousel) {
        return;
      }

      animationRef.current?.kill();
      animationRef.current = null;

      const basePositions = cardRefs.current.map((card, index) => {
        const state = getCardState(index, activeIndexRef.current);

        return {
          card,
          position: state?.position,
          baseX: state?.x ?? 0,
        };
      });

      // Record which card the pointer actually went down on. Needed
      // because pointer capture (below) means finishPointerDrag always
      // fires on the carousel element itself, not on whichever card
      // was under the cursor, so we can't wait and find out later.
      const cardElement = event.target.closest("[data-card-index]");
      const startCardIndex = cardElement
        ? Number(cardElement.dataset.cardIndex)
        : null;

      dragStateRef.current = {
        isDragging: true,
        pointerId: event.pointerId,
        startX: event.clientX,
        currentX: event.clientX,
        startTime: performance.now(),
        moved: false,
        basePositions,
        startCardIndex,
        pointerType: event.pointerType,
      };

      ignoreClickRef.current = false;

      carousel.setPointerCapture?.(event.pointerId);

      setIsDragging(true);
    },
    [getCardState, isAnimating],
  );

  const handlePointerMove = useCallback((event) => {
    const dragState = dragStateRef.current;

    if (!dragState.isDragging || dragState.pointerId !== event.pointerId) {
      return;
    }

    const rawDistance = event.clientX - dragState.startX;
    const resistedDistance = rawDistance * DRAG_RESISTANCE;

    dragState.currentX = event.clientX;

    if (Math.abs(rawDistance) > 5) {
      dragState.moved = true;
    }

    dragState.basePositions.forEach(({ card, position, baseX }) => {
      if (!card || position === "hidden") {
        return;
      }

      let movement = resistedDistance;

      /*
       * Side cards move slightly less than the centre,
       * creating a subtle depth effect during dragging.
       */
      if (position === "left" || position === "right") {
        movement *= 0.86;
      }

      gsap.set(card, {
        x: baseX + movement,
      });
    });
  }, []);

  const finishPointerDrag = useCallback(
    (event) => {
      const dragState = dragStateRef.current;

      if (!dragState.isDragging || dragState.pointerId !== event.pointerId) {
        return;
      }

      const carousel = carouselRef.current;
      const distance = dragState.currentX - dragState.startX;
      const elapsed = Math.max(performance.now() - dragState.startTime, 1);

      const velocity = distance / elapsed;

      dragStateRef.current.isDragging = false;
      dragStateRef.current.pointerId = null;

      carousel?.releasePointerCapture?.(event.pointerId);

      setIsDragging(false);

      const shouldChangeSlide =
        Math.abs(distance) >= DRAG_DISTANCE_THRESHOLD ||
        Math.abs(velocity) >= DRAG_VELOCITY_THRESHOLD;

      if (!shouldChangeSlide) {
        resetAfterDrag();

        // Desktop-only: resolve this release as a tap on whichever card
        // the pointer went down on, instead of waiting for the native
        // "click" event. Some browsers redirect click's target to the
        // element that called setPointerCapture (the carousel div)
        // rather than the card button actually under the cursor, which
        // silently breaks mouse click-to-select in those browsers.
        //
        // Restricted to non-touch input on purpose: touch tapping was
        // already working correctly through the ordinary click event
        // below, so it's left completely untouched here.
        if (
          dragState.pointerType !== "touch" &&
          dragState.startCardIndex !== null &&
          dragState.startCardIndex !== activeIndexRef.current
        ) {
          selectSlide(dragState.startCardIndex);
        }

        return;
      }

      // Only suppress the click the browser fires right after
      // pointerup when a drag actually changed the slide, so that
      // click doesn't also re-trigger selectSlide for this same
      // interaction. Small incidental mouse movement that doesn't
      // cross the threshold above must never set this, or normal
      // clicks stop working (see finishPointerDrag notes below).
      ignoreClickRef.current = true;

      /*
       * Dragging left reveals the next image.
       * Dragging right reveals the previous image.
       */
      if (distance < 0) {
        showNext();
      } else {
        showPrevious();
      }

      window.setTimeout(() => {
        ignoreClickRef.current = false;
      }, 80);
    },
    [resetAfterDrag, selectSlide, showNext, showPrevious],
  );

  const handlePointerCancel = useCallback(
    (event) => {
      const dragState = dragStateRef.current;

      if (!dragState.isDragging || dragState.pointerId !== event.pointerId) {
        return;
      }

      dragStateRef.current.isDragging = false;
      dragStateRef.current.pointerId = null;

      carouselRef.current?.releasePointerCapture?.(event.pointerId);

      setIsDragging(false);
      resetAfterDrag();
    },
    [resetAfterDrag],
  );

  const handleCardClick = useCallback(
    (event, index) => {
      if (ignoreClickRef.current) {
        event.preventDefault();
        ignoreClickRef.current = false;
        return;
      }

      selectSlide(index);
    },
    [selectSlide],
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevious();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
      }
    },
    [showPrevious, showNext],
  );

  useGSAP(
    () => {
      const section = sectionRef.current;
      const heading = headingRef.current;
      const carousel = carouselRef.current;

      if (!section || !heading || !carousel) {
        return;
      }

      positionCards({
        nextActiveIndex: activeIndexRef.current,
        immediate: true,
      });

      const matchMedia = gsap.matchMedia();

      matchMedia.add(
        {
          desktop: "(min-width: 768px)",
          mobile: "(max-width: 767px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { mobile = false, reduceMotion = false } =
            context.conditions ?? {};

          if (reduceMotion) {
            gsap.set(heading.children, {
              autoAlpha: 1,
              y: 0,
            });

            return;
          }

          gsap.set(heading.children, {
            autoAlpha: 0,
            y: mobile ? 20 : 32,
          });

          /*
           * Gallery entrance reveals piece by piece rather than the
           * whole card fading in as one unit:
           *
           * 1. Centre image fades up.
           * 2. Centre title/description fades up shortly after.
           * 3. Left image fades up shortly after that.
           * 4. Right image fades up last, once the left image
           *    has finished.
           *
           * The card elements themselves keep whatever opacity
           * positionCards already gave them (1 for centre, 0.62 for
           * the sides, set earlier via the immediate positionCards
           * call above), so only the image and text pieces inside
           * each card animate here, not the cards themselves.
           */
          const fadeUpDistance = mobile ? 18 : 26;

          const centreCardIndex = cardRefs.current.findIndex(
            (card) => card?.dataset.position === "centre",
          );
          const leftCardIndex = cardRefs.current.findIndex(
            (card) => card?.dataset.position === "left",
          );
          const rightCardIndex = cardRefs.current.findIndex(
            (card) => card?.dataset.position === "right",
          );

          const centreImage =
            centreCardIndex >= 0
              ? imageWrapperRefs.current[centreCardIndex]
              : null;
          const centreContent =
            centreCardIndex >= 0 ? contentRefs.current[centreCardIndex] : null;
          const leftImage =
            leftCardIndex >= 0 ? imageWrapperRefs.current[leftCardIndex] : null;
          const rightImage =
            rightCardIndex >= 0
              ? imageWrapperRefs.current[rightCardIndex]
              : null;

          /*
           * The centre card's title and description fade up
           * one at a time rather than as a single fused block.
           */
          const centreContentChildren = centreContent
            ? Array.from(centreContent.children)
            : [];

          const revealPieces = [
            centreImage,
            ...centreContentChildren,
            leftImage,
            rightImage,
          ].filter(Boolean);

          if (revealPieces.length) {
            gsap.set(revealPieces, { autoAlpha: 0, y: fadeUpDistance });
          }

          const entranceTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top 80%",

              /*
               * The section itself is fully in place after a
               * single scroll into view. The pieces inside it
               * then play their own one-by-one reveal on top of
               * that, rather than being tied to further scrolling.
               *
               * Scrolling back up past this point reverses the
               * reveal, so it replays if someone scrolls away
               * and back again instead of only firing once.
               */
              toggleActions: "play none none reverse",
              invalidateOnRefresh: true,
            },
          });

          entranceTimeline.to(heading.children, {
            autoAlpha: 1,
            y: 0,
            duration: 0.82,
            stagger: 0.1,
            ease: "power3.out",
          });

          if (centreImage) {
            entranceTimeline.to(
              centreImage,
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.85,
                ease: "power3.out",
              },
              "-=0.42",
            );
          }

          if (centreContentChildren.length) {
            entranceTimeline.to(
              centreContentChildren,
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.16,
                ease: "power3.out",
              },
              "<+=0.16",
            );
          }

          if (leftImage) {
            entranceTimeline.to(
              leftImage,
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.75,
                ease: "power3.out",
              },
              "<+=0.22",
            );
          }

          /*
           * The right image only starts once the left
           * image's reveal has finished, rather than
           * overlapping with it.
           */
          if (rightImage) {
            entranceTimeline.to(rightImage, {
              autoAlpha: 1,
              y: 0,
              duration: 0.75,
              ease: "power3.out",
            });
          }

          return () => {
            entranceTimeline.kill();
          };
        },
      );

      let resizeTimer;

      const handleResize = () => {
        window.clearTimeout(resizeTimer);

        resizeTimer = window.setTimeout(() => {
          animationRef.current?.kill();
          animationRef.current = null;

          dragStateRef.current.isDragging = false;

          setIsDragging(false);
          setIsAnimating(false);

          positionCards({
            nextActiveIndex: activeIndexRef.current,
            immediate: true,
          });
        }, 100);
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.clearTimeout(resizeTimer);
        window.removeEventListener("resize", handleResize);

        animationRef.current?.kill();
        animationRef.current = null;

        matchMedia.revert();
      };
    },
    {
      scope: sectionRef,
    },
  );

  return (
    <section
      ref={sectionRef}
      id="gallery"
      className={styles.gallery}
      aria-labelledby="gallery-title"
      onKeyDown={handleKeyDown}
    >
      <header ref={headingRef} className={styles.headingGroup}>
        <h2 id="gallery-title" className={styles.heading}>
          {heading}
        </h2>

        <p className={styles.text}>{text}</p>
      </header>

      <div
        ref={carouselRef}
        className={styles.carousel}
        data-dragging={isDragging ? "true" : "false"}
        role="region"
        aria-roledescription="carousel"
        aria-label="Movenpick lifestyle gallery. Drag horizontally to change image."
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerDrag}
        onPointerCancel={handlePointerCancel}
      >
        {galleryItems.map((item, index) => {
          const initialPosition =
            index === 0
              ? "centre"
              : index === 1
                ? "right"
                : index === galleryItems.length - 1
                  ? "left"
                  : "hidden";

          const isCurrentSlide = index === activeIndex;

          return (
            <article
              key={item.image}
              ref={(element) => {
                cardRefs.current[index] = element;
              }}
              className={styles.card}
              data-position={initialPosition}
              data-card-index={index}
              aria-hidden={
                initialPosition === "hidden" && !isCurrentSlide
                  ? "true"
                  : undefined
              }
            >
              <button
                type="button"
                className={styles.cardButton}
                disabled={isAnimating || isCurrentSlide}
                aria-label={
                  isCurrentSlide
                    ? `${item.title}, current image`
                    : `Show ${item.title}`
                }
                onClick={(event) => handleCardClick(event, index)}
              >
                <span
                  ref={(element) => {
                    imageWrapperRefs.current[index] = element;
                  }}
                  className={styles.imageWrapper}
                >
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    quality={90}
                    draggable={false}
                    sizes="
                      (max-width: 480px) 70.2vw,
                      (max-width: 767px) 66.6vw,
                      (max-width: 1024px) 58vw,
                      (max-width: 1350px) 50vw,
                      900px
                    "
                    className={styles.image}
                  />
                </span>
              </button>

              <div
                ref={(element) => {
                  contentRefs.current[index] = element;
                }}
                className={styles.cardContent}
              >
                <h3 className={styles.cardTitle}>{item.title}</h3>

                <p className={styles.cardDescription}>{item.description}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div
        ref={cursorRef}
        className={styles.customCursor}
        data-visible={cursorVisible ? "true" : "false"}
        aria-hidden="true"
      >
        <Image src="/images/drag-icon.svg" alt="" width={200} height={200} />
      </div>

      <div className={styles.pagination} aria-label="Gallery pagination">
        {galleryItems.map((item, index) => (
          <button
            key={item.image}
            type="button"
            className={styles.paginationButton}
            data-active={index === activeIndex ? "true" : "false"}
            aria-label={`Show ${item.title}`}
            aria-current={index === activeIndex ? "true" : undefined}
            disabled={isAnimating}
            onClick={() => selectSlide(index)}
          />
        ))}
      </div>
    </section>
  );
}

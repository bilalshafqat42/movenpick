"use client";

import { parseLngLat } from "@/lib/coordinates";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { gsap, useGSAP } from "@/lib/gsap";
import styles from "./MapSection.module.css";

const MAPBOX_STYLE_URL =
  "mapbox://styles/refinedubai/cmrj946d7001k01r45t5vgnju";

/*
 * Mapbox coordinates always follow:
 * [longitude, latitude]
 *
 * Confirm the final approved project coordinate
 * before the website is published.
 */
const projectLocation = {
  id: "project",
  name: "Movenpick",
  time: "Project Location",
  coordinates: [55.3076, 25.2908],
  zoom: 13.8,
  isProject: true,
  popupAnchor: "bottom",
  popupOffset: [0, -62],
};

const DEFAULT_DESTINATIONS = [
  {
    id: "airport",
    name: "Dubai International Airport (DXB)",
    time: "15 Min",
    coordinates: [55.3644, 25.2532],
    zoom: 12.4,
    popupAnchor: "bottom-left",
    popupOffset: [14, -13],
  },
  {
    id: "downtown",
    name: "Downtown Dubai, Burj Khalifa",
    time: "20 Min",
    coordinates: [55.2744, 25.1972],
    zoom: 12.4,
    popupAnchor: "bottom-right",
    popupOffset: [-14, -13],
  },
  {
    id: "creek-golf",
    name: "Dubai Creek Golf Club",
    time: "20 Min",
    coordinates: [55.3337, 25.2425],
    zoom: 13,
    popupAnchor: "top-left",
    popupOffset: [14, 13],
  },
  {
    id: "marina",
    name: "Dubai Marina",
    time: "30 Min",
    coordinates: [55.139, 25.0805],
    zoom: 12.2,
    popupAnchor: "bottom-right",
    popupOffset: [-14, -13],
  },
];

/*
 * Creates one geographic boundary containing the project and every
 * listed destination. Takes the locations to fit as an argument, since
 * a destination's coordinates can now be edited from the panel — the
 * fit-to-view has to follow wherever the pin actually is, not a fixed
 * set of coordinates decided once at module load.
 */
function createAllLocationsBounds(locations) {
  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((location) => {
    bounds.extend(location.coordinates);
  });

  return bounds;
}

/*
 * Google Maps uses the visitor's current location
 * automatically when the origin is omitted.
 */
function createGoogleMapsUrl() {
  const [longitude, latitude] = projectLocation.coordinates;

  const parameters = new URLSearchParams({
    api: "1",
    destination: `${latitude},${longitude}`,
    travelmode: "driving",
    dir_action: "navigate",
  });

  return `https://www.google.com/maps/dir/?${parameters.toString()}`;
}

export default function MapSection({ eyebrow, heading, introText, destinations }) {
  /*
   * Coordinates, zoom, popup positioning and marker styling stay
   * hardcoded here — they are map geometry, not content. Only the
   * display name and travel time come from the CMS, merged onto the
   * static geography by index (the panel's item order matches this
   * array's order exactly; see src/content/sections/location.js).
   */
  const mergedDestinations = DEFAULT_DESTINATIONS.map((destination, index) => {
    const item = destinations[index];
    // Google Maps' own right-click menu copies coordinates as
    // "25.1972, 55.2744" — pasting the first half into Latitude
    // naturally carries the trailing comma along with it, which would
    // otherwise make an entirely valid coordinate fail to parse.
    const panelCoordinates = parseLngLat(item.latitude, item.longitude);

    return {
      ...destination,
      name: item.destination,
      time: item.time,
      // Falls back to the built-in coordinates if the panel's lat/lng
      // is missing or not a real number, so a blank or mistyped field
      // moves the pin's label but never breaks the map.
      coordinates: panelCoordinates ?? destination.coordinates,
    };
  });

  const mergedAllLocations = [projectLocation, ...mergedDestinations];

  const sectionRef = useRef(null);
  const sectionInnerRef = useRef(null);

  const sectionHeaderRef = useRef(null);
  const eyebrowRef = useRef(null);
  const headingRef = useRef(null);
  const descriptionRef = useRef(null);

  const mapStageRef = useRef(null);
  const overlayBackgroundRef = useRef(null);
  const travelListRef = useRef(null);
  const resetRef = useRef(null);
  const directionsRef = useRef(null);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const mapItemsRef = useRef([]);

  const resizeTimerRef = useRef(null);
  const mapFailureTimerRef = useRef(null);

  const [activeLocationId, setActiveLocationId] = useState(projectLocation.id);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState("");

  /*
   * Complete-section entrance and exit.
   *
   * The entrance is intentionally subtle so it does not
   * compete with the heading and destination animations.
   *
   * The exit begins late, allowing visitors enough time
   * to read and interact with the map.
   */
  useGSAP(
    () => {
      const section = sectionRef.current;
      const sectionInner = sectionInnerRef.current;

      if (!section || !sectionInner) {
        return undefined;
      }

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
            gsap.set(sectionInner, {
              autoAlpha: 1,
              y: 0,
              clearProps: "transform",
            });

            return undefined;
          }

          /*
           * Single continuous scrub instead of two separate tweens.
           *
           * The previous version used a one-shot "entrance" tween
           * (toggled by scroll direction) and a separate scrubbed
           * "exit" tween, both controlling the same autoAlpha/y
           * properties on sectionInner. Two independent tweens
           * fighting over the same properties on the same target is
           * what caused the whole section to snap to invisible when
           * scrolling back up, even after removing "reverse" from
           * the entrance's toggleActions.
           *
           * This timeline is scrubbed across the section's entire
           * visible range: "top bottom" (the moment any part of the
           * section first appears at the bottom of the viewport) to
           * "bottom top" (the moment none of it is left on screen).
           * Only one thing ever controls these properties now, and
           * scrub-based animation is inherently and smoothly
           * reversible in both scroll directions, no toggleActions
           * or manual reverse logic needed at all.
           */
          const sectionTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: mobile ? 0.5 : 0.65,
              invalidateOnRefresh: true,
            },
          });

          sectionTimeline
            .fromTo(
              sectionInner,
              {
                autoAlpha: 0,
                y: mobile ? 12 : 20,
              },
              {
                autoAlpha: 1,
                y: 0,
                ease: "power2.out",
                duration: 0.15,
              },
              0,
            )
            .to(
              sectionInner,
              {
                autoAlpha: 0,
                y: mobile ? -18 : -28,
                ease: "power2.in",
                duration: 0.15,
              },
              0.85,
            );

          return () => {
            sectionTimeline.kill();
          };
        },
      );

      return () => {
        matchMedia.revert();
      };
    },
    {
      scope: sectionRef,
    },
  );

  /*
   * Heading, overlay and destination animations.
   */
  useGSAP(
    () => {
      const sectionHeader = sectionHeaderRef.current;
      const eyebrow = eyebrowRef.current;
      const heading = headingRef.current;
      const description = descriptionRef.current;

      const mapStage = mapStageRef.current;
      const overlayBackground = overlayBackgroundRef.current;
      const travelList = travelListRef.current;
      const resetButton = resetRef.current;
      const directionsLink = directionsRef.current;

      if (
        !sectionHeader ||
        !eyebrow ||
        !heading ||
        !description ||
        !mapStage ||
        !overlayBackground ||
        !travelList ||
        !resetButton ||
        !directionsLink
      ) {
        return undefined;
      }

      const travelItems = Array.from(
        travelList.querySelectorAll(`.${styles.travelItem}`),
      );

      if (travelItems.length === 0) {
        return undefined;
      }

      const matchMedia = gsap.matchMedia();

      /*
       * =====================================================
       * Desktop animations
       * =====================================================
       */
      matchMedia.add(
        {
          desktop: "(min-width: 768px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { desktop = false, reduceMotion = false } =
            context.conditions ?? {};

          if (!desktop) {
            return undefined;
          }

          if (reduceMotion) {
            gsap.set([eyebrow, heading, description], {
              autoAlpha: 1,
              y: 0,
              clearProps: "transform",
            });

            gsap.set(overlayBackground, {
              clipPath: "inset(0% 0% 0% 0%)",
            });

            gsap.set([...travelItems, resetButton, directionsLink], {
              autoAlpha: 1,
              y: 0,
              clearProps: "transform",
            });

            return undefined;
          }

          /*
           * Heading starting positions.
           */
          gsap.set(eyebrow, {
            autoAlpha: 0,
            y: 24,
          });

          gsap.set(heading, {
            autoAlpha: 0,
            y: 34,
          });

          gsap.set(description, {
            autoAlpha: 0,
            y: 28,
          });

          /*
           * Heading sequence:
           * eyebrow → heading → description.
           *
           * Last toggleAction is "none", not "reverse": this section
           * fades out as a whole via the dedicated exit scrub in the
           * effect above, so the heading shouldn't independently
           * re-hide itself on upward scroll too.
           */
          const headingTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: sectionHeader,
              start: "top 80%",
              toggleActions: "play none none none",
              invalidateOnRefresh: true,
            },
          });

          headingTimeline
            .to(eyebrow, {
              autoAlpha: 1,
              y: 0,
              duration: 0.68,
              ease: "power3.out",
            })
            .to(
              heading,
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.8,
                ease: "power3.out",
              },
              "-=0.42",
            )
            .to(
              description,
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.78,
                ease: "power3.out",
              },
              "-=0.36",
            );

          /*
           * Desktop beige overlay reveals from left to right.
           */
          gsap.set(overlayBackground, {
            clipPath: "inset(0% 100% 0% 0%)",
          });

          gsap.set(travelItems, {
            autoAlpha: 0,
            y: 42,
          });

          gsap.set(resetButton, {
            autoAlpha: 0,
            y: 22,
          });

          gsap.set(directionsLink, {
            autoAlpha: 0,
            y: 26,
          });

          const overlayTween = gsap.to(overlayBackground, {
            clipPath: "inset(0% 0% 0% 0%)",
            ease: "none",

            scrollTrigger: {
              trigger: mapStage,
              start: "top 84%",
              end: "top 36%",
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          });

          /*
           * Destination items appear individually.
           *
           * A 0.2-second stagger gives each destination
           * separation without making the sequence feel slow.
           *
           * Last toggleAction is "none", not "reverse", for the
           * same reason as above.
           */
          const destinationStagger = 0.2;

          const itemsTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: mapStage,
              start: "top 56%",
              toggleActions: "play none none none",
              invalidateOnRefresh: true,
            },
          });

          travelItems.forEach((item, index) => {
            itemsTimeline.to(
              item,
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.8,
                ease: "power3.out",
              },
              index * destinationStagger,
            );
          });

          /*
           * Reset View belongs to the destination group and
           * appears directly after the final destination item.
           */
          itemsTimeline.to(
            resetButton,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.66,
              ease: "power3.out",
            },
            travelItems.length * destinationStagger + 0.08,
          );

          /*
           * See Directions remains a separate secondary action
           * lower in the overlay, preserving the approved layout.
           */
          itemsTimeline.to(
            directionsLink,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.7,
              ease: "power3.out",
            },
            travelItems.length * destinationStagger + 0.18,
          );

          return () => {
            headingTimeline.kill();
            overlayTween.kill();
            itemsTimeline.kill();
          };
        },
      );

      /*
       * =====================================================
       * Mobile animations
       * =====================================================
       */
      matchMedia.add(
        {
          mobile: "(max-width: 767px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { mobile = false, reduceMotion = false } =
            context.conditions ?? {};

          if (!mobile) {
            return undefined;
          }

          if (reduceMotion) {
            gsap.set([eyebrow, heading, description], {
              autoAlpha: 1,
              y: 0,
              clearProps: "transform",
            });

            gsap.set(overlayBackground, {
              clipPath: "inset(0% 0% 0% 0%)",
            });

            gsap.set([...travelItems, resetButton, directionsLink], {
              autoAlpha: 1,
              y: 0,
              clearProps: "transform",
            });

            return undefined;
          }

          /*
           * Mobile section heading remains immediately visible.
           */
          gsap.set([eyebrow, heading, description], {
            autoAlpha: 1,
            y: 0,
          });

          /*
           * Mobile beige overlay rolls from top to bottom.
           */
          gsap.set(overlayBackground, {
            clipPath: "inset(0% 0% 100% 0%)",
          });

          gsap.set(travelItems, {
            autoAlpha: 0,
            y: 24,
          });

          gsap.set(resetButton, {
            autoAlpha: 0,
            y: 16,
          });

          gsap.set(directionsLink, {
            autoAlpha: 0,
            y: 18,
          });

          const mobileOverlayTween = gsap.to(overlayBackground, {
            clipPath: "inset(0% 0% 0% 0%)",
            ease: "none",

            scrollTrigger: {
              trigger: mapStage,
              start: "top 88%",
              end: "top 56%",
              scrub: 0.65,
              invalidateOnRefresh: true,
            },
          });

          /*
           * Mobile 2×2 cards fade upward one by one.
           *
           * Last toggleAction is "none", not "reverse", so cards
           * don't re-hide on upward scroll, same reasoning as the
           * desktop timelines above.
           */
          const mobileItemsTween = gsap.to(travelItems, {
            autoAlpha: 1,
            y: 0,
            duration: 0.64,
            stagger: 0.14,
            ease: "power3.out",

            scrollTrigger: {
              trigger: mapStage,
              start: "top 68%",
              toggleActions: "play none none none",
              invalidateOnRefresh: true,
            },
          });

          const mobileResetTween = gsap.to(resetButton, {
            autoAlpha: 1,
            y: 0,
            duration: 0.58,
            ease: "power3.out",

            scrollTrigger: {
              trigger: mapStage,
              start: "top 60%",
              toggleActions: "play none none none",
              invalidateOnRefresh: true,
            },
          });

          const mobileDirectionsTween = gsap.to(directionsLink, {
            autoAlpha: 1,
            y: 0,
            duration: 0.62,
            ease: "power3.out",

            scrollTrigger: {
              trigger: mapStage,
              start: "top 57%",
              toggleActions: "play none none none",
              invalidateOnRefresh: true,
            },
          });

          return () => {
            mobileOverlayTween.kill();
            mobileItemsTween.kill();
            mobileResetTween.kill();
            mobileDirectionsTween.kill();
          };
        },
      );

      return () => {
        matchMedia.revert();
      };
    },
    {
      scope: sectionRef,
    },
  );

  /*
   * Mapbox initialisation.
   */
  /*
   * setState inside this effect is deliberate and unavoidable. Mapbox has to
   * be initialised against a real DOM node, which only exists after mount, and
   * its success or failure is what these states report. There is no render-time
   * equivalent: this component is server-rendered for the initial HTML, so
   * touching the map or window during render would break the build.
   */
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- see the note above this effect */
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
      setMapLoaded(false);

      setMapError(
        "Mapbox token is missing. Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local and restart the development server.",
      );

      return undefined;
    }

    if (!mapContainerRef.current || mapRef.current) {
      return undefined;
    }

    setMapLoaded(false);
    setMapError("");

    let mapDidLoad = false;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      accessToken,
      style: MAPBOX_STYLE_URL,

      center: projectLocation.coordinates,
      zoom: 9.7,

      pitch: 0,
      bearing: 0,

      attributionControl: false,

      cooperativeGestures: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });

    mapRef.current = map;

    /*
     * Prevent page scrolling over the map from zooming it.
     */
    map.scrollZoom.disable();
    map.boxZoom.disable();
    map.doubleClickZoom.disable();
    map.keyboard.disable();

    /*
     * Touch zoom remains available, but rotation is disabled.
     */
    map.touchZoomRotate.disableRotation();

    /*
     * Keep required Mapbox attribution visible.
     */
    map.addControl(
      new mapboxgl.AttributionControl({
        compact: false,
      }),
      "bottom-right",
    );

    /*
     * Create markers and permanent labels.
     */
    mergedAllLocations.forEach((location) => {
      const markerButton = document.createElement("button");

      markerButton.type = "button";

      markerButton.className = location.isProject
        ? styles.projectMarker
        : styles.locationMarker;

      markerButton.setAttribute("aria-label", `Focus map on ${location.name}`);

      markerButton.dataset.locationId = location.id;

      markerButton.dataset.active =
        location.id === projectLocation.id ? "true" : "false";

      const markerInner = document.createElement("span");

      markerInner.className = location.isProject
        ? styles.projectMarkerInner
        : styles.locationMarkerInner;

      markerInner.setAttribute("aria-hidden", "true");

      markerButton.appendChild(markerInner);

      const focusLocation = () => {
        setActiveLocationId(location.id);

        map.flyTo({
          center: location.coordinates,
          zoom: location.zoom,
          duration: 1200,
          essential: true,
        });
      };

      markerButton.addEventListener("click", focusLocation);

      const labelContent = document.createElement("div");

      labelContent.className = location.isProject
        ? `${styles.mapLabelContent} ${styles.projectLabelContent}`
        : styles.mapLabelContent;

      const labelName = document.createElement("strong");

      /*
       * Just `.name`, not a separate "short" version: that made sense
       * for four fixed, hand-picked labels, but the panel only offers
       * one name per destination, and inventing a shortened variant of
       * whatever an editor types is not something to guess at here.
       */
      labelName.textContent = location.name;

      const labelTime = document.createElement("span");

      labelTime.textContent = location.time;

      labelContent.appendChild(labelName);
      labelContent.appendChild(labelTime);

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        closeOnMove: false,
        focusAfterOpen: false,

        anchor: location.popupAnchor,
        offset: location.popupOffset,

        className: location.isProject
          ? `${styles.mapLabel} ${styles.projectMapLabel}`
          : styles.mapLabel,
      })
        .setLngLat(location.coordinates)
        .setDOMContent(labelContent)
        .addTo(map);

      const marker = new mapboxgl.Marker({
        element: markerButton,
        anchor: location.isProject ? "bottom" : "center",
      })
        .setLngLat(location.coordinates)
        .addTo(map);

      mapItemsRef.current.push({
        id: location.id,
        element: markerButton,
        marker,
        popup,
        focusLocation,
      });
    });

    /*
     * Fit all markers into the available map area.
     */
    const showAllLocations = ({ duration = 0 } = {}) => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;

      const isTablet = window.matchMedia("(max-width: 1100px)").matches;

      let padding;

      if (isMobile) {
        /*
         * The mobile destination cards overlay the map.
         * Extra top padding keeps important markers visible.
         */
        const overlaySpace = Math.min(
          Math.round(window.innerHeight * 0.38),
          350,
        );

        padding = {
          top: overlaySpace,
          right: 34,
          bottom: 54,
          left: 34,
        };
      } else if (isTablet) {
        padding = {
          top: 100,
          right: 90,
          bottom: 100,
          left: 390,
        };
      } else {
        padding = {
          top: 115,
          right: 120,
          bottom: 115,
          left: 530,
        };
      }

      map.fitBounds(createAllLocationsBounds(mergedAllLocations), {
        padding,
        maxZoom: isMobile ? 9.15 : 10,
        duration,
        essential: true,
        retainPadding: false,
      });
    };

    const handleMapLoad = () => {
      mapDidLoad = true;

      window.clearTimeout(mapFailureTimerRef.current);

      map.resize();

      window.requestAnimationFrame(() => {
        showAllLocations({
          duration: 0,
        });
      });

      setMapLoaded(true);
      setMapError("");
    };

    const handleResize = () => {
      window.clearTimeout(resizeTimerRef.current);

      resizeTimerRef.current = window.setTimeout(() => {
        if (!mapRef.current) {
          return;
        }

        map.resize();

        showAllLocations({
          duration: 0,
        });
      }, 180);
    };

    /*
     * General Mapbox errors are logged but do not
     * immediately cover a working or loading map.
     */
    const handleMapError = (event) => {
      console.error("Mapbox error:", event.error);
    };

    /*
     * Show a fatal message only if the map has not
     * successfully loaded after a reasonable period.
     */
    mapFailureTimerRef.current = window.setTimeout(() => {
      if (!mapDidLoad) {
        setMapLoaded(false);

        setMapError(
          "The map could not be loaded. Check the Mapbox access token and published custom style.",
        );
      }
    }, 12000);

    map.on("load", handleMapLoad);
    map.on("error", handleMapError);

    window.addEventListener("resize", handleResize);

    return () => {
      window.clearTimeout(resizeTimerRef.current);
      window.clearTimeout(mapFailureTimerRef.current);

      window.removeEventListener("resize", handleResize);

      map.off("load", handleMapLoad);
      map.off("error", handleMapError);

      mapItemsRef.current.forEach(
        ({ marker, popup, element, focusLocation }) => {
          element.removeEventListener("click", focusLocation);

          popup.remove();
          marker.remove();
        },
      );

      mapItemsRef.current = [];

      map.remove();
      mapRef.current = null;
    };
    /* eslint-enable react-hooks/set-state-in-effect */
    /*
     * Empty dependency array on purpose. mergedAllLocations is derived inline
     * in the component body, so it is a new array on every render; listing it
     * would tear down and rebuild the whole map each time, throwing away the
     * visitor's pan and zoom. Content changes arrive via a fresh page load,
     * which remounts this component with the new geography anyway.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Synchronise active map markers with the cards.
   */
  useEffect(() => {
    mapItemsRef.current.forEach(({ id, element }) => {
      element.dataset.active = id === activeLocationId ? "true" : "false";
    });
  }, [activeLocationId]);

  const handleDestinationClick = (destination) => {
    setActiveLocationId(destination.id);

    const map = mapRef.current;

    if (!map) {
      return;
    }

    map.flyTo({
      center: destination.coordinates,
      zoom: destination.zoom,
      duration: 1200,
      essential: true,
    });
  };
  const handleResetView = () => {
    const map = mapRef.current;

    if (!map) return;

    setActiveLocationId(projectLocation.id);

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const isTablet = window.matchMedia("(max-width: 1100px)").matches;

    let padding;

    if (isMobile) {
      const overlaySpace = Math.min(Math.round(window.innerHeight * 0.38), 350);

      padding = {
        top: overlaySpace,
        right: 34,
        bottom: 54,
        left: 34,
      };
    } else if (isTablet) {
      padding = {
        top: 100,
        right: 90,
        bottom: 100,
        left: 390,
      };
    } else {
      padding = {
        top: 115,
        right: 120,
        bottom: 115,
        left: 530,
      };
    }

    map.fitBounds(createAllLocationsBounds(mergedAllLocations), {
      padding,
      maxZoom: isMobile ? 9.15 : 10,
      duration: 1200,
      essential: true,
      retainPadding: false,
    });
  };
  return (
    <section
      ref={sectionRef}
      id="location-map"
      className={styles.mapSection}
      aria-labelledby="location-map-title"
    >
      <div ref={sectionInnerRef} className={styles.sectionInner}>
        <header ref={sectionHeaderRef} className={styles.sectionHeader}>
          <p ref={eyebrowRef} className={styles.eyebrow}>
            {eyebrow}
          </p>

          <h2
            ref={headingRef}
            id="location-map-title"
            className={styles.heading}
          >
            {heading}
          </h2>

          <p ref={descriptionRef} className={styles.description}>
            {introText}
          </p>
        </header>

        <div ref={mapStageRef} className={styles.mapStage}>
          <div
            ref={mapContainerRef}
            className={styles.map}
            role="application"
            aria-label="Interactive map showing Movenpick and nearby Dubai destinations"
          />

          {!mapLoaded && !mapError ? (
            <div
              className={styles.mapLoading}
              aria-live="polite"
              aria-label="Loading interactive map"
            >
              <span>Loading Map</span>
            </div>
          ) : null}

          <div
            className={styles.travelOverlay}
            aria-label="Travel times from Movenpick"
          >
            <div
              ref={overlayBackgroundRef}
              className={styles.overlayBackground}
              aria-hidden="true"
            />

            <div className={styles.travelContent}>
              <ul ref={travelListRef} className={styles.travelList}>
                {mergedDestinations.map((destination) => {
                  const isActive = activeLocationId === destination.id;

                  return (
                    <li key={destination.id} className={styles.travelListItem}>
                      <button
                        type="button"
                        className={styles.travelItem}
                        data-active={isActive ? "true" : "false"}
                        aria-pressed={isActive}
                        onClick={() => handleDestinationClick(destination)}
                      >
                        <span className={styles.travelTime}>
                          {destination.time}
                        </span>

                        <span className={styles.travelName}>
                          {destination.name}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <button
                ref={resetRef}
                type="button"
                onClick={handleResetView}
                className={styles.resetButton}
                aria-label="Reset map to show all locations"
              >
                <span>Reset View</span>{" "}
                <span className={styles.linkIcon} aria-hidden="true">
                  ↻
                </span>
              </button>

              <a
                ref={directionsRef}
                href={createGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.directionsLink}
              >
                <span>See Directions</span>
                <span className={styles.linkIcon} aria-hidden="true">
                  →
                </span>
              </a>
            </div>
          </div>

          {mapError ? (
            <div className={styles.mapError} role="alert">
              <p>{mapError}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/*
 * The four "minutes away" destinations shown on the interactive map
 * (src/components/MapSection). Latitude/longitude here are the pin's
 * real position on the map, not just a label — renaming a destination
 * without updating its coordinates leaves the pin pointing at the old
 * place, so both are edited together as one destination.
 */
const LOCATION_ITEMS = [
  {
    time: "15 Min",
    destination: "Dubai International Airport (DXB)",
    latitude: "25.2532",
    longitude: "55.3644",
  },
  {
    time: "20 Min",
    destination: "Downtown Dubai, Burj Khalifa",
    latitude: "25.1972",
    longitude: "55.2744",
  },
  {
    time: "20 Min",
    destination: "Dubai Creek Golf Club",
    latitude: "25.2425",
    longitude: "55.3337",
  },
  {
    time: "30 Min",
    destination: "Dubai Marina",
    latitude: "25.0805",
    longitude: "55.139",
  },
];

export const LOCATION_ITEM_COUNT = LOCATION_ITEMS.length;

function itemFieldKey(itemNumber, fieldName) {
  return `item-${itemNumber}-${fieldName}`;
}

export const LOCATION_FIELDS = [
  {
    key: "eyebrow",
    label: "Eyebrow",
    type: "TEXT",
    defaultValue: "Connected To The",
  },
  {
    key: "heading",
    label: "Heading",
    type: "TEXT",
    defaultValue: "City, Grounded By Nature",
  },
  {
    key: "intro-text",
    label: "Intro text",
    type: "TEXT",
    long: true,
    defaultValue:
      "Enjoy the tranquillity of island living while remaining effortlessly connected to Dubai's most important destinations, business districts, lifestyle hubs and leisure experiences.",
  },
  // map-image/map-image-alt deliberately removed, 18 August 2026: this
  // section rendered as a static image until the site replaced it with
  // the interactive Mapbox map now on the page (src/components/MapSection).
  // A static image field has no live consumer to wire it to any more — an
  // interactive map is not something a single image can represent — so
  // keeping the field would only recreate the exact "editable but does
  // nothing" problem this whole section was found to have.

  ...LOCATION_ITEMS.flatMap((item, index) => {
    const itemNumber = index + 1;

    return [
      {
        key: itemFieldKey(itemNumber, "time"),
        label: `Item ${itemNumber} — Time`,
        type: "TEXT",
        defaultValue: item.time,
      },
      {
        key: itemFieldKey(itemNumber, "destination"),
        label: `Item ${itemNumber} — Destination`,
        type: "TEXT",
        defaultValue: item.destination,
      },
      {
        key: itemFieldKey(itemNumber, "latitude"),
        label: `Item ${itemNumber} — Latitude`,
        type: "TEXT",
        helperText:
          "The pin's real position on the map. Changing the destination without updating this leaves the pin pointing at the old place. Find coordinates by right-clicking the location in Google Maps and copying the first number.",
        defaultValue: item.latitude,
      },
      {
        key: itemFieldKey(itemNumber, "longitude"),
        label: `Item ${itemNumber} — Longitude`,
        type: "TEXT",
        helperText: "The second number from the same Google Maps right-click.",
        defaultValue: item.longitude,
      },
    ];
  }),
];

export function shapeLocationContent(content) {
  const items = Array.from({ length: LOCATION_ITEM_COUNT }, (_, index) => {
    const itemNumber = index + 1;

    return {
      time: content[itemFieldKey(itemNumber, "time")],
      destination: content[itemFieldKey(itemNumber, "destination")],
      latitude: content[itemFieldKey(itemNumber, "latitude")],
      longitude: content[itemFieldKey(itemNumber, "longitude")],
    };
  });

  return {
    eyebrow: content.eyebrow,
    heading: content.heading,
    introText: content["intro-text"],
    items,
  };
}

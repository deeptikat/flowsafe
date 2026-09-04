import axios from "axios";

export type EmergencyPlace = {
  id: string;
  name: string;
  type: "hospital" | "police" | "fire" | "shelter";
  latitude: number;
  longitude: number;
  distance: number;
};

export async function getEmergencyPlaces(
  latitude: number,
  longitude: number
): Promise<EmergencyPlace[]> {
  try {
    /*
     * OpenStreetMap Overpass API
     *
     * We search for emergency facilities
     * within approximately 15 km.
     */

    const radius = 15000;

    const query = `
      [out:json][timeout:25];

      (
        node["amenity"="hospital"]
          (around:${radius},${latitude},${longitude});

        way["amenity"="hospital"]
          (around:${radius},${latitude},${longitude});

        node["amenity"="police"]
          (around:${radius},${latitude},${longitude});

        way["amenity"="police"]
          (around:${radius},${latitude},${longitude});

        node["amenity"="fire_station"]
          (around:${radius},${latitude},${longitude});

        way["amenity"="fire_station"]
          (around:${radius},${latitude},${longitude});

        node["amenity"="shelter"]
          (around:${radius},${latitude},${longitude});

        way["amenity"="shelter"]
          (around:${radius},${latitude},${longitude});
      );

      out center tags;
    `;

    const response =
      await axios.post(
        "https://overpass-api.de/api/interpreter",
        query,
        {
          headers: {
            "Content-Type":
              "text/plain",
          },
          timeout: 30000,
        }
      );

    const elements =
      response.data?.elements || [];

    const places: EmergencyPlace[] =
      [];

    for (const element of elements) {
      const tags =
        element.tags || {};

      /*
       * Ways do not have their own latitude
       * and longitude, so use their center.
       */

      const placeLatitude =
        Number(
          element.lat ??
            element.center?.lat
        );

      const placeLongitude =
        Number(
          element.lon ??
            element.center?.lon
        );

      if (
        !Number.isFinite(
          placeLatitude
        ) ||
        !Number.isFinite(
          placeLongitude
        )
      ) {
        continue;
      }

      let type:
        | "hospital"
        | "police"
        | "fire"
        | "shelter"
        | null = null;

      if (
        tags.amenity ===
        "hospital"
      ) {
        type = "hospital";
      } else if (
        tags.amenity ===
        "police"
      ) {
        type = "police";
      } else if (
        tags.amenity ===
        "fire_station"
      ) {
        type = "fire";
      } else if (
        tags.amenity ===
        "shelter"
      ) {
        type = "shelter";
      }

      if (!type) {
        continue;
      }

      const distance =
        calculateDistance(
          latitude,
          longitude,
          placeLatitude,
          placeLongitude
        );

      places.push({
        id:
          String(
            element.id
          ),

        name:
          tags.name ||
          getDefaultName(type),

        type,

        latitude:
          placeLatitude,

        longitude:
          placeLongitude,

        distance,
      });
    }

    /*
     * Sort nearest facilities first.
     */

    places.sort(
      (a, b) =>
        a.distance -
        b.distance
    );

    return places;

  } catch (error) {

    console.error(
      "Emergency places API error:",
      error
    );

    return [];
  }
}


/*
 * Calculate distance between two
 * geographic coordinates.
 *
 * Returns kilometres.
 */

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {

  const earthRadius = 6371;

  const dLat =
    toRadians(
      lat2 - lat1
    );

  const dLon =
    toRadians(
      lon2 - lon1
    );

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      toRadians(lat1)
    ) *
      Math.cos(
        toRadians(lat2)
      ) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return (
    earthRadius * c
  );
}


function toRadians(
  degrees: number
): number {

  return (
    degrees *
    (Math.PI / 180)
  );

}


function getDefaultName(
  type:
    | "hospital"
    | "police"
    | "fire"
    | "shelter"
): string {

  switch (type) {

    case "hospital":
      return "Hospital";

    case "police":
      return "Police Station";

    case "fire":
      return "Fire Station";

    case "shelter":
      return "Emergency Shelter";

    default:
      return "Emergency Facility";
  }
}
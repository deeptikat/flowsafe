import axios from "axios";

export type DisasterAlert = {
  active: boolean;
  title: string;
  description: string;
};

export async function getDisasterAlert(
  country: string,
  latitude: number,
  longitude: number
): Promise<DisasterAlert> {
  try {
    /*
     * Open-Meteo does not provide disaster alerts.
     * For now, use the GDACS public feed.
     *
     * We check whether there is a nearby active
     * disaster event.
     */

    const response = await axios.get(
      "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH",
      {
        params: {
          eventlist: "EQ;TC;FL",
          fromdate: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0],
          todate: new Date()
            .toISOString()
            .split("T")[0],
          alertlevel: "Green;Orange;Red",
        },
        timeout: 10000,
      }
    );

    const events =
      response.data?.features || [];

    /*
     * Find a disaster reasonably close
     * to the selected location.
     */

    let nearestEvent: any = null;
    let nearestDistance = Infinity;

    for (const event of events) {
      const coordinates =
        event.geometry?.coordinates;

      if (
        !coordinates ||
        coordinates.length < 2
      ) {
        continue;
      }

      const eventLongitude =
        Number(coordinates[0]);

      const eventLatitude =
        Number(coordinates[1]);

      const distance =
        calculateDistance(
          latitude,
          longitude,
          eventLatitude,
          eventLongitude
        );

      /*
       * Consider events within roughly
       * 300 km of the selected location.
       */

      if (
        distance < 300 &&
        distance < nearestDistance
      ) {
        nearestDistance = distance;
        nearestEvent = event;
      }
    }

    if (!nearestEvent) {
      return {
        active: false,
        title: "No active disaster alert",
        description:
          `No major natural hazard was detected near ${country}.`,
      };
    }

    const properties =
      nearestEvent.properties || {};

    const eventName =
      properties.name ||
      properties.eventname ||
      properties.eventtype ||
      "Natural hazard";

    const alertLevel =
      properties.alertlevel ||
      properties.alertlevelname ||
      "Active";

    return {
      active: true,

      title:
        `${eventName} detected nearby`,

      description:
        `${alertLevel} alert approximately ${Math.round(
          nearestDistance
        )} km from the selected location.`,
    };

  } catch (error) {

    console.error(
      "Disaster API error:",
      error
    );

    /*
     * Do NOT crash the entire dashboard
     * if the disaster API is unavailable.
     */

    return {
      active: false,
      title: "Disaster feed unavailable",
      description:
        "The external disaster monitoring service could not be reached. Other environmental data is still being monitored.",
    };
  }
}


/*
 * Calculate distance between two
 * geographic coordinates.
 *
 * Returns distance in kilometres.
 */

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {

  const earthRadius = 6371;

  const dLat =
    toRadians(lat2 - lat1);

  const dLon =
    toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}


function toRadians(
  degrees: number
): number {

  return (
    degrees *
    (Math.PI / 180)
  );

}
import axios from "axios";

export type LocationData = {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};

export type WeatherData = {
  temperature: number;
  rainfall: number;
  rainProbability: number;
  humidity: number;
  windSpeed: number;
  hourlyRainfall: number[];
  hourlyRainProbability: number[];
  hourlyLabels: string[];
};

export async function searchLocation(
  query: string
): Promise<LocationData> {
  /*
   * Search for a city/location using
   * Open-Meteo's free geocoding API.
   */

  const response = await axios.get(
    "https://geocoding-api.open-meteo.com/v1/search",
    {
      params: {
        name: query,
        count: 1,
        language: "en",
        format: "json",
      },
    }
  );

  if (
    !response.data.results ||
    response.data.results.length === 0
  ) {
    throw new Error("Location not found");
  }

  const result =
    response.data.results[0];

  return {
    name: result.name,
    country: result.country || "",
    latitude: Number(result.latitude),
    longitude: Number(result.longitude),
  };
}


export async function getWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  /*
   * Get current weather and hourly
   * rainfall forecast.
   */

  const response = await axios.get(
    "https://api.open-meteo.com/v1/forecast",
    {
      params: {
        latitude,
        longitude,

        current:
          "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",

        hourly:
          "precipitation_probability,precipitation",

        forecast_days: 2,

        timezone: "auto",
      },
    }
  );

  const data = response.data;

  const current = data.current;
  const hourly = data.hourly;

  /*
   * Find the current hour inside the
   * Open-Meteo hourly data.
   *
   * This is safer than using
   * new Date().getHours() because
   * Open-Meteo may use the location's
   * local timezone.
   */

  let currentIndex = 0;

  if (
    current?.time &&
    hourly?.time
  ) {
    const exactIndex =
      hourly.time.indexOf(
        current.time
      );

    if (exactIndex !== -1) {
      currentIndex = exactIndex;
    } else {

      /*
       * If an exact match isn't found,
       * find the closest hourly timestamp.
       */

      const currentTime =
        new Date(
          current.time
        ).getTime();

      let closestDifference =
        Infinity;

      for (
        let i = 0;
        i < hourly.time.length;
        i++
      ) {

        const hourlyTime =
          new Date(
            hourly.time[i]
          ).getTime();

        const difference =
          Math.abs(
            hourlyTime -
              currentTime
          );

        if (
          difference <
          closestDifference
        ) {

          closestDifference =
            difference;

          currentIndex = i;

        }
      }
    }
  }


  /*
   * Get the next 12 hours.
   */

  const rainfall: number[] = [];
  const probability: number[] = [];
  const labels: string[] = [];

  for (
    let i = currentIndex;
    i < currentIndex + 12;
    i++
  ) {

    if (
      i >= hourly.time.length
    ) {
      break;
    }

    /*
     * Rainfall amount.
     */

    rainfall.push(
      Number(
        hourly.precipitation?.[i] ?? 0
      )
    );

    /*
     * Rain probability.
     */

    probability.push(
      Number(
        hourly
          .precipitation_probability?.[i] ??
          0
      )
    );

    /*
     * Hour label.
     *
     * Open-Meteo already gives us
     * the location's local timezone.
     */

    const timeString =
      hourly.time[i];

    let label = timeString;

    try {

      const date =
        new Date(
          timeString
        );

      label =
        date.toLocaleTimeString(
          [],
          {
            hour: "numeric",
            hour12: true,
          }
        );

    } catch {

      /*
       * Keep the original timestamp
       * if formatting fails.
       */

      label = timeString;

    }

    labels.push(label);
  }


  /*
   * Current rainfall.
   */

  const currentRainfall =
    Number(
      current?.precipitation ?? 0
    );


  /*
   * Current rain probability.
   *
   * We use the maximum probability
   * across the next 3 hours because
   * this is more useful for flood-risk
   * detection than only looking at
   * the current hour.
   */

  const currentProbability =
    probability.length > 0
      ? Math.max(
          ...probability.slice(0, 3)
        )
      : 0;


  /*
   * Return normalized weather data
   * for the rest of the application.
   */

  return {

    temperature:
      Math.round(
        Number(
          current?.temperature_2m ?? 0
        )
      ),

    rainfall:
      currentRainfall,

    rainProbability:
      currentProbability,

    humidity:
      Math.round(
        Number(
          current?.relative_humidity_2m ??
            0
        )
      ),

    windSpeed:
      Math.round(
        Number(
          current?.wind_speed_10m ??
            0
        )
      ),

    hourlyRainfall:
      rainfall,

    hourlyRainProbability:
      probability,

    hourlyLabels:
      labels,

  };
}

export async function searchLocationSuggestions(
  query: string
): Promise<LocationData[]> {
  const response = await axios.get(
    "https://geocoding-api.open-meteo.com/v1/search",
    {
      params: {
        name: query,
        count: 5,
        language: "en",
        format: "json",
      },
    }
  );

  return (response.data.results || []).map(
    (result: {
      name: string;
      country?: string;
      latitude: number;
      longitude: number;
      admin1?: string;
    }) => ({
      name: result.name,
      country: result.country || "",
      latitude: Number(result.latitude),
      longitude: Number(result.longitude),
      admin1: result.admin1,
    })
  );
}
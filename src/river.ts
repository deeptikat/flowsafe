import axios from "axios";

export type RiverData = {
  available: boolean;
  currentDischarge: number;
  averageDischarge: number;
  trend: "RISING" | "FALLING" | "STABLE";
};

export async function getRiverData(
  latitude: number,
  longitude: number
): Promise<RiverData> {
  try {
    /*
     * Open-Meteo Flood API
     *
     * The API provides river discharge data
     * for the selected coordinates.
     */

    const response = await axios.get(
      "https://flood-api.open-meteo.com/v1/flood",
      {
        params: {
          latitude,
          longitude,
          daily:
            "river_discharge,river_discharge_mean",
          forecast_days: 7,
          past_days: 7,
          timezone: "auto",
        },

        timeout: 10000,
      }
    );

    const data =
      response.data?.daily;

    if (
      !data ||
      !data.river_discharge ||
      data.river_discharge.length === 0
    ) {
      return {
        available: false,
        currentDischarge: 0,
        averageDischarge: 0,
        trend: "STABLE",
      };
    }

    const dischargeValues =
      data.river_discharge
        .map((value: unknown) =>
          Number(value)
        )
        .filter((value: number) =>
          Number.isFinite(value)
        );

    if (
      dischargeValues.length === 0
    ) {
      return {
        available: false,
        currentDischarge: 0,
        averageDischarge: 0,
        trend: "STABLE",
      };
    }

    /*
     * Latest available river discharge.
     */

    const currentDischarge =
      dischargeValues[
        dischargeValues.length - 1
      ];

    /*
     * Calculate the average discharge
     * from the available historical data.
     */

    const averageDischarge =
      dischargeValues.reduce(
        (
          total: number,
          value: number
        ) => total + value,
        0
      ) / dischargeValues.length;

    /*
     * Compare the latest value with the
     * previous available value to determine
     * whether the river is rising or falling.
     */

    let trend:
      | "RISING"
      | "FALLING"
      | "STABLE" = "STABLE";

    if (
      dischargeValues.length >= 2
    ) {
      const previous =
        dischargeValues[
          dischargeValues.length - 2
        ];

      const difference =
        currentDischarge - previous;

      /*
       * Ignore tiny changes to avoid showing
       * unnecessary fluctuations.
       */

      const threshold =
        Math.max(
          0.5,
          Math.abs(previous) * 0.05
        );

      if (
        difference > threshold
      ) {
        trend = "RISING";
      } else if (
        difference < -threshold
      ) {
        trend = "FALLING";
      }
    }

    return {
      available: true,
      currentDischarge:
        Number(
          currentDischarge.toFixed(2)
        ),
      averageDischarge:
        Number(
          averageDischarge.toFixed(2)
        ),
      trend,
    };

  } catch (error) {

    console.error(
      "River API error:",
      error
    );

    /*
     * If the river API fails, the rest of
     * the dashboard should continue working.
     */

    return {
      available: false,
      currentDischarge: 0,
      averageDischarge: 0,
      trend: "STABLE",
    };
  }
}
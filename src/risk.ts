export type RiskResult = {
  score: number;
  level: "LOW" | "MODERATE" | "HIGH" | "SEVERE";
  reason: string[];
};

export function calculateFloodRisk(
  rainfall: number,
  rainProbability: number,
  humidity: number,
  disasterActive: boolean,
  currentDischarge: number,
  averageDischarge: number,
  riverTrend: string
): RiskResult {

  let score = 0;
  const reasons: string[] = [];

  // -----------------------------
  // RAINFALL
  // -----------------------------

  if (rainfall >= 50) {
    score += 35;
    reasons.push(
      "Very heavy rainfall is being detected."
    );
  } else if (rainfall >= 25) {
    score += 25;
    reasons.push(
      "Heavy rainfall is increasing flood potential."
    );
  } else if (rainfall >= 10) {
    score += 15;
    reasons.push(
      "Moderate rainfall is contributing to flood risk."
    );
  } else if (rainfall > 0) {
    score += 5;
  }

  // -----------------------------
  // RAIN PROBABILITY
  // -----------------------------

  if (rainProbability >= 80) {
    score += 20;
    reasons.push(
      "Very high probability of continued rainfall."
    );
  } else if (rainProbability >= 60) {
    score += 12;
    reasons.push(
      "High probability of rainfall."
    );
  } else if (rainProbability >= 40) {
    score += 7;
  }

  // -----------------------------
  // HUMIDITY
  // -----------------------------

  if (humidity >= 90) {
    score += 10;
    reasons.push(
      "Extremely humid conditions are present."
    );
  } else if (humidity >= 80) {
    score += 6;
  }

  // -----------------------------
  // RIVER CONDITIONS
  // -----------------------------

  if (
    averageDischarge > 0 &&
    currentDischarge >
      averageDischarge * 1.5
  ) {
    score += 25;

    reasons.push(
      "River discharge is significantly above its normal level."
    );

  } else if (
    averageDischarge > 0 &&
    currentDischarge >
      averageDischarge * 1.2
  ) {
    score += 15;

    reasons.push(
      "River discharge is above its normal level."
    );
  }

  // -----------------------------
  // RIVER TREND
  // -----------------------------

  if (riverTrend === "RISING") {

    score += 15;

    reasons.push(
      "River discharge is currently rising."
    );
  }

  // -----------------------------
  // ACTIVE DISASTER ALERT
  // -----------------------------

  if (disasterActive) {

    /*
     * A verified disaster alert should
     * have significant influence on the
     * final risk score.
     */

    score += 40;

    reasons.push(
      "An active natural-hazard alert has been detected."
    );
  }

  // -----------------------------
  // EXTREME RAINFALL OVERRIDE
  // -----------------------------

  if (
    rainfall >= 50 &&
    rainProbability >= 70
  ) {

    score = Math.max(
      score,
      75
    );

    reasons.push(
      "Rainfall intensity and forecast indicate possible flash-flood conditions."
    );
  }

  // -----------------------------
  // ACTIVE DISASTER OVERRIDE
  // -----------------------------

  if (
    disasterActive &&
    (rainfall >= 25 ||
      riverTrend === "RISING")
  ) {

    score = Math.max(
      score,
      80
    );

    reasons.push(
      "Multiple indicators suggest elevated flash-flood danger."
    );
  }

  // Keep score between 0 and 100

  score = Math.min(
    100,
    Math.max(0, Math.round(score))
  );

  // -----------------------------
  // RISK LEVEL
  // -----------------------------

  let level:
    | "LOW"
    | "MODERATE"
    | "HIGH"
    | "SEVERE";

  if (score >= 75) {

    level = "SEVERE";

  } else if (score >= 50) {

    level = "HIGH";

  } else if (score >= 25) {

    level = "MODERATE";

  } else {

    level = "LOW";
  }

  // Make sure the UI always has
  // something useful to display.

  if (reasons.length === 0) {

    reasons.push(
      "Current environmental conditions remain within normal ranges."
    );
  }

  return {
    score,
    level,
    reason: reasons,
  };
}
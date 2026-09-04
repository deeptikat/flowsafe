export type AlertSeverity =
  | "INFO"
  | "WARNING"
  | "CRITICAL";

export type FloodAlert = {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  time: string;
};

export function generateFloodAlerts(
  rainfall: number,
  rainProbability: number,
  riverTrend: string,
  disasterActive: boolean,
  riskScore: number
): FloodAlert[] {
  const alerts: FloodAlert[] = [];

  if (disasterActive) {
    alerts.push({
      id: "disaster",
      severity: "CRITICAL",
      title: "Active hazard detected",
      message:
        "An active natural-hazard alert has been detected in the monitored area.",
      time: "Now",
    });
  }

  if (riskScore >= 75) {
    alerts.push({
      id: "severe-risk",
      severity: "CRITICAL",
      title: "Severe flood risk",
      message:
        "Multiple environmental indicators indicate a potentially dangerous flood situation.",
      time: "Now",
    });
  } else if (riskScore >= 50) {
    alerts.push({
      id: "high-risk",
      severity: "WARNING",
      title: "High flood risk",
      message:
        "Current environmental conditions indicate elevated flood potential.",
      time: "Now",
    });
  }

  if (rainfall >= 25) {
    alerts.push({
      id: "heavy-rain",
      severity: "WARNING",
      title: "Heavy rainfall detected",
      message:
        `${rainfall} mm of rainfall is contributing to increased flood potential.`,
      time: "Now",
    });
  }

  if (rainProbability >= 80) {
    alerts.push({
      id: "rain-forecast",
      severity: "WARNING",
      title: "High rainfall probability",
      message:
        `There is a ${rainProbability}% probability of continued rainfall.`,
      time: "Forecast",
    });
  }

  if (riverTrend === "RISING") {
    alerts.push({
      id: "river-rising",
      severity: "WARNING",
      title: "River discharge rising",
      message:
        "River discharge is currently increasing and should be monitored closely.",
      time: "Now",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "normal",
      severity: "INFO",
      title: "No active flood warnings",
      message:
        "Current environmental conditions remain within monitored thresholds.",
      time: "Now",
    });
  }

  return alerts;
}
import {
  Activity,
  AlertTriangle,
  Bell,
  Search,
  CloudRain,
  Droplets,
  Gauge,
  Home,
  Map,
  Menu,
  Navigation,
  Settings,
  Shield,
  Waves,
  X,
  Phone,
  Hospital,
  Flame,
  MapPin,
  Siren,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import type {
  ReactNode,
  KeyboardEvent,
} from "react";

import {
  getWeather,
  searchLocation,
} from "./weather";

import type {
  LocationData,
  WeatherData,
} from "./weather";

import {
  calculateFloodRisk,
} from "./risk";

import type {
  RiskResult,
} from "./risk";

import {
  getDisasterAlert,
} from "./disaster";

import type {
  DisasterAlert,
} from "./disaster";

import {
  getRiverData,
} from "./river";

import type {
  RiverData,
} from "./river";

import {
  getEmergencyPlaces,
} from "./places";

import type {
  EmergencyPlace,
} from "./places";

import MapView from "./mapView";


function App() {

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [emergencyOpen, setEmergencyOpen] =
    useState(false);

  const [settingsOpen, setSettingsOpen] =
    useState(false);

  const [weather, setWeather] =
    useState<WeatherData | null>(null);

  const [risk, setRisk] =
    useState<RiskResult | null>(null);

  const [disaster, setDisaster] =
    useState<DisasterAlert | null>(null);

  const [river, setRiver] =
    useState<RiverData | null>(null);

  const [places, setPlaces] =
    useState<EmergencyPlace[]>([]);

  const [placesLoading, setPlacesLoading] =
    useState(false);

  const [location, setLocation] =
    useState<LocationData>({
      name: "Thane",
      country: "India",
      latitude: 19.2183,
      longitude: 72.9781,
    });

  const [searchText, setSearchText] =
    useState("Thane");

  const [loading, setLoading] =
    useState(true);

  const [searching, setSearching] =
    useState(false);

  const [error, setError] =
    useState("");


  /*
   * SIDEBAR NAVIGATION
   */

  function scrollToSection(
    id: string
  ) {

    const element =
      document.getElementById(id);

    if (element) {

      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

    }

    setSidebarOpen(false);
  }


  async function loadData(
    latitude: number,
    longitude: number,
    country: string
  ) {

    try {

      setLoading(true);
      setError("");

      const [
        weatherData,
        disasterData,
        riverData,
      ] = await Promise.all([

        getWeather(
          latitude,
          longitude
        ),

        getDisasterAlert(
          country,
          latitude,
          longitude
        ),

        getRiverData(
          latitude,
          longitude
        ),

      ]);

      setWeather(weatherData);

      setDisaster(disasterData);

      setRiver(riverData);

      const riskResult =
        calculateFloodRisk(
          weatherData.rainfall,
          weatherData.rainProbability,
          weatherData.humidity,
          disasterData.active,
          riverData.currentDischarge,
          riverData.averageDischarge,
          riverData.trend
        );

      setRisk(riskResult);

    } catch (err) {

      console.error(err);

      setError(
        "Unable to load environmental data."
      );

    } finally {

      setLoading(false);

    }

  }


  async function loadPlaces(
    latitude: number,
    longitude: number
  ) {

    try {

      setPlacesLoading(true);

      const result =
        await getEmergencyPlaces(
          latitude,
          longitude
        );

      setPlaces(result);

    } catch (err) {

      console.error(err);

      setPlaces([]);

    } finally {

      setPlacesLoading(false);

    }

  }


  async function openEmergency() {

    setEmergencyOpen(true);

    await loadPlaces(
      location.latitude,
      location.longitude
    );

  }


  async function handleSearch() {

    if (!searchText.trim()) {
      return;
    }

    try {

      setSearching(true);
      setError("");

      const result =
        await searchLocation(
          searchText
        );

      setLocation(result);

      await loadData(
        result.latitude,
        result.longitude,
        result.country
      );

      if (emergencyOpen) {

        await loadPlaces(
          result.latitude,
          result.longitude
        );

      }

    } catch (err) {

      console.error(err);

      setError(
        "Location not found. Try another city."
      );

    } finally {

      setSearching(false);

    }

  }


  function handleSearchKeyDown(
    event: KeyboardEvent<HTMLInputElement>
  ) {

    if (event.key === "Enter") {
      handleSearch();
    }

  }


  function useMyLocation() {

    if (!navigator.geolocation) {

      setError(
        "Geolocation is not supported by your browser."
      );

      return;

    }

    navigator.geolocation.getCurrentPosition(

      async (position) => {

        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        try {

          setLoading(true);

          const result =
            await searchLocation(
              `${latitude},${longitude}`
            );

          setLocation(result);

          setSearchText(
            result.name
          );

          await loadData(
            latitude,
            longitude,
            result.country
          );

          if (emergencyOpen) {

            await loadPlaces(
              latitude,
              longitude
            );

          }

        } catch (err) {

          console.error(err);

          setError(
            "Could not determine your location."
          );

          setLoading(false);

        }

      },

      () => {

        setError(
          "Location permission was denied."
        );

      }

    );

  }


  useEffect(() => {

    loadData(
      location.latitude,
      location.longitude,
      location.country
    );

  }, []);


  const riskLevel =
    risk?.level || "LOW";


  const maxRainfall =
    weather?.hourlyRainfall &&
    weather.hourlyRainfall.length > 0
      ? Math.max(
          ...weather.hourlyRainfall,
          1
        )
      : 1;


  return (

    <div className="app">

      {/* SIDEBAR */}

      <aside
        className={`sidebar ${
          sidebarOpen ? "open" : ""
        }`}
      >

        <div className="logo">

          <div className="logo-icon">
            <Waves size={21} />
          </div>

          <div>

            <h1>
              FlowSafe
            </h1>

            <span>
              Flood Intelligence
            </span>

          </div>

          <button
            className="mobile-close"
            onClick={() =>
              setSidebarOpen(false)
            }
          >

            <X size={20} />

          </button>

        </div>


        <nav>

          <p className="nav-label">
            MONITOR
          </p>

          <NavItem
            icon={<Home size={18} />}
            text="Overview"
            active
            onClick={() =>
              scrollToSection("overview")
            }
          />

          <NavItem
            icon={<Map size={18} />}
            text="Live Map"
            onClick={() =>
              scrollToSection("map-section")
            }
          />

          <NavItem
            icon={<Gauge size={18} />}
            text="Flood Risk"
            onClick={() =>
              scrollToSection("risk-section")
            }
          />

          <NavItem
            icon={<CloudRain size={18} />}
            text="Weather"
            onClick={() =>
              scrollToSection("weather-section")
            }
          />

          <NavItem
            icon={<Waves size={18} />}
            text="River Monitor"
            onClick={() =>
              scrollToSection("river-section")
            }
          />


          <p className="nav-label">
            RESPONSE
          </p>

          <NavItem
            icon={<Bell size={18} />}
            text="Alerts"
            badge="3"
            onClick={() =>
              scrollToSection("alert-section")
            }
          />

          <NavItem
            icon={<Activity size={18} />}
            text="Reports"
            onClick={() =>
              scrollToSection("reports-section")
            }
          />

          <button
            className="nav-item"
            onClick={openEmergency}
          >

            <Shield size={18} />

            <span>
              Emergency
            </span>

          </button>


          <p className="nav-label">
            ANALYTICS
          </p>

          <NavItem
            icon={<Activity size={18} />}
            text="History"
            onClick={() =>
              scrollToSection("history-section")
            }
          />


          <p className="nav-label">
            SYSTEM
          </p>

          <NavItem
            icon={<Settings size={18} />}
            text="Settings"
            onClick={() =>
              setSettingsOpen(true)
            }
          />

        </nav>


        <div className="system-status">

          <div className="status-dot"></div>

          <div>

            <strong>
              All systems operational
            </strong>

            <span>
              Live monitoring active
            </span>

          </div>

        </div>

      </aside>


      {/* MAIN */}

      <main className="main">

        <header className="topbar">

          <button
            className="mobile-menu"
            onClick={() =>
              setSidebarOpen(true)
            }
          >

            <Menu size={21} />

          </button>


          <div className="search">

            <Search size={18} />

            <input
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value
                )
              }
              onKeyDown={
                handleSearchKeyDown
              }
              placeholder="Search a city..."
            />

            {searching && (

              <span className="search-loading">
                Searching...
              </span>

            )}

          </div>


          <div className="top-actions">

            <button
              className="location-button"
              onClick={
                useMyLocation
              }
            >

              <Navigation size={17} />

              Use my location

            </button>


            <button
              className="icon-button"
              onClick={openEmergency}
            >

              <Bell size={19} />

              <span className="notification-dot"></span>

            </button>


            <div className="profile">

              <div className="avatar">
                FS
              </div>

              <div className="profile-text">

                <strong>
                  Dashboard
                </strong>

                <span>
                  Monitoring
                </span>

              </div>

            </div>

          </div>

        </header>


        <section
          className="content"
          id="overview"
        >

          {/* PAGE HEADING */}

          <div className="page-heading">

            <div>

              <p className="eyebrow">
                FLOOD RISK INTELLIGENCE
              </p>

              <h2>
                Good evening.
              </h2>

              <p>
                Monitoring environmental
                conditions across your
                selected area.
              </p>

            </div>


            <div className="updated">

              <span className="live-dot"></span>

              Live monitoring

              <span>
                •
              </span>

              {location.name},{" "}
              {location.country}

            </div>

          </div>


          {/* ERROR */}

          {error && (

            <div className="alert-banner">

              <div className="alert-icon">

                <AlertTriangle size={21} />

              </div>

              <div className="alert-content">

                <strong>
                  Data warning
                </strong>

                <p>
                  {error}
                </p>

              </div>

            </div>

          )}


          {/* DISASTER ALERT */}

          <div
            id="alert-section"
            className={`alert-banner ${
              disaster?.active
                ? "critical-alert"
                : ""
            }`}
          >

            <div className="alert-icon">

              <AlertTriangle size={21} />

            </div>


            <div className="alert-content">

              <strong>

                {loading
                  ? "Analyzing flood conditions..."
                  : disaster?.active
                    ? "🚨 ACTIVE NATURAL HAZARD DETECTED"
                    : riskLevel === "SEVERE"
                      ? "Severe flood risk detected"
                      : riskLevel === "HIGH"
                        ? "High flood risk detected"
                        : riskLevel === "MODERATE"
                          ? "Moderate flood risk detected"
                          : "Low flood risk"}

              </strong>


              <p>

                {loading
                  ? "Checking weather, river and disaster feeds..."
                  : disaster?.active
                    ? `${disaster.title}. ${disaster.description}`
                    : risk?.reason?.[0] ||
                      "Current environmental conditions are being monitored."}

              </p>

            </div>


            <button
              onClick={openEmergency}
            >
              View emergency
            </button>

          </div>


          {/* DASHBOARD GRID */}

          <div className="dashboard-grid">


            {/* FLOOD RISK */}

            <div
              className="card risk-card"
              id="risk-section"
            >

              <div className="card-header">

                <div>

                  <span className="card-label">
                    CURRENT FLOOD RISK
                  </span>

                  <h3>
                    {location.name},{" "}
                    {location.country}
                  </h3>

                </div>


                <span className="risk-badge">

                  {loading
                    ? "LOADING"
                    : riskLevel}

                </span>

              </div>


              <div className="risk-body">

                <div className="risk-score">

                  <div className="score-ring">

                    <div>

                      <strong>

                        {loading
                          ? "--"
                          : risk?.score ??
                            "--"}

                      </strong>

                      {!loading && (

                        <span>
                          /100
                        </span>

                      )}

                    </div>

                  </div>

                </div>


                <div className="risk-info">

                  <div className="trend">

                    <Activity size={16} />

                    {disaster?.active
                      ? "Active hazard"
                      : river?.trend ===
                          "RISING"
                        ? "River rising"
                        : loading
                          ? "Calculating"
                          : "Currently stable"}

                  </div>


                  <p>

                    {loading
                      ? "Analyzing current conditions..."
                      : risk?.reason?.join(
                          ". "
                        )}

                  </p>


                  <button
                    className="outline-button"
                    onClick={openEmergency}
                  >

                    Emergency help

                  </button>

                </div>

              </div>


              <div className="risk-footer">

                <span>
                  Weather + river + disaster data
                </span>

                <span>
                  Live
                </span>

              </div>

            </div>


            {/* WEATHER */}

            <div
              className="card"
              id="weather-section"
            >

              <div className="card-header">

                <div>

                  <span className="card-label">
                    CURRENT CONDITIONS
                  </span>

                  <h3>
                    Weather
                  </h3>

                </div>

                <CloudRain size={21} />

              </div>


              <div className="weather-main">

                <div>

                  <strong>

                    {loading
                      ? "--"
                      : `${weather?.temperature ?? "--"}°`}

                  </strong>

                  <span>

                    {loading
                      ? "Loading..."
                      : weather &&
                          weather.rainfall > 0
                        ? "Rain detected"
                        : "No rain"}

                  </span>

                </div>


                <CloudRain size={42} />

              </div>


              <div className="metrics">

                <Metric
                  icon={
                    <Droplets size={17} />
                  }
                  label="Rainfall"
                  value={
                    loading
                      ? "--"
                      : `${weather?.rainfall ?? 0} mm`
                  }
                />

                <Metric
                  icon={
                    <CloudRain size={17} />
                  }
                  label="Rain probability"
                  value={
                    loading
                      ? "--"
                      : `${weather?.rainProbability ?? 0}%`
                  }
                />

                <Metric
                  icon={
                    <Navigation size={17} />
                  }
                  label="Wind"
                  value={
                    loading
                      ? "--"
                      : `${weather?.windSpeed ?? 0} km/h`
                  }
                />

                <Metric
                  icon={
                    <Droplets size={17} />
                  }
                  label="Humidity"
                  value={
                    loading
                      ? "--"
                      : `${weather?.humidity ?? 0}%`
                  }
                />

              </div>

            </div>


            {/* RIVER */}

            <div
              className="card river-card"
              id="river-section"
            >

              <div className="card-header">

                <div>

                  <span className="card-label">
                    RIVER MONITOR
                  </span>

                  <h3>
                    River discharge
                  </h3>

                </div>


                <span className="watch-badge">

                  {river?.trend ||
                    "LOADING"}

                </span>

              </div>


              <div className="river-value">

                <strong>

                  {loading ||
                    !river?.available
                    ? "--"
                    : river.currentDischarge.toFixed(
                        1
                      )}

                </strong>

                <span>
                  m³/s
                </span>

              </div>


              <div className="river-trend">

                <Activity size={16} />

                {river?.trend ===
                  "RISING"
                  ? "River discharge rising"
                  : river?.trend ===
                      "FALLING"
                    ? "River discharge falling"
                    : "River discharge stable"}

              </div>

            </div>

          </div>


          {/* ANALYTICS */}

          <div
            className="lower-grid"
            id="reports-section"
          >


            {/* RAINFALL CHART */}

            <div className="card chart-card">

              <div className="card-header">

                <div>

                  <span className="card-label">
                    RAINFALL ANALYTICS
                  </span>

                  <h3>
                    Next 12 hours
                  </h3>

                </div>

                <span
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  Live forecast
                </span>

              </div>


              <div className="chart">

                <div className="y-labels">

                  <span>
                    {Math.ceil(
                      maxRainfall
                    )}
                  </span>

                  <span>
                    {Math.ceil(
                      maxRainfall * 0.75
                    )}
                  </span>

                  <span>
                    {Math.ceil(
                      maxRainfall * 0.5
                    )}
                  </span>

                  <span>
                    {Math.ceil(
                      maxRainfall * 0.25
                    )}
                  </span>

                  <span>
                    0
                  </span>

                </div>


                <div className="chart-area">

                  <div className="threshold">

                    <span>
                      Rainfall intensity
                    </span>

                  </div>


                  <div className="bars">

                    {weather?.hourlyRainfall &&
                    weather.hourlyRainfall
                      .length > 0 ? (

                      weather.hourlyRainfall.map(
                        (
                          rain,
                          index
                        ) => {

                          const height =
                            Math.max(
                              5,
                              Math.min(
                                100,
                                (rain /
                                  maxRainfall) *
                                  100
                              )
                            );

                          const probability =
                            weather
                              .hourlyRainProbability[
                              index
                            ] || 0;

                          return (

                            <div
                              key={index}
                              style={{
                                height:
                                  `${height}%`,
                              }}
                              title={`${rain.toFixed(
                                1
                              )} mm • ${probability}% rain probability`}
                            />

                          );

                        }
                      )

                    ) : (

                      <div
                        style={{
                          width: "100%",
                          textAlign:
                            "center",
                          padding:
                            "40px",
                          color:
                            "#94a3b8",
                        }}
                      >

                        Loading rainfall
                        forecast...

                      </div>

                    )}

                  </div>

                </div>

              </div>


              {weather?.hourlyLabels &&
                weather.hourlyLabels
                  .length > 0 && (

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginLeft:
                      "45px",
                    marginTop:
                      "8px",
                    color:
                      "#94a3b8",
                    fontSize:
                      "10px",
                  }}
                >

                  {weather.hourlyLabels.map(
                    (
                      label,
                      index
                    ) => (

                      <span
                        key={index}
                      >
                        {label}
                      </span>

                    )
                  )}

                </div>

              )}

            </div>


            {/* RISK BREAKDOWN */}

            <div
              className="card why-card"
              id="history-section"
            >

              <div className="card-header">

                <div>

                  <span className="card-label">
                    RISK BREAKDOWN
                  </span>

                  <h3>
                    Why this alert?
                  </h3>

                </div>

              </div>


              <div className="breakdown">

                <RiskFactor
                  name="Rainfall"
                  value={
                    weather
                      ? `${weather.rainfall} mm`
                      : "--"
                  }
                  width={
                    weather
                      ? `${Math.min(
                          100,
                          weather.rainfall *
                            2
                        )}%`
                      : "0%"
                  }
                />


                <RiskFactor
                  name="Rain probability"
                  value={
                    weather
                      ? `${weather.rainProbability}%`
                      : "--"
                  }
                  width={
                    weather
                      ? `${weather.rainProbability}%`
                      : "0%"
                  }
                />


                <RiskFactor
                  name="River discharge"
                  value={
                    river?.available
                      ? `${river.currentDischarge.toFixed(
                          1
                        )} m³/s`
                      : "--"
                  }
                  width={
                    river?.trend ===
                    "RISING"
                      ? "80%"
                      : "35%"
                  }
                />


                <RiskFactor
                  name="Active disaster"
                  value={
                    disaster?.active
                      ? "YES"
                      : "NO"
                  }
                  width={
                    disaster?.active
                      ? "100%"
                      : "5%"
                  }
                />

              </div>


              <div className="total-risk">

                <span>
                  Total estimated risk
                </span>

                <strong>

                  {loading
                    ? "--"
                    : `${risk?.score ?? 0} / 100`}

                </strong>

              </div>

            </div>

          </div>


          {/* MAP */}

          <div
            className="card map-card"
            id="map-section"
          >

            <div className="map-header">

              <div>

                <span className="card-label">
                  LIVE MAP
                </span>

                <h3>
                  Flood risk across{" "}
                  {location.name}
                </h3>

              </div>

              <button
                className="outline-button"
                onClick={openEmergency}
              >

                Emergency response

              </button>

            </div>


            <div className="real-map-wrapper">

              <MapView
                latitude={
                  location.latitude
                }
                longitude={
                  location.longitude
                }
                riskLevel={
                  riskLevel
                }
                riskScore={
                  risk?.score || 0
                }
                locationName={
                  location.name
                }
              />

            </div>

          </div>


          {/* HIDDEN ANCHOR FOR SETTINGS */}

          <div
            style={{
              height: "1px",
            }}
          />

        </section>

      </main>


      {/* SETTINGS PANEL */}

      {settingsOpen && (

        <SettingsPanel
          locationName={
            location.name
          }
          onClose={() =>
            setSettingsOpen(false)
          }
        />

      )}


      {/* EMERGENCY PANEL */}

      {emergencyOpen && (

        <EmergencyPanel
          locationName={
            location.name
          }
          riskLevel={
            riskLevel
          }
          riskScore={
            risk?.score || 0
          }
          disasterActive={
            disaster?.active || false
          }
          places={places}
          loading={placesLoading}
          onClose={() =>
            setEmergencyOpen(false)
          }
        />

      )}

    </div>

  );
}


/* NAV ITEM */

function NavItem({
  icon,
  text,
  active = false,
  badge,
  onClick,
}: {
  icon: ReactNode;
  text: string;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
}) {

  return (

    <button
      className={`nav-item ${
        active ? "active" : ""
      }`}
      onClick={onClick}
    >

      {icon}

      <span>
        {text}
      </span>

      {badge && (
        <b>
          {badge}
        </b>
      )}

    </button>

  );

}


/* METRIC */

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {

  return (

    <div className="metric">

      <div className="metric-icon">
        {icon}
      </div>

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>

  );

}


/* RISK FACTOR */

function RiskFactor({
  name,
  value,
  width,
}: {
  name: string;
  value: string;
  width: string;
}) {

  return (

    <div className="risk-factor">

      <div className="factor-top">

        <span>
          {name}
        </span>

        <strong>
          {value}
        </strong>

      </div>


      <div className="factor-bar">

        <div
          style={{
            width,
          }}
        />

      </div>

    </div>

  );

}


/* SETTINGS PANEL */

function SettingsPanel({
  locationName,
  onClose,
}: {
  locationName: string;
  onClose: () => void;
}) {

  return (

    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(10,20,30,0.55)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "flex-end",
        backdropFilter:
          "blur(5px)",
      }}
    >

      <div
        style={{
          width:
            "min(420px, 100%)",
          height: "100%",
          background: "#ffffff",
          boxShadow:
            "-20px 0 60px rgba(0,0,0,0.2)",
          overflowY: "auto",
        }}
      >

        <div
          style={{
            padding: "24px",
            borderBottom:
              "1px solid #e5e7eb",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
          }}
        >

          <div>

            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing:
                  "0.08em",
              }}
            >
              SYSTEM
            </span>

            <h2
              style={{
                margin:
                  "5px 0 0",
              }}
            >
              Settings
            </h2>

          </div>


          <button
            onClick={onClose}
            style={{
              border: "none",
              background:
                "#f1f5f9",
              width: "38px",
              height: "38px",
              borderRadius:
                "10px",
              cursor:
                "pointer",
            }}
          >

            <X size={20} />

          </button>

        </div>


        <div
          style={{
            padding: "24px",
          }}
        >

          <div
            style={{
              padding: "18px",
              background:
                "#f8fafc",
              borderRadius:
                "14px",
              marginBottom:
                "20px",
            }}
          >

            <span
              style={{
                color:
                  "#64748b",
                fontSize:
                  "12px",
              }}
            >
              Monitoring location
            </span>

            <strong
              style={{
                display:
                  "block",
                marginTop:
                  "5px",
                fontSize:
                  "16px",
              }}
            >
              {locationName}
            </strong>

          </div>


          <SettingRow
            title="Live monitoring"
            description="Continuously monitor environmental conditions."
            enabled
          />

          <SettingRow
            title="Flood alerts"
            description="Receive warnings when flood risk increases."
            enabled
          />

          <SettingRow
            title="River monitoring"
            description="Include river discharge in risk calculations."
            enabled
          />

          <SettingRow
            title="Emergency notifications"
            description="Show emergency response information."
            enabled
          />


          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              background:
                "#fff7ed",
              border:
                "1px solid #fed7aa",
              borderRadius:
                "12px",
              color:
                "#9a3412",
              fontSize:
                "12px",
              lineHeight:
                1.5,
            }}
          >

            Settings are currently
            dashboard preferences.
            Notification delivery can
            be connected to a backend
            service later.

          </div>

        </div>

      </div>

    </div>

  );

}


/* SETTING ROW */

function SettingRow({
  title,
  description,
  enabled,
}: {
  title: string;
  description: string;
  enabled: boolean;
}) {

  return (

    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        alignItems:
          "center",
        gap: "15px",
        padding:
          "16px 0",
        borderBottom:
          "1px solid #e5e7eb",
      }}
    >

      <div>

        <strong
          style={{
            display:
              "block",
            fontSize:
              "13px",
          }}
        >
          {title}
        </strong>

        <span
          style={{
            display:
              "block",
            marginTop:
              "4px",
            color:
              "#64748b",
            fontSize:
              "11px",
            lineHeight:
              1.5,
          }}
        >
          {description}
        </span>

      </div>


      <div
        style={{
          width: "38px",
          height: "22px",
          borderRadius:
            "20px",
          background:
            enabled
              ? "#0f766e"
              : "#cbd5e1",
          position:
            "relative",
          flexShrink: 0,
        }}
      >

        <div
          style={{
            position:
              "absolute",
            top: "3px",
            left:
              enabled
                ? "19px"
                : "3px",
            width: "16px",
            height: "16px",
            borderRadius:
              "50%",
            background:
              "#ffffff",
          }}
        />

      </div>

    </div>

  );

}


/* EMERGENCY PANEL */

function EmergencyPanel({
  locationName,
  riskLevel,
  riskScore,
  disasterActive,
  places,
  loading,
  onClose,
}: {
  locationName: string;
  riskLevel: string;
  riskScore: number;
  disasterActive: boolean;
  places: EmergencyPlace[];
  loading: boolean;
  onClose: () => void;
}) {

  const hospitals =
    places.filter(
      (place) =>
        place.type === "hospital"
    );

  const police =
    places.filter(
      (place) =>
        place.type === "police"
    );

  const fire =
    places.filter(
      (place) =>
        place.type === "fire"
    );

  const shelters =
    places.filter(
      (place) =>
        place.type === "shelter"
    );


  return (

    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(10,20,30,0.55)",
        zIndex: 9999,
        display: "flex",
        justifyContent:
          "center",
        alignItems:
          "center",
        padding: "24px",
        backdropFilter:
          "blur(5px)",
      }}
    >

      <div
        style={{
          width:
            "min(1000px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#ffffff",
          borderRadius: "20px",
          boxShadow:
            "0 25px 80px rgba(0,0,0,0.25)",
        }}
      >

        <div
          style={{
            padding: "24px",
            borderBottom:
              "1px solid #e5e7eb",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
          }}
        >

          <div>

            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: "12px",
              }}
            >

              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius:
                    "12px",
                  background:
                    "#fee2e2",
                  color:
                    "#dc2626",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                }}
              >

                <Siren size={22} />

              </div>


              <div>

                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      "22px",
                  }}
                >
                  Emergency Response
                </h2>

                <span
                  style={{
                    color:
                      "#64748b",
                    fontSize:
                      "13px",
                  }}
                >
                  Nearby services around{" "}
                  {locationName}
                </span>

              </div>

            </div>

          </div>


          <button
            onClick={onClose}
            style={{
              border: "none",
              background:
                "#f1f5f9",
              width: "38px",
              height: "38px",
              borderRadius:
                "10px",
              cursor:
                "pointer",
            }}
          >

            <X size={20} />

          </button>

        </div>


        <div
          style={{
            margin: "24px",
            padding: "18px",
            borderRadius:
              "14px",
            background:
              disasterActive
                ? "#fef2f2"
                : "#fff7ed",
            border:
              "1px solid #fed7aa",
          }}
        >

          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "12px",
            }}
          >

            <AlertTriangle
              size={22}
              color="#dc2626"
            />

            <div>

              <strong>
                {disasterActive
                  ? "Active natural hazard detected"
                  : "Emergency preparedness mode"}
              </strong>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color:
                    "#64748b",
                  fontSize:
                    "13px",
                }}
              >

                Current flood risk:{" "}
                <strong>
                  {riskLevel}
                </strong>{" "}
                ({riskScore}/100)

              </p>

            </div>

          </div>

        </div>


        <div
          style={{
            padding:
              "0 24px 24px",
          }}
        >

          <h3>
            Emergency contacts
          </h3>


          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >

            <EmergencyContact
              icon={
                <Phone size={20} />
              }
              title="Emergency"
              number="112"
            />

            <EmergencyContact
              icon={
                <Siren size={20} />
              }
              title="Police"
              number="100"
            />

            <EmergencyContact
              icon={
                <Flame size={20} />
              }
              title="Fire"
              number="101"
            />

            <EmergencyContact
              icon={
                <Hospital size={20} />
              }
              title="Ambulance"
              number="108"
            />

          </div>

        </div>


        <div
          style={{
            padding:
              "0 24px 28px",
          }}
        >

          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              marginBottom:
                "14px",
            }}
          >

            <div>

              <h3
                style={{
                  marginBottom:
                    "4px",
                }}
              >
                Nearby emergency services
              </h3>

              <span
                style={{
                  color:
                    "#64748b",
                  fontSize:
                    "12px",
                }}
              >
                OpenStreetMap data • within
                15 km
              </span>

            </div>

          </div>


          {loading && (

            <div
              style={{
                padding:
                  "30px",
                textAlign:
                  "center",
                color:
                  "#64748b",
              }}
            >

              <Activity
                size={24}
                style={{
                  marginBottom:
                    "8px",
                }}
              />

              <div>
                Finding nearby services...
              </div>

            </div>

          )}


          {!loading &&
            places.length === 0 && (

              <div
                style={{
                  padding:
                    "30px",
                  textAlign:
                    "center",
                  background:
                    "#f8fafc",
                  borderRadius:
                    "14px",
                  color:
                    "#64748b",
                }}
              >

                No nearby mapped emergency
                facilities were found.

              </div>

            )}


          {!loading &&
            places.length > 0 && (

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "12px",
                }}
              >

                <PlaceSection
                  title="Hospitals"
                  icon={
                    <Hospital size={20} />
                  }
                  places={hospitals}
                  type="hospital"
                />

                <PlaceSection
                  title="Police"
                  icon={
                    <Siren size={20} />
                  }
                  places={police}
                  type="police"
                />

                <PlaceSection
                  title="Fire stations"
                  icon={
                    <Flame size={20} />
                  }
                  places={fire}
                  type="fire"
                />

                <PlaceSection
                  title="Shelters"
                  icon={
                    <Home size={20} />
                  }
                  places={shelters}
                  type="shelter"
                />

              </div>

            )}

        </div>


        <div
          style={{
            margin:
              "0 24px 24px",
            padding:
              "18px",
            background:
              "#f8fafc",
            borderRadius:
              "14px",
          }}
        >

          <strong>
            ⚠️ Flood safety
          </strong>

          <p
            style={{
              margin:
                "7px 0 0",
              color:
                "#64748b",
              fontSize:
                "13px",
              lineHeight:
                1.6,
            }}
          >

            If flooding is occurring,
            move to higher ground.
            Never walk or drive through
            moving floodwater and follow
            instructions from local
            emergency authorities.

          </p>

        </div>


        <div
          style={{
            padding:
              "16px 24px",
            borderTop:
              "1px solid #e5e7eb",
            color:
              "#94a3b8",
            fontSize:
              "11px",
          }}
        >

          Nearby locations are sourced
          from OpenStreetMap and may
          be incomplete. Always verify
          emergency information with
          local authorities.

        </div>

      </div>

    </div>

  );

}


/* PLACE SECTION */

function PlaceSection({
  title,
  icon,
  places,
  type,
}: {
  title: string;
  icon: ReactNode;
  places: EmergencyPlace[];
  type: EmergencyPlace["type"];
}) {

  return (

    <div
      style={{
        border:
          "1px solid #e2e8f0",
        borderRadius:
          "14px",
        padding:
          "16px",
      }}
    >

      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          gap:
            "9px",
          marginBottom:
            "12px",
        }}
      >

        {icon}

        <strong>
          {title}
        </strong>

        <span
          style={{
            marginLeft:
              "auto",
            background:
              "#f1f5f9",
            padding:
              "3px 8px",
            borderRadius:
              "20px",
            fontSize:
              "11px",
          }}
        >
          {places.length}
        </span>

      </div>


      {places.length === 0 ? (

        <div
          style={{
            color:
              "#94a3b8",
            fontSize:
              "12px",
            padding:
              "8px 0",
          }}
        >
          No mapped {type} nearby.
        </div>

      ) : (

        <div
          style={{
            display:
              "flex",
            flexDirection:
              "column",
            gap:
              "8px",
          }}
        >

          {places
            .slice(0, 4)
            .map(
              (place) => (

                <a
                  key={place.id}
                  href={`https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap:
                      "9px",
                    padding:
                      "9px",
                    borderRadius:
                      "9px",
                    background:
                      "#f8fafc",
                    textDecoration:
                      "none",
                    color:
                      "#0f172a",
                  }}
                >

                  <MapPin
                    size={16}
                  />

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >

                    <div
                      style={{
                        fontSize:
                          "12px",
                        fontWeight:
                          600,
                        whiteSpace:
                          "nowrap",
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                      }}
                    >
                      {place.name}
                    </div>

                    <div
                      style={{
                        fontSize:
                          "10px",
                        color:
                          "#64748b",
                        marginTop:
                          "2px",
                      }}
                    >
                      {place.distance.toFixed(
                        1
                      )}{" "}
                      km away
                    </div>

                  </div>

                  <Navigation
                    size={14}
                  />

                </a>

              )
            )}

        </div>

      )}

    </div>

  );

}


/* EMERGENCY CONTACT */

function EmergencyContact({
  icon,
  title,
  number,
}: {
  icon: ReactNode;
  title: string;
  number: string;
}) {

  return (

    <a
      href={`tel:${number}`}
      style={{
        textDecoration:
          "none",
        color:
          "inherit",
        border:
          "1px solid #e2e8f0",
        borderRadius:
          "14px",
        padding:
          "16px",
        display:
          "flex",
        alignItems:
          "center",
        gap:
          "12px",
      }}
    >

      <div
        style={{
          width:
            "38px",
          height:
            "38px",
          borderRadius:
            "10px",
          background:
            "#f1f5f9",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
        }}
      >

        {icon}

      </div>


      <div>

        <div
          style={{
            fontSize:
              "12px",
            color:
              "#64748b",
          }}
        >
          {title}
        </div>

        <strong
          style={{
            fontSize:
              "18px",
          }}
        >
          {number}
        </strong>

      </div>

    </a>

  );

}


export default App;
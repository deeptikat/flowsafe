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
  Clock,
  CheckCircle,
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
  searchLocationSuggestions,
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

  const [alertsOpen, setAlertsOpen] =
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

  const [suggestions, setSuggestions] =
    useState<LocationData[]>([]);

  const [activeSuggestion, setActiveSuggestion] =
    useState(-1);

  const [loading, setLoading] =
    useState(true);

  const [searching, setSearching] =
    useState(false);

  const [locating, setLocating] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const query = searchText.trim();

    if (query.length < 2 || query === location.name) {
      setSuggestions([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        const results = await searchLocationSuggestions(query);
        setSuggestions(results);
        setActiveSuggestion(-1);
      } catch (err) {
        console.error(err);
        setSuggestions([]);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchText, location.name]);


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


  /*
   * OPEN ALERTS
   */

  function openAlerts() {

    setAlertsOpen(true);
    setSidebarOpen(false);

  }


  /*
   * LOAD ENVIRONMENTAL DATA
   */

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


  /*
   * LOAD EMERGENCY PLACES
   */

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


  /*
   * OPEN EMERGENCY
   */

  async function openEmergency() {

    setEmergencyOpen(true);

    await loadPlaces(
      location.latitude,
      location.longitude
    );

  }


  /*
   * SEARCH LOCATION
   */

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

  function selectSuggestion(suggestion: LocationData) {
    setSearchText(suggestion.name);
    setSuggestions([]);
    setActiveSuggestion(-1);
    setLocation(suggestion);
    void loadData(
      suggestion.latitude,
      suggestion.longitude,
      suggestion.country
    );
  }


  /*
   * SEARCH ENTER
   */

  function handleSearchKeyDown(
    event: KeyboardEvent<HTMLInputElement>
  ) {

    if (event.key === "Enter") {
      event.preventDefault();
      if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
        selectSuggestion(suggestions[activeSuggestion]);
      } else {
        void handleSearch();
      }
    }

    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      setActiveSuggestion((current) =>
        current < suggestions.length - 1 ? current + 1 : 0
      );
    }

    if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      setActiveSuggestion((current) =>
        current > 0 ? current - 1 : suggestions.length - 1
      );
    }

    if (event.key === "Escape") {
      setSuggestions([]);
      setActiveSuggestion(-1);
    }

  }


  /*
   * REVERSE GEOCODE GPS LOCATION
   *
   * We use OpenStreetMap Nominatim to turn
   * the browser's latitude/longitude into
   * a readable city and country.
   */

  async function reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<LocationData> {

    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?format=jsonv2` +
      `&lat=${encodeURIComponent(latitude)}` +
      `&lon=${encodeURIComponent(longitude)}` +
      `&zoom=10` +
      `&addressdetails=1`;

    const response =
      await fetch(url, {
        headers: {
          Accept:
            "application/json",
        },
      });

    if (!response.ok) {

      throw new Error(
        "Reverse geocoding failed."
      );

    }

    const data =
      await response.json();

    const address =
      data.address || {};

    const city =
      address.city ||
      address.town ||
      address.municipality ||
      address.village ||
      address.county ||
      "Current location";

    const country =
      address.country ||
      "Unknown";

    return {
      name: city,
      country,
      latitude,
      longitude,
    };

  }


 /*
 * USE MY LOCATION
 */

function useMyLocation() {

  if (!navigator.geolocation) {

    setError(
      "Geolocation is not supported by your browser."
    );

    return;

  }

  setError("");
  setLocating(true);

  navigator.geolocation.getCurrentPosition(

    async (position) => {

      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;

      try {

        /*
         * GPS successfully returned coordinates.
         *
         * Now reverse-geocode those coordinates
         * into a readable city/country.
         */

        const result =
          await reverseGeocode(
            latitude,
            longitude
          );

        setLocation(result);

        setSearchText(
          result.name
        );

        /*
         * Load weather, disaster and river
         * information for the actual GPS location.
         */

        await loadData(
          latitude,
          longitude,
          result.country
        );

        /*
         * Refresh emergency places if the
         * emergency panel is already open.
         */

        if (emergencyOpen) {

          await loadPlaces(
            latitude,
            longitude
          );

        }

      } catch (err) {

        console.error(
          "Location processing failed:",
          err
        );

        /*
         * GPS worked even if reverse geocoding
         * failed.
         *
         * Therefore we still use the actual
         * coordinates.
         */

        setLocation({

          name:
            "Current location",

          country:
            "India",

          latitude,

          longitude,

        });

        setSearchText(
          "Current location"
        );

        try {

          await loadData(
            latitude,
            longitude,
            "India"
          );

        } catch (dataError) {

          console.error(
            "Environmental data failed:",
            dataError
          );

          setError(
            "Your location was detected, but environmental data could not be loaded."
          );

        }

      } finally {

        setLocating(false);

      }

    },

    (error) => {

      console.error(
        "Geolocation error:",
        error
      );

      setLocating(false);

      if (
        error.code ===
        error.PERMISSION_DENIED
      ) {

        setError(
          "Location permission was denied. Please allow location access for this site in your browser."
        );

      } else if (
        error.code ===
        error.POSITION_UNAVAILABLE
      ) {

        setError(
          "Your device could not determine your location. Turn on Windows Location Services and try again."
        );

      } else if (
        error.code ===
        error.TIMEOUT
      ) {

        setError(
          "Location detection timed out. Please try again."
        );

      } else {

        setError(
          "Could not determine your location. Please try again."
        );

      }

    },

    {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
    }

  );

}

  /*
   * INITIAL DATA LOAD
   */

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
            onClick={openAlerts}
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

            {suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map((suggestion, index) => (
                  <button
                    className={
                      index === activeSuggestion
                        ? "suggestion active"
                        : "suggestion"
                    }
                    key={`${suggestion.name}-${suggestion.latitude}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectSuggestion(suggestion)}
                    type="button"
                  >
                    <MapPin size={14} />
                    <span>
                      <strong>{suggestion.name}</strong>
                      <small>
                        {[suggestion.admin1, suggestion.country]
                          .filter(Boolean)
                          .join(", ")}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            )}

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
              disabled={locating}
              style={{
                opacity:
                  locating ? 0.7 : 1,
                cursor:
                  locating
                    ? "wait"
                    : "pointer",
              }}
            >

              <Navigation
                size={17}
                style={{
                  animation:
                    locating
                      ? "spin 1s linear infinite"
                      : "none",
                }}
              />

              {locating
                ? "Locating..."
                : "Use my location"}

            </button>


            <button
              className="icon-button"
              onClick={openAlerts}
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


          {/* LIVE MAP */}

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


      {/* ALERTS PANEL */}

      {alertsOpen && (

        <AlertsPanel
          locationName={
            location.name
          }
          risk={risk}
          riskLevel={riskLevel}
          weather={weather}
          river={river}
          disaster={disaster}
          loading={loading}
          onClose={() =>
            setAlertsOpen(false)
          }
          onEmergency={() => {
            setAlertsOpen(false);
            openEmergency();
          }}
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


/* =========================================================
   NAV ITEM
   ========================================================= */

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


/* =========================================================
   METRIC
   ========================================================= */

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


/* =========================================================
   RISK FACTOR
   ========================================================= */

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


/* =========================================================
   ALERTS PANEL
   ========================================================= */

function AlertsPanel({
  locationName,
  risk,
  riskLevel,
  weather,
  river,
  disaster,
  loading,
  onClose,
  onEmergency,
}: {
  locationName: string;
  risk: RiskResult | null;
  riskLevel: string;
  weather: WeatherData | null;
  river: RiverData | null;
  disaster: DisasterAlert | null;
  loading: boolean;
  onClose: () => void;
  onEmergency: () => void;
}) {

  const alerts: {
    title: string;
    description: string;
    severity: "SEVERE" | "HIGH" | "MODERATE" | "INFO";
    icon: ReactNode;
  }[] = [];


  if (disaster?.active) {

    alerts.push({

      title:
        disaster.title ||
        "Active natural hazard",

      description:
        disaster.description ||
        "An active natural hazard has been detected in the monitored area.",

      severity:
        "SEVERE",

      icon:
        <Siren size={20} />,

    });

  }


  if (!loading && risk) {

    if (risk.score >= 75) {

      alerts.push({

        title:
          "Severe flood risk",

        description:
          risk.reason?.join(". ") ||
          "Multiple environmental indicators indicate severe flood risk.",

        severity:
          "SEVERE",

        icon:
          <AlertTriangle size={20} />,

      });

    } else if (risk.score >= 50) {

      alerts.push({

        title:
          "High flood risk",

        description:
          risk.reason?.join(". ") ||
          "Current environmental conditions indicate elevated flood risk.",

        severity:
          "HIGH",

        icon:
          <AlertTriangle size={20} />,

      });

    } else if (risk.score >= 25) {

      alerts.push({

        title:
          "Moderate flood risk",

        description:
          risk.reason?.join(". ") ||
          "Some environmental indicators are contributing to flood risk.",

        severity:
          "MODERATE",

        icon:
          <AlertTriangle size={20} />,

      });

    }

  }


  if (
    weather &&
    weather.rainfall >= 25
  ) {

    alerts.push({

      title:
        "Heavy rainfall detected",

      description:
        `${weather.rainfall} mm of current precipitation is contributing to elevated flood potential.`,

      severity:
        weather.rainfall >= 50
          ? "SEVERE"
          : "HIGH",

      icon:
        <CloudRain size={20} />,

    });

  }


  if (
    weather &&
    weather.rainProbability >= 60
  ) {

    alerts.push({

      title:
        "Rainfall likely to continue",

      description:
        `There is a ${weather.rainProbability}% probability of rainfall in the near-term forecast.`,

      severity:
        weather.rainProbability >= 80
          ? "HIGH"
          : "MODERATE",

      icon:
        <Droplets size={20} />,

    });

  }


  if (
    river?.available &&
    river.trend === "RISING"
  ) {

    alerts.push({

      title:
        "River discharge rising",

      description:
        `Current river discharge is ${river.currentDischarge.toFixed(
          1
        )} m³/s and the monitored trend is rising.`,

      severity:
        "HIGH",

      icon:
        <Waves size={20} />,

    });

  }


  if (
    !loading &&
    alerts.length === 0
  ) {

    alerts.push({

      title:
        "No active alerts",

      description:
        `Current environmental conditions around ${locationName} remain within monitored ranges.`,

      severity:
        "INFO",

      icon:
        <CheckCircle size={20} />,

    });

  }


  return (

    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(10,20,30,0.55)",
        zIndex: 10000,
        display: "flex",
        justifyContent: "flex-end",
        backdropFilter:
          "blur(5px)",
      }}
      onClick={onClose}
    >

      <div
        style={{
          width:
            "min(500px, 100%)",
          height: "100%",
          background: "#ffffff",
          boxShadow:
            "-20px 0 60px rgba(0,0,0,0.22)",
          overflowY: "auto",
        }}
        onClick={(event) =>
          event.stopPropagation()
        }
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >

              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >

                <Bell size={21} />

              </div>

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
                  FLOODSAFE
                </span>

                <h2
                  style={{
                    margin:
                      "4px 0 0",
                    fontSize: "22px",
                  }}
                >
                  Alerts
                </h2>

              </div>

            </div>

            <p
              style={{
                margin:
                  "12px 0 0",
                color:
                  "#64748b",
                fontSize:
                  "13px",
              }}
            >

              Live alerts for{" "}
              <strong>
                {locationName}
              </strong>

            </p>

          </div>


          <button
            onClick={onClose}
            style={{
              border: "none",
              background:
                "#f1f5f9",
              width: "40px",
              height: "40px",
              borderRadius:
                "10px",
              cursor:
                "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >

            <X size={20} />

          </button>

        </div>


        <div
          style={{
            margin: "20px 24px",
            padding: "15px",
            borderRadius: "14px",
            background:
              riskLevel === "SEVERE"
                ? "#fef2f2"
                : riskLevel === "HIGH"
                  ? "#fff7ed"
                  : riskLevel === "MODERATE"
                    ? "#fffbeb"
                    : "#f0fdf4",
            border:
              "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >

          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background:
                riskLevel === "SEVERE"
                  ? "#dc2626"
                  : riskLevel === "HIGH"
                    ? "#ea580c"
                    : riskLevel === "MODERATE"
                      ? "#f59e0b"
                      : "#16a34a",
              boxShadow:
                "0 0 0 5px rgba(0,0,0,0.04)",
            }}
          />

          <div>

            <strong
              style={{
                display: "block",
                fontSize: "13px",
              }}
            >

              Overall status:{" "}
              {loading
                ? "ANALYZING"
                : riskLevel}

            </strong>

            <span
              style={{
                display: "block",
                marginTop: "3px",
                fontSize: "11px",
                color: "#64748b",
              }}
            >

              Live environmental monitoring

            </span>

          </div>

        </div>


        <div
          style={{
            padding:
              "0 24px 30px",
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              marginBottom: "14px",
            }}
          >

            <h3
              style={{
                margin: 0,
                fontSize: "15px",
              }}
            >
              Current alerts
            </h3>

            <span
              style={{
                fontSize: "11px",
                color: "#64748b",
              }}
            >

              {loading
                ? "Analyzing..."
                : `${alerts.length} alert${
                    alerts.length === 1
                      ? ""
                      : "s"
                  }`}

            </span>

          </div>


          {loading ? (

            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                background: "#f8fafc",
                borderRadius: "14px",
                color: "#64748b",
              }}
            >

              <Activity
                size={26}
                style={{
                  marginBottom: "10px",
                }}
              />

              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Analyzing alerts...
              </div>

              <div
                style={{
                  fontSize: "11px",
                  marginTop: "5px",
                }}
              >
                Checking weather, river and
                hazard feeds.
              </div>

            </div>

          ) : (

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >

              {alerts.map(
                (
                  alert,
                  index
                ) => (

                  <AlertCard
                    key={`${alert.title}-${index}`}
                    title={alert.title}
                    description={
                      alert.description
                    }
                    severity={
                      alert.severity
                    }
                    icon={
                      alert.icon
                    }
                  />

                )
              )}

            </div>

          )}


          {!loading &&
            risk && (

            <div
              style={{
                marginTop: "20px",
                padding: "18px",
                border:
                  "1px solid #e2e8f0",
                borderRadius: "14px",
                background: "#f8fafc",
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                }}
              >

                <div>

                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#64748b",
                      letterSpacing:
                        "0.07em",
                    }}
                  >
                    FLOOD RISK SCORE
                  </span>

                  <div
                    style={{
                      marginTop: "5px",
                      fontSize: "13px",
                      color: "#475569",
                    }}
                  >
                    Combined environmental
                    assessment
                  </div>

                </div>


                <strong
                  style={{
                    fontSize: "26px",
                  }}
                >

                  {risk.score}

                  <span
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      fontWeight: 500,
                    }}
                  >
                    /100
                  </span>

                </strong>

              </div>


              <div
                style={{
                  marginTop: "13px",
                  height: "7px",
                  background: "#e2e8f0",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >

                <div
                  style={{
                    width:
                      `${risk.score}%`,
                    height: "100%",
                    background:
                      risk.score >= 75
                        ? "#dc2626"
                        : risk.score >= 50
                          ? "#ea580c"
                          : risk.score >= 25
                            ? "#f59e0b"
                            : "#16a34a",
                    borderRadius:
                      "10px",
                  }}
                />

              </div>

            </div>

          )}


          <button
            onClick={onEmergency}
            style={{
              width: "100%",
              marginTop: "18px",
              padding: "14px",
              border: "none",
              borderRadius: "12px",
              background: "#0f172a",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >

            <Siren size={17} />

            Open emergency response

          </button>


          <div
            style={{
              marginTop: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              color: "#94a3b8",
              fontSize: "10px",
            }}
          >

            <Clock size={12} />

            Live monitoring data

          </div>

        </div>

      </div>

    </div>

  );

}


/* =========================================================
   ALERT CARD
   ========================================================= */

function AlertCard({
  title,
  description,
  severity,
  icon,
}: {
  title: string;
  description: string;
  severity:
    | "SEVERE"
    | "HIGH"
    | "MODERATE"
    | "INFO";
  icon: ReactNode;
}) {

  const background =
    severity === "SEVERE"
      ? "#fef2f2"
      : severity === "HIGH"
        ? "#fff7ed"
        : severity === "MODERATE"
          ? "#fffbeb"
          : "#f0fdf4";


  const border =
    severity === "SEVERE"
      ? "#fecaca"
      : severity === "HIGH"
        ? "#fed7aa"
        : severity === "MODERATE"
          ? "#fde68a"
          : "#bbf7d0";


  const iconBackground =
    severity === "SEVERE"
      ? "#fee2e2"
      : severity === "HIGH"
        ? "#ffedd5"
        : severity === "MODERATE"
          ? "#fef3c7"
          : "#dcfce7";


  const iconColor =
    severity === "SEVERE"
      ? "#dc2626"
      : severity === "HIGH"
        ? "#ea580c"
        : severity === "MODERATE"
          ? "#d97706"
          : "#16a34a";


  return (

    <div
      style={{
        padding: "16px",
        borderRadius: "14px",
        border:
          `1px solid ${border}`,
        background,
      }}
    >

      <div
        style={{
          display: "flex",
          gap: "12px",
        }}
      >

        <div
          style={{
            width: "38px",
            height: "38px",
            flexShrink: 0,
            borderRadius: "10px",
            background:
              iconBackground,
            color:
              iconColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >

          {icon}

        </div>


        <div
          style={{
            flex: 1,
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: "10px",
            }}
          >

            <strong
              style={{
                fontSize: "13px",
              }}
            >
              {title}
            </strong>


            <span
              style={{
                fontSize: "9px",
                fontWeight: 800,
                letterSpacing:
                  "0.06em",
                color:
                  iconColor,
              }}
            >

              {severity}

            </span>

          </div>


          <p
            style={{
              margin:
                "6px 0 0",
              color:
                "#64748b",
              fontSize:
                "12px",
              lineHeight:
                1.55,
            }}
          >

            {description}

          </p>

        </div>

      </div>

    </div>

  );

}


/* =========================================================
   SETTINGS PANEL
   ========================================================= */

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
        justifyContent:
          "flex-end",
        backdropFilter:
          "blur(5px)",
      }}
      onClick={onClose}
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
        onClick={(event) =>
          event.stopPropagation()
        }
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


/* =========================================================
   SETTING ROW
   ========================================================= */

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


/* =========================================================
   EMERGENCY PANEL
   ========================================================= */

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
      onClick={onClose}
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
        onClick={(event) =>
          event.stopPropagation()
        }
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
              gap:
                "12px",
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
                  gap:
                    "12px",
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


/* =========================================================
   PLACE SECTION
   ========================================================= */

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


/* =========================================================
   EMERGENCY CONTACT
   ========================================================= */

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
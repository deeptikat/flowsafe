import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import {
  useEffect,
  useRef,
} from "react";

import L from "leaflet";

import "leaflet/dist/leaflet.css";


type MapViewProps = {
  latitude: number;
  longitude: number;
  riskLevel: string;
  riskScore: number;
  locationName: string;
};


/* -----------------------------
   LEAFLET MARKER ICON
----------------------------- */

const markerIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],

  iconAnchor: [12, 41],

  popupAnchor: [1, -34],

  shadowSize: [41, 41],
});


/* -----------------------------
   MAP CONTROLLER
----------------------------- */

function MapController({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {

  const map = useMap();

  useEffect(() => {

    /*
     * Tell Leaflet to recalculate its
     * container size after rendering.
     */

    const timer = setTimeout(() => {

      map.invalidateSize();

      map.flyTo(
        [latitude, longitude],
        11,
        {
          duration: 1,
        }
      );

    }, 150);

    return () => {
      clearTimeout(timer);
    };

  }, [
    latitude,
    longitude,
    map,
  ]);

  return null;
}


/* -----------------------------
   MAP RESIZE FIX
----------------------------- */

function MapResizeFix() {

  const map = useMap();

  useEffect(() => {

    const resizeMap = () => {
      map.invalidateSize();
    };

    /*
     * Initial resize.
     */

    setTimeout(
      resizeMap,
      100
    );

    setTimeout(
      resizeMap,
      500
    );

    setTimeout(
      resizeMap,
      1000
    );

    /*
     * Resize whenever the
     * browser window changes.
     */

    window.addEventListener(
      "resize",
      resizeMap
    );

    return () => {

      window.removeEventListener(
        "resize",
        resizeMap
      );

    };

  }, [map]);

  return null;
}


/* -----------------------------
   MAIN MAP
----------------------------- */

export default function MapView({
  latitude,
  longitude,
  riskLevel,
  riskScore,
  locationName,
}: MapViewProps) {


  const radius =
    riskLevel === "SEVERE"
      ? 9000
      : riskLevel === "HIGH"
        ? 7000
        : riskLevel === "MODERATE"
          ? 5000
          : 3000;


  const fillOpacity =
    riskLevel === "SEVERE"
      ? 0.30
      : riskLevel === "HIGH"
        ? 0.25
        : riskLevel === "MODERATE"
          ? 0.18
          : 0.10;


  return (

    <div
      style={{
        width: "100%",
        height: "500px",
        minHeight: "500px",
        position: "relative",
        overflow: "hidden",
        borderRadius: "16px",
        background: "#e2e8f0",
      }}
    >

      <MapContainer
        center={[
          latitude,
          longitude,
        ]}
        zoom={11}
        scrollWheelZoom={true}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "500px",
        }}
      >

        <MapResizeFix />

        <MapController
          latitude={latitude}
          longitude={longitude}
        />


        {/* -----------------------------
            OPENSTREETMAP
        ----------------------------- */}

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />


        {/* -----------------------------
            LOCATION MARKER
        ----------------------------- */}

        <Marker
          position={[
            latitude,
            longitude,
          ]}
          icon={markerIcon}
        >

          <Popup>

            <div
              style={{
                minWidth: "150px",
              }}
            >

              <strong
                style={{
                  fontSize: "15px",
                }}
              >
                {locationName}
              </strong>

              <br />

              <span>
                Flood risk:
              </span>

              <strong>
                {" "}
                {riskLevel}
              </strong>

              <br />

              <span>
                Risk score:
              </span>

              <strong>
                {" "}
                {riskScore}/100
              </strong>

            </div>

          </Popup>

        </Marker>


        {/* -----------------------------
            FLOOD RISK AREA
        ----------------------------- */}

        <Circle
          center={[
            latitude,
            longitude,
          ]}
          radius={radius}
          pathOptions={{
            fillOpacity,
            opacity: 0.7,
            weight: 2,
          }}
        />

      </MapContainer>


      {/* -----------------------------
          MAP STATUS
      ----------------------------- */}

      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          zIndex: 1000,
          background:
            "rgba(255,255,255,0.96)",
          border:
            "1px solid #e2e8f0",
          borderRadius: "12px",
          padding:
            "10px 13px",
          boxShadow:
            "0 5px 20px rgba(15,23,42,0.12)",
          pointerEvents: "none",
        }}
      >

        <div
          style={{
            fontSize: "10px",
            color: "#64748b",
            textTransform:
              "uppercase",
            letterSpacing:
              "0.08em",
            fontWeight: 700,
          }}
        >
          FLOOD RISK
        </div>


        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "4px",
          }}
        >

          <span
            style={{
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              background:
                riskLevel === "SEVERE"
                  ? "#dc2626"
                  : riskLevel === "HIGH"
                    ? "#ea580c"
                    : riskLevel === "MODERATE"
                      ? "#f59e0b"
                      : "#16a34a",
            }}
          />


          <strong
            style={{
              fontSize: "14px",
            }}
          >
            {riskLevel}
          </strong>


          <span
            style={{
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            {riskScore}/100
          </span>

        </div>

      </div>

    </div>

  );
}
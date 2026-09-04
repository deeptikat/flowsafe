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


/*
 * Fix Leaflet's default marker icon
 * when using Vite + React.
 */

const markerIcon =
  new L.Icon({
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


/*
 * Automatically moves the map when
 * the searched location changes.
 */

function MapController({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {

  const map = useMap();

  useEffect(() => {

    map.flyTo(
      [latitude, longitude],
      11,
      {
        duration: 1.2,
      }
    );

  }, [
    latitude,
    longitude,
    map,
  ]);

  return null;
}


export default function MapView({
  latitude,
  longitude,
  riskLevel,
  riskScore,
  locationName,
}: MapViewProps) {

  /*
   * Determine the flood-risk
   * visualization radius.
   */

  const radius =
    riskLevel === "SEVERE"
      ? 9000
      : riskLevel === "HIGH"
        ? 7000
        : riskLevel === "MODERATE"
          ? 5000
          : 3000;


  return (

    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "420px",
        position: "relative",
        overflow: "hidden",
        borderRadius: "16px",
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
        }}
      >

        <MapController
          latitude={latitude}
          longitude={longitude}
        />


        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />


        {/* LOCATION MARKER */}

        <Marker
          position={[
            latitude,
            longitude,
          ]}
          icon={markerIcon}
        >

          <Popup>

            <strong>
              {locationName}
            </strong>

            <br />

            Flood risk:{" "}

            <strong>
              {riskLevel}
            </strong>

            <br />

            Risk score:{" "}

            {riskScore}/100

          </Popup>

        </Marker>


        {/* FLOOD RISK AREA */}

        <Circle
          center={[
            latitude,
            longitude,
          ]}
          radius={radius}
          pathOptions={{
            fillOpacity:
              riskLevel === "SEVERE"
                ? 0.3
                : riskLevel === "HIGH"
                  ? 0.25
                  : riskLevel === "MODERATE"
                    ? 0.18
                    : 0.1,

            opacity: 0.7,

            weight: 2,
          }}
        />

      </MapContainer>


      {/* MAP OVERLAY */}

      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          zIndex: 1000,
          background:
            "rgba(255,255,255,0.95)",
          border:
            "1px solid #e2e8f0",
          borderRadius: "12px",
          padding:
            "10px 13px",
          boxShadow:
            "0 5px 20px rgba(15,23,42,0.12)",
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
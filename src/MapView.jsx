import React, { useCallback, useState } from "react";
import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";

const MAP_STYLE = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

const CONTAINER_STYLE = { width: "100%", height: "100%" };

function squareIcon(color, selected) {
  return {
    path: "M -8,-8 L 8,-8 L 8,8 L -8,8 Z",
    fillColor: color,
    fillOpacity: 1,
    strokeColor: selected ? "#4A90D9" : "#00000055",
    strokeWeight: selected ? 2.5 : 1,
    scale: 1,
  };
}

function substationIcon() {
  return {
    path: "M 0,-10 -7,3 0,3 -3,10 8,-2 1,-2 Z",
    fillColor: "#F2B134",
    fillOpacity: 1,
    strokeColor: "#3A2E10",
    strokeWeight: 1,
    scale: 1,
  };
}

export default function MapView({
  apiKey,
  center,
  zoom = 19,
  houses,
  substation,
  getColor,
  selectedIds = [],
  onHouseClick,
  editable = false,
  onMapClick,
  onHouseDrag,
  polylines = [],
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "linecut-google-map",
    googleMapsApiKey: apiKey || "",
  });
  const [map, setMap] = useState(null);

  const onLoad = useCallback((m) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  if (!apiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center text-center p-6 text-sm" style={{ background: "#0E1620", color: "#8FA1B0" }}>
        Add a Google Maps API key (VITE_GOOGLE_MAPS_API_KEY in .env) to show the live map.
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6 text-sm" style={{ background: "#0E1620", color: "#E4572E" }}>
        Couldn't load Google Maps — check that your API key is valid and the Maps JavaScript API is enabled.
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6 text-sm" style={{ background: "#0E1620", color: "#8FA1B0" }}>
        Loading map…
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <GoogleMap
        mapContainerStyle={CONTAINER_STYLE}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={editable ? (e) => onMapClick && onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() }) : undefined}
        options={{
          styles: MAP_STYLE,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: false,
          clickableIcons: false,
        }}
      >
        {polylines.map((pl, i) => (
          <Polyline
            key={i}
            path={pl.path}
            options={{ strokeColor: pl.color, strokeOpacity: pl.opacity ?? 0.8, strokeWeight: 2 }}
          />
        ))}
        {substation && (
          <Marker position={substation} icon={substationIcon()} title="33kV Substation" />
        )}
        {houses.map((h) => (
          <Marker
            key={h.id}
            position={{ lat: h.lat, lng: h.lng }}
            icon={squareIcon(getColor(h), selectedIds.includes(h.id))}
            draggable={editable}
            title={h.name}
            onClick={() => onHouseClick && onHouseClick(h)}
            onDragEnd={(e) => onHouseDrag && onHouseDrag(h.id, { lat: e.latLng.lat(), lng: e.latLng.lng() })}
          />
        ))}
      </GoogleMap>
    </div>
  );
}

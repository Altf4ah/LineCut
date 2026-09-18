import React, { useCallback, useState } from "react";
import { GoogleMap, Marker, Polygon, useJsApiLoader } from "@react-google-maps/api";

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
    strokeColor: selected ? "#1D6FA5" : "#00000055",
    strokeWeight: selected ? 2.5 : 1,
    scale: 1,
  };
}

export default function MapView({
  apiKey,
  center,
  zoom = 19,
  houses,
  getColor,
  selectedIds = [],
  onHouseClick,
  editable = false,
  onMapClick,
  onHouseDrag,
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "linecut-google-map",
    googleMapsApiKey: apiKey || "",
  });
  const [, setMap] = useState(null);

  const onLoad = useCallback((m) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  if (!apiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center text-center p-6 text-sm" style={{ background: "#F1F4F7", color: "#64748B" }}>
        Add a Google Maps API key (VITE_GOOGLE_MAPS_API_KEY in .env) to show the live map.
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6 text-sm" style={{ background: "#FBE4DC", color: "#C13F1F" }}>
        Couldn't load Google Maps — check that your API key is valid and the Maps JavaScript API is enabled.
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6 text-sm" style={{ background: "#F1F4F7", color: "#64748B" }}>
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
        {houses.map((h) => {
          const color = getColor(h);
          const selected = selectedIds.includes(h.id);
          if (h.polygon && h.polygon.length > 2) {
            return (
              <Polygon
                key={h.id}
                paths={h.polygon}
                onClick={() => onHouseClick && onHouseClick(h)}
                options={{
                  fillColor: color,
                  fillOpacity: 0.62,
                  strokeColor: selected ? "#1D6FA5" : "#4B5B68",
                  strokeWeight: selected ? 3 : 1.2,
                  clickable: !!onHouseClick,
                }}
              />
            );
          }
          return (
            <Marker
              key={h.id}
              position={{ lat: h.lat, lng: h.lng }}
              icon={squareIcon(color, selected)}
              draggable={editable}
              title={h.name}
              onClick={() => onHouseClick && onHouseClick(h)}
              onDragEnd={(e) => onHouseDrag && onHouseDrag(h.id, { lat: e.latLng.lat(), lng: e.latLng.lng() })}
            />
          );
        })}
      </GoogleMap>
    </div>
  );
}

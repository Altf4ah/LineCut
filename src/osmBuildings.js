// Looks up the real building outline (from OpenStreetMap, via the free Overpass API)
// that contains or sits closest to a clicked point, so we can color the actual
// building shape instead of dropping a generic pin.
export async function fetchBuildingFootprint(lat, lng) {
  const query = `[out:json][timeout:15];way(around:22,${lat},${lng})[building];out geom 3;`;
  const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

  const res = await fetch(url);
  if (!res.ok) throw new Error("Overpass request failed");
  const data = await res.json();
  const ways = (data.elements || []).filter((el) => el.type === "way" && el.geometry?.length > 2);
  if (!ways.length) return null;

  // Prefer the building whose footprint is closest to the clicked point.
  const distTo = (way) => {
    const c = centroid(way.geometry.map((p) => ({ lat: p.lat, lng: p.lon })));
    return Math.hypot(c.lat - lat, c.lng - lng);
  };
  ways.sort((a, b) => distTo(a) - distTo(b));

  return ways[0].geometry.map((p) => ({ lat: p.lat, lng: p.lon }));
}

export function centroid(points) {
  const n = points.length || 1;
  const sum = points.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
  return { lat: sum.lat / n, lng: sum.lng / n };
}

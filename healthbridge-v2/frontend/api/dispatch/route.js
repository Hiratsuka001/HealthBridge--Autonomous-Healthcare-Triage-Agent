import { handleCors, checkRateLimit } from "../_cors.js";

export default async function handler(req, res) {
  if (handleCors(req, res, "GET, POST, OPTIONS", "Content-Type")) return;
  if (!checkRateLimit(req, res)) return;

  const start_lat = req.query.start_lat || req.body?.start_lat || 23.7258;
  const start_lng = req.query.start_lng || req.body?.start_lng || 90.3976;
  const dest_lat = req.query.dest_lat || req.body?.dest_lat || 23.7250;
  const dest_lng = req.query.dest_lng || req.body?.dest_lng || 90.3975;

  const apiKey = process.env.GEOAPIFY_API_KEY || process.env.VITE_GEOAPIFY_KEY;

  if (apiKey && !apiKey.startsWith("your_")) {
    const url = `https://api.geoapify.com/v1/routing?waypoints=${start_lat},${start_lng}|${dest_lat},${dest_lng}&mode=drive&apiKey=${apiKey}`;
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const feature = data.features?.[0];
        if (feature?.geometry?.coordinates?.[0]) {
          const rawCoords = feature.geometry.coordinates[0];
          const leafletCoords = rawCoords.map((c) => [c[1], c[0]]);
          const props = feature.properties || {};
          return res.status(200).json({
            coordinates: leafletCoords,
            distance_meters: props.distance || 1200,
            time_seconds: props.time || 360,
            source: "Geoapify Live Road Routing"
          });
        }
      }
    } catch (e) {
      console.warn("[Geoapify Route Error]", e);
    }
  }

  // Fallback simulated road coordinates with realistic Dhaka road distance calculation
  const sLat = Number(start_lat);
  const sLng = Number(start_lng);
  const dLat = Number(dest_lat);
  const dLng = Number(dest_lng);

  const steps = 18;
  const simCoords = [];
  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const curve = Math.sin(frac * Math.PI) * 0.003;
    simCoords.push([
      sLat + (dLat - sLat) * frac + curve,
      sLng + (dLng - sLng) * frac + curve * 0.5
    ]);
  }

  // Calculate Haversine road distance
  const dLatRad = ((dLat - sLat) * Math.PI) / 180;
  const dLngRad = ((dLng - sLng) * Math.PI) / 180;
  const a =
    Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
    Math.cos((sLat * Math.PI) / 180) *
      Math.cos((dLat * Math.PI) / 180) *
      Math.sin(dLngRad / 2) *
      Math.sin(dLngRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightMeters = 6371000 * c;
  const roadMeters = Math.round(Math.max(500, straightMeters * 1.35));
  const roadSeconds = Math.round(Math.max(120, (roadMeters / (28 * 1000 / 3600)))); // ~28 km/h emergency speed

  return res.status(200).json({
    coordinates: simCoords,
    distance_meters: roadMeters,
    time_seconds: roadSeconds,
    source: "Simulated Ambulance Routing (Dynamic Dhaka Coordinates)"
  });
}

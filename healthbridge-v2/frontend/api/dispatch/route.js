export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

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

  // Fallback simulated road coordinates
  const steps = 15;
  const simCoords = [];
  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const curve = Math.sin(frac * Math.PI) * 0.003;
    simCoords.push([
      Number(start_lat) + (Number(dest_lat) - Number(start_lat)) * frac + curve,
      Number(start_lng) + (Number(dest_lng) - Number(start_lng)) * frac + curve * 0.5
    ]);
  }

  return res.status(200).json({
    coordinates: simCoords,
    distance_meters: 1200,
    time_seconds: 480,
    source: "Simulated Ambulance Routing (Bakshibazar Road)"
  });
}

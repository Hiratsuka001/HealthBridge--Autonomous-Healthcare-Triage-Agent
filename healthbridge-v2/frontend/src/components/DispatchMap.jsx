import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getAmbulanceRoute } from "../api";
import {
  Navigation,
  MapPin,
  Clock,
  Compass,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY || "";

// Hospital & Pharmacy POIs in Dhaka
const DEFAULT_FACILITIES = [
  {
    id: "dmch",
    name: "Dhaka Medical College Hospital (Trauma ER)",
    type: "hospital",
    lat: 23.7250,
    lng: 90.3975,
    eta: "8 mins",
    distance: "1.2 km",
    specialty: "Trauma & Resus Bay 2",
    color: "#ef4444",
  },
  {
    id: "nicvd",
    name: "NICVD (National Heart Institute)",
    type: "cardiac",
    lat: 23.7702,
    lng: 90.3668,
    eta: "14 mins",
    distance: "3.1 km",
    specialty: "Primary PCI / Cath Lab",
    color: "#f97316",
  },
  {
    id: "praava",
    name: "Praava Health Urgent Clinic",
    type: "clinic",
    lat: 23.7380,
    lng: 90.3920,
    eta: "6 mins",
    distance: "1.8 km",
    specialty: "Acute Outpatient & IV Fluids",
    color: "#eab308",
  },
  {
    id: "lazz",
    name: "Lazz Pharma (24/7 Registered Pharmacist)",
    type: "pharmacy",
    lat: 23.7285,
    lng: 90.3980,
    eta: "2 mins",
    distance: "300 m",
    specialty: "ORS, Nebulizer, First-Aid",
    color: "#10b981",
  },
];

export default function DispatchMap({
  patientCoords = null,
  severity = "Severe",
  targetHospital = null,
  autoAnimate = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const ambulanceMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const animationTimerRef = useRef(null);

  const defaultLat = patientCoords?.lat ?? 23.7258;
  const defaultLng = patientCoords?.lng ?? 90.3976;

  const [filterType, setFilterType] = useState("all"); // 'all' | 'hospital' | 'pharmacy'
  const [isSimulating, setIsSimulating] = useState(false);
  const [routeInfo, setRouteInfo] = useState({
    distance: "1.2 km",
    time: "8 mins",
    speed: 44,
    status: "STANDBY",
    currentWaypointIndex: 0,
    totalWaypoints: 0,
  });

  // Stop simulation helper
  const stopSimulation = useCallback(() => {
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    setIsSimulating(false);
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // Geoapify Dark Matter Tile Layer with fallback to CartoDB Dark Matter
    const tileUrl = GEOAPIFY_KEY
      ? `https://maps.geoapify.com/v1/tile/dark-matter-purple-roads/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    // 1. Patient Emergency Location Marker (Pulsing Radar Pin)
    const patientIcon = L.divIcon({
      className: "custom-patient-marker",
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <span class="absolute inline-flex w-full h-full rounded-full bg-cyan-400 opacity-60 animate-ping"></span>
          <span class="relative inline-flex rounded-full w-5 h-5 bg-cyan-500 border-2 border-white shadow-lg items-center justify-center text-[10px] text-black font-bold">📍</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker([defaultLat, defaultLng], { icon: patientIcon })
      .addTo(map)
      .bindPopup(
        `<div class="p-1 font-sans text-xs">
          <strong class="text-cyan-600 block">Patient Emergency Location</strong>
          <span>Shaheed Minar / Bakshibazar Road</span>
          <div class="text-[10px] text-gray-500 mt-1">GPS: ${defaultLat.toFixed(4)}, ${defaultLng.toFixed(4)}</div>
        </div>`
      );

    // 2. Render Facilities
    DEFAULT_FACILITIES.forEach((fac) => {
      const isTarget = targetHospital?.name?.includes(fac.name) || fac.id === "dmch";
      const facIcon = L.divIcon({
        className: "custom-fac-marker",
        html: `
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-lg shadow-lg border text-[11px] font-bold ${
            isTarget
              ? "bg-red-600 text-white border-red-400 animate-pulse"
              : fac.type === "pharmacy"
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-500"
              : "bg-slate-900/90 text-slate-100 border-slate-700"
          }">
            <span>${fac.type === "pharmacy" ? "💊" : "🏥"}</span>
            <span class="truncate max-w-[120px]">${fac.name.split(" ")[0]}</span>
          </div>
        `,
        iconSize: [120, 28],
        iconAnchor: [60, 14],
      });

      L.marker([fac.lat, fac.lng], { icon: facIcon })
        .addTo(map)
        .bindPopup(
          `<div class="p-1 font-sans text-xs">
            <strong class="text-slate-900 block">${fac.name}</strong>
            <span class="text-indigo-600 font-medium">${fac.specialty}</span>
            <div class="text-[10px] text-gray-500 mt-0.5">ETA: ${fac.eta} • Distance: ${fac.distance}</div>
          </div>`
        );
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      stopSimulation();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [defaultLat, defaultLng, targetHospital, stopSimulation]);

  // Run or toggle real Geoapify road routing & ambulance simulation
  const startAmbulanceSimulation = useCallback(async () => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    setIsSimulating(true);
    setRouteInfo((prev) => ({ ...prev, status: "CALCULATING_ROAD_ROUTE" }));

    // Target hospital: DMCH
    const dest = DEFAULT_FACILITIES[0];
    const routeData = await getAmbulanceRoute(defaultLat, defaultLng, dest.lat, dest.lng);
    const waypoints = routeData.coordinates || [];

    if (waypoints.length === 0) {
      setIsSimulating(false);
      return;
    }

    // Clean up previous route polyline and marker
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
    }
    if (ambulanceMarkerRef.current) {
      map.removeLayer(ambulanceMarkerRef.current);
    }

    // Draw Geoapify road polyline with neon glowing style
    const polyline = L.polyline(waypoints, {
      color: "#6366f1",
      weight: 5,
      opacity: 0.9,
      lineCap: "round",
      dashArray: "1, 10",
      dashOffset: "0",
    }).addTo(map);
    routePolylineRef.current = polyline;

    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    // Ambulance Moving Icon
    const ambulanceIcon = L.divIcon({
      className: "custom-amb-marker",
      html: `
        <div class="relative flex items-center justify-center w-10 h-10">
          <span class="absolute inline-flex w-full h-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
          <div class="relative bg-red-600 border-2 border-white rounded-full p-1.5 shadow-2xl text-base flex items-center justify-center">
            🚑
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const startPos = waypoints[0];
    const marker = L.marker(startPos, { icon: ambulanceIcon }).addTo(map);
    ambulanceMarkerRef.current = marker;

    let currentIndex = 0;
    const total = waypoints.length;

    setRouteInfo({
      distance: `${(routeData.distance_meters / 1000).toFixed(1)} km`,
      time: `${Math.ceil(routeData.time_seconds / 60)} mins`,
      speed: 46,
      status: "EN_ROUTE_TO_BAY",
      currentWaypointIndex: 0,
      totalWaypoints: total,
    });

    // Step through the actual road coordinates
    animationTimerRef.current = setInterval(() => {
      currentIndex += 1;
      if (currentIndex >= total) {
        stopSimulation();
        setRouteInfo((prev) => ({
          ...prev,
          status: "ARRIVED_AT_BAY_2",
          time: "0 mins (On Scene)",
          currentWaypointIndex: total,
        }));
        return;
      }

      const nextPos = waypoints[currentIndex];
      marker.setLatLng(nextPos);

      const remainingMins = Math.max(
        1,
        Math.ceil(((total - currentIndex) / total) * (routeData.time_seconds / 60))
      );

      setRouteInfo((prev) => ({
        ...prev,
        currentWaypointIndex: currentIndex,
        time: `${remainingMins} mins`,
      }));
    }, 700);
  }, [defaultLat, defaultLng, stopSimulation]);

  useEffect(() => {
    let timer;
    if (autoAnimate && severity === "Severe") {
      timer = setTimeout(() => {
        startAmbulanceSimulation();
      }, 500);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [autoAnimate, severity, startAmbulanceSimulation]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col gap-3 p-4">
      {/* Map Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Navigation className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Geoapify Live Dispatch & Telemetry Map
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono font-medium">
                Live Road Network Routing
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive Leaflet routing • Real Dhaka hospital POIs & ambulance tracking
            </p>
          </div>
        </div>

        {/* Filter and Simulation Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setFilterType("all")}
              className={`px-2.5 py-1 rounded transition font-medium ${
                filterType === "all" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              All POIs
            </button>
            <button
              onClick={() => setFilterType("hospital")}
              className={`px-2.5 py-1 rounded transition font-medium ${
                filterType === "hospital" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Hospitals
            </button>
            <button
              onClick={() => setFilterType("pharmacy")}
              className={`px-2.5 py-1 rounded transition font-medium ${
                filterType === "pharmacy" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Pharmacies
            </button>
          </div>

          <button
            onClick={isSimulating ? stopSimulation : startAmbulanceSimulation}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow ${
              isSimulating
                ? "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            {isSimulating ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" /> Stop Simulation
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Simulate Ambulance Run
              </>
            )}
          </button>
        </div>
      </div>

      {/* Telemetry HUD Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Route Status</span>
            <span
              className={`font-bold font-mono text-xs ${
                routeInfo.status.includes("ARRIVED")
                  ? "text-emerald-400"
                  : routeInfo.status.includes("EN_ROUTE")
                  ? "text-red-400"
                  : "text-slate-300"
              }`}
            >
              {routeInfo.status}
            </span>
          </div>
          <Compass className="w-4 h-4 text-slate-600" />
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Road ETA</span>
            <span className="font-bold font-mono text-xs text-amber-300 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {routeInfo.time}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Real-Time</span>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Transit Distance</span>
            <span className="font-bold font-mono text-xs text-cyan-300">{routeInfo.distance}</span>
          </div>
          <MapPin className="w-3 h-3 text-cyan-500" />
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Ambulance Speed</span>
            <span className="font-bold font-mono text-xs text-white">
              {isSimulating ? `${routeInfo.speed} km/h` : "0 km/h"}
            </span>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className="relative w-full h-[340px] rounded-lg overflow-hidden border border-slate-800 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-[400] bg-slate-950/90 border border-slate-800 rounded-lg p-2.5 text-[10px] text-slate-300 space-y-1 backdrop-blur pointer-events-none">
          <div className="flex items-center gap-1.5 font-bold text-slate-100 mb-1">
            <span>🗺️</span>
            <span>Dhaka Emergency Grid</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>Patient (Shaheed Minar)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>Dhaka Medical College (Bay 2)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>24/7 Registered Pharmacy</span>
          </div>
        </div>
      </div>
    </div>
  );
}

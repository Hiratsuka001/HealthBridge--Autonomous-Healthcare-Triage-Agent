import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
  Activity,
} from "lucide-react";

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY || "";

function toBengaliDigits(num) {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (d) => bnDigits[Number(d)]);
}

function getHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateRoadStats(fromLat, fromLng, toLat, toLng) {
  const straightKm = getHaversineDistanceKm(fromLat, fromLng, toLat, toLng);
  const roadKm = Math.max(0.3, straightKm * 1.35);
  const etaMins = Math.max(2, Math.ceil((roadKm / 28) * 60)); // ~28 km/h emergency speed in Dhaka
  const distStr = roadKm < 1 ? `${Math.round(roadKm * 1000)} m` : `${roadKm.toFixed(1)} km`;
  const etaStr = `${etaMins} mins`;
  const etaStrBn = `${toBengaliDigits(etaMins)} মিনিট`;
  const distStrBn =
    roadKm < 1
      ? `${toBengaliDigits(Math.round(roadKm * 1000))} মিটার`
      : `${toBengaliDigits(roadKm.toFixed(1))} কিমি`;
  return { roadKm, etaMins, distStr, etaStr, distStrBn, etaStrBn };
}

// Major Dhaka Landmark Dictionary for instant zero-latency location resolution
export const DHAKA_LANDMARKS = [
  { name_en: "Rampura / Hatirjheel Link Rd", name_bn: "রামপুরা / হাতিরঝিল লিংক রোড", lat: 23.7662, lng: 90.4181 },
  { name_en: "Mohakhali / Wireless Gate", name_bn: "মহাখালী / ওয়্যারলেস গেট", lat: 23.7780, lng: 90.4005 },
  { name_en: "Merul Badda / Pragati Sarani", name_bn: "মেরুল বাড্ডা / প্রগতি সরণি", lat: 23.7808, lng: 90.4267 },
  { name_en: "Banasree / Rampura Canal", name_bn: "বনশ্রী / রামপুরা খালপাড়", lat: 23.7620, lng: 90.4350 },
  { name_en: "Gulshan-1 / Police Plaza", name_bn: "গুলশান-১ / পুলিশ প্লাজা", lat: 23.7785, lng: 90.4150 },
  { name_en: "Gulshan-2 / Madani Avenue", name_bn: "গুলশান-২ / মাদানী এভিনিউ", lat: 23.7925, lng: 90.4155 },
  { name_en: "Banani / Kamal Ataturk", name_bn: "বনানী / কামাল আতাতুর্ক এভিনিউ", lat: 23.7937, lng: 90.4040 },
  { name_en: "Baridhara Diplomatic Zone", name_bn: "বারিধারা কূটনৈতিক এলাকা", lat: 23.8010, lng: 90.4220 },
  { name_en: "Bashundhara R/A / Evercare", name_bn: "বসুন্ধরা আবাসিক এলাকা", lat: 23.8150, lng: 90.4320 },
  { name_en: "Khilgaon / Malibagh Railgate", name_bn: "খিলগাঁও / মালিবাগ রেলগেট", lat: 23.7530, lng: 90.4190 },
  { name_en: "Moghbazar / Madhubagh", name_bn: "মগবাজার / মধুবাগ", lat: 23.7485, lng: 90.4045 },
  { name_en: "Tejgaon Industrial Area", name_bn: "তেজগাঁও শিল্প এলাকা", lat: 23.7600, lng: 90.3950 },
  { name_en: "Farmgate / Indira Road", name_bn: "ফার্মগেট / ইন্দিরা রোড", lat: 23.7570, lng: 90.3875 },
  { name_en: "Karwan Bazar / Panthapath", name_bn: "কাওরান বাজার / পান্থপথ", lat: 23.7510, lng: 90.3930 },
  { name_en: "Dhanmondi / Mirpur Road", name_bn: "ধানমন্ডি / মিরপুর রোড", lat: 23.7460, lng: 90.3780 },
  { name_en: "Shahbagh / BSMMU", name_bn: "শাহবাগ / পিজি মোড়", lat: 23.7385, lng: 90.3955 },
  { name_en: "Shaheed Minar / DU Campus", name_bn: "শহীদ মিনার / ঢাবি ক্যাম্পাস", lat: 23.7258, lng: 90.3976 },
  { name_en: "Bakshibazar / DMCH Gate 2", name_bn: "বকশীবাজার / ঢামেক ২ নং গেট", lat: 23.7225, lng: 90.3960 },
  { name_en: "Lalbagh / Old Dhaka", name_bn: "লালবাগ / পুরান ঢাকা", lat: 23.7190, lng: 90.3880 },
  { name_en: "Motijheel / Shapla Chattar", name_bn: "মতিঝিল / শাপলা চত্বর", lat: 23.7330, lng: 90.4170 },
  { name_en: "Mirpur 10 Circle", name_bn: "মিরপুর ১০ নম্বর গোলচত্বর", lat: 23.8070, lng: 90.3685 },
  { name_en: "Uttara Sector 3 / Airport", name_bn: "উত্তরা ৩ নম্বর সেক্টর", lat: 23.8680, lng: 90.3980 },
  { name_en: "Mohammadpur Town Hall", name_bn: "মোহাম্মদপুর টাউন হল", lat: 23.7650, lng: 90.3620 },
  { name_en: "Jatrabari / Sayedabad", name_bn: "যাত্রাবাড়ী / সায়েদাবাদ", lat: 23.7120, lng: 90.4350 },
];

export function resolveDhakaLandmark(lat, lng, isBn = true) {
  if (!lat || !lng) {
    return isBn ? "ঢাকা মেট্রোপলিটন এলাকা" : "Dhaka Metropolitan Area";
  }
  let best = DHAKA_LANDMARKS[0];
  let minDist = Infinity;
  for (const lm of DHAKA_LANDMARKS) {
    const d = (lm.lat - lat) ** 2 + (lm.lng - lng) ** 2;
    if (d < minDist) {
      minDist = d;
      best = lm;
    }
  }
  return isBn ? best.name_bn : best.name_en;
}

// Emergency Facilities in Dhaka with bilingual metadata
const DHAKA_FACILITIES = [
  {
    id: "dmch",
    name: "Dhaka Medical College Hospital (Trauma ER)",
    name_bn: "ঢাকা মেডিকেল কলেজ হাসপাতাল (ট্রমা ইমার্জেন্সি)",
    short_bn: "ঢাকা মেডিকেল কলেজ (বে ২)",
    type: "hospital",
    lat: 23.7250,
    lng: 90.3975,
    specialty: "Trauma & Resus Bay 2",
    specialty_bn: "ট্রমা ও রিসাসিটেশন বে ২",
    color: "#ef4444",
  },
  {
    id: "nicvd",
    name: "NICVD (National Heart Institute)",
    name_bn: "জাতীয় হৃদরোগ ইনস্টিটিউট (ক্যাথ ল্যাব)",
    short_bn: "জাতীয় হৃদরোগ ইনস্টিটিউট",
    type: "cardiac",
    lat: 23.7702,
    lng: 90.3668,
    specialty: "Primary PCI / Cath Lab",
    specialty_bn: "প্রাইমারি পিসিআই ও ক্যাথ ল্যাব",
    color: "#f97316",
  },
  {
    id: "kurmitola",
    name: "Kurmitola General Hospital",
    name_bn: "কুর্মিটোলা জেনারেল হাসপাতাল",
    short_bn: "কুর্মিটোলা জেনারেল হাসপাতাল",
    type: "hospital",
    lat: 23.8214,
    lng: 90.4048,
    specialty: "Acute Care & ICU",
    specialty_bn: "জরুরি চিকিৎসা ও আইসিইউ",
    color: "#ef4444",
  },
  {
    id: "praava",
    name: "Praava Health Urgent Clinic",
    name_bn: "প্রাভা হেলথ আরজেন্ট কেয়ার",
    short_bn: "প্রাভা হেলথ ক্লিনিক",
    type: "clinic",
    lat: 23.7925,
    lng: 90.4034,
    specialty: "Acute Outpatient & IV Fluids",
    specialty_bn: "বহির্বিভাগ ও জরুরি ড্রিপ",
    color: "#eab308",
  },
  {
    id: "lazz_rampura",
    name: "Lazz Pharma (Rampura / DIT Road)",
    name_bn: "লাজ ফার্মা (রামপুরা ডিআইটি রোড)",
    short_bn: "লাজ ফার্মা (রামপুরা)",
    type: "pharmacy",
    lat: 23.7665,
    lng: 90.4202,
    specialty: "24/7 Pharmacist, Nebulizer, ORS",
    specialty_bn: "২৪/৭ ফার্মাসিস্ট ও জরুরি ওষুধ",
    color: "#10b981",
  },
  {
    id: "lazz_du",
    name: "Lazz Pharma (Shahbagh / DU Gate)",
    name_bn: "লাজ ফার্মা (শাহবাগ / ঢাবি মোড়)",
    short_bn: "লাজ ফার্মা (শাহবাগ)",
    type: "pharmacy",
    lat: 23.7285,
    lng: 90.3980,
    specialty: "24/7 Registered Pharmacist",
    specialty_bn: "২৪/৭ নিবন্ধিত ফার্মেসি",
    color: "#10b981",
  },
  {
    id: "lazz_panthapath",
    name: "Lazz Pharma (Panthapath 24/7)",
    name_bn: "লাজ ফার্মা (পান্থপথ ২৪/৭)",
    short_bn: "লাজ ফার্মা (পান্থপথ)",
    type: "pharmacy",
    lat: 23.7516,
    lng: 90.3842,
    specialty: "24/7 Pharmacist, Life Support Meds",
    specialty_bn: "২৪/৭ জরুরি ওষুধ ও ফার্মাসিস্ট",
    color: "#10b981",
  },
];

export default function DispatchMap({
  patientCoords = null,
  severity = "Severe",
  targetHospital = null,
  autoAnimate = false,
  lang = "bn",
}) {
  const isBn = lang === "bn";
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const ambulanceMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const animationTimerRef = useRef(null);
  const patientMarkerRef = useRef(null);
  const facilityMarkersRef = useRef([]);

  const defaultLat = patientCoords?.lat ?? 23.7771;
  const defaultLng = patientCoords?.lng ?? 90.3994;

  const [filterType, setFilterType] = useState("all"); // 'all' | 'hospital' | 'pharmacy'
  const [isSimulating, setIsSimulating] = useState(false);
  const [reverseGeoAddress, setReverseGeoAddress] = useState(null);

  // Synchronously compute nearest landmark
  const nearestLandmark = useMemo(
    () => resolveDhakaLandmark(defaultLat, defaultLng, isBn),
    [defaultLat, defaultLng, isBn]
  );

  const displayLocation = reverseGeoAddress || nearestLandmark;

  // Asynchronously query Geoapify reverse geocoding if API key is present
  useEffect(() => {
    let isMounted = true;
    async function fetchReverseGeocode() {
      if (!GEOAPIFY_KEY || GEOAPIFY_KEY.startsWith("your_")) return;
      try {
        const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${defaultLat}&lon=${defaultLng}&apiKey=${GEOAPIFY_KEY}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const props = data.features?.[0]?.properties;
          if (props && isMounted) {
            const label = props.street || props.suburb || props.district || props.city;
            if (label) {
              setReverseGeoAddress(label);
            }
          }
        }
      } catch (e) {
        // Silently keep nearestLandmark fallback
      }
    }
    fetchReverseGeocode();
    return () => {
      isMounted = false;
    };
  }, [defaultLat, defaultLng]);

  // Determine Target Hospital dynamically
  const targetFac = useMemo(() => {
    const hospitals = DHAKA_FACILITIES.filter((f) => f.type === "hospital" || f.type === "cardiac");
    if (targetHospital) {
      const match = hospitals.find(
        (h) =>
          h.name.toLowerCase().includes(targetHospital.name?.toLowerCase() || "") ||
          (targetHospital.id && h.id === targetHospital.id)
      );
      if (match) return match;
    }
    const isCardiac =
      String(severity).toLowerCase().includes("cardiac") ||
      String(severity).toLowerCase().includes("heart");
    if (isCardiac) {
      return hospitals.find((h) => h.type === "cardiac") || hospitals[0];
    }
    // Find closest hospital to patient coords
    let closest = hospitals[0];
    let minDist = Infinity;
    hospitals.forEach((h) => {
      const d = getHaversineDistanceKm(defaultLat, defaultLng, h.lat, h.lng);
      if (d < minDist) {
        minDist = d;
        closest = h;
      }
    });
    return closest;
  }, [targetHospital, severity, defaultLat, defaultLng]);

  // Determine Nearest 24/7 Pharmacy dynamically
  const nearestPharmacy = useMemo(() => {
    const pharmacies = DHAKA_FACILITIES.filter((f) => f.type === "pharmacy");
    let closest = pharmacies[0];
    let minDist = Infinity;
    pharmacies.forEach((p) => {
      const d = getHaversineDistanceKm(defaultLat, defaultLng, p.lat, p.lng);
      if (d < minDist) {
        minDist = d;
        closest = p;
      }
    });
    return closest;
  }, [defaultLat, defaultLng]);

  // Dynamic road stats for target hospital and pharmacy
  const targetStats = useMemo(
    () => calculateRoadStats(defaultLat, defaultLng, targetFac.lat, targetFac.lng),
    [defaultLat, defaultLng, targetFac]
  );

  const pharmStats = useMemo(
    () => calculateRoadStats(defaultLat, defaultLng, nearestPharmacy.lat, nearestPharmacy.lng),
    [defaultLat, defaultLng, nearestPharmacy]
  );

  const [routeInfo, setRouteInfo] = useState({
    distance: isBn ? targetStats.distStrBn : targetStats.distStr,
    time: isBn ? targetStats.etaStrBn : targetStats.etaStr,
    speed: 46,
    status: "STANDBY",
    currentWaypointIndex: 0,
    totalWaypoints: 0,
  });

  // Keep routeInfo distance and time in sync with patient coords when standby
  useEffect(() => {
    if (!isSimulating) {
      setRouteInfo((prev) => ({
        ...prev,
        distance: isBn ? targetStats.distStrBn : targetStats.distStr,
        time: isBn ? targetStats.etaStrBn : targetStats.etaStr,
        status: "STANDBY",
      }));
    }
  }, [targetStats, isBn, isSimulating]);

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

    // Geoapify Dark Matter Tile Layer with fallback to Dark OpenStreetMap
    const tileUrl = GEOAPIFY_KEY
      ? `https://maps.geoapify.com/v1/tile/dark-matter-purple-roads/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: GEOAPIFY_KEY ? "abcd" : "abc",
      className: GEOAPIFY_KEY ? "" : "dark-osm-tiles",
    }).addTo(map);

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
  }, [stopSimulation]);

  // Update Map Center and Markers dynamically
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    map.panTo([defaultLat, defaultLng], { animate: true });

    // 1. Patient Marker
    if (patientMarkerRef.current) {
      map.removeLayer(patientMarkerRef.current);
    }

    const patientIcon = L.divIcon({
      className: "custom-patient-marker",
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <span class="absolute inline-flex w-full h-full rounded-full bg-cyan-400 opacity-75 animate-ping"></span>
          <span class="relative inline-flex rounded-full w-5 h-5 bg-cyan-500 border-2 border-white shadow-xl items-center justify-center text-[10px] text-black font-bold">📍</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const pMarker = L.marker([defaultLat, defaultLng], { icon: patientIcon })
      .addTo(map)
      .bindPopup(
        `<div class="p-1 font-sans text-xs">
          <strong class="text-cyan-600 block">${isBn ? "রোগীর বর্তমান জরুরি অবস্থান" : "Patient Current Location"}</strong>
          <span class="font-medium text-slate-800">${displayLocation}</span>
          <div class="text-[10px] text-gray-500 mt-1">GPS: ${defaultLat.toFixed(4)}, ${defaultLng.toFixed(4)}</div>
        </div>`
      );
    patientMarkerRef.current = pMarker;

    // 2. Clear old facility markers
    facilityMarkersRef.current.forEach((m) => map.removeLayer(m));
    facilityMarkersRef.current = [];

    // Filter facilities based on active filterType
    const visibleFacilities = DHAKA_FACILITIES.filter((fac) => {
      if (filterType === "hospital") return fac.type === "hospital" || fac.type === "cardiac" || fac.type === "clinic";
      if (filterType === "pharmacy") return fac.type === "pharmacy";
      return true;
    });

    visibleFacilities.forEach((fac) => {
      const stats = calculateRoadStats(defaultLat, defaultLng, fac.lat, fac.lng);
      const isTarget = fac.id === targetFac.id;
      const isNearestPharm = fac.id === nearestPharmacy.id;

      const facIcon = L.divIcon({
        className: "custom-fac-marker",
        html: `
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-lg shadow-xl border text-[11px] font-bold ${
            isTarget
              ? "bg-red-600 text-white border-red-300 ring-2 ring-red-400/50 animate-pulse"
              : isNearestPharm
              ? "bg-emerald-600 text-white border-emerald-300 ring-2 ring-emerald-400/50"
              : fac.type === "pharmacy"
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/70"
              : "bg-slate-900/90 text-slate-100 border-slate-700"
          }">
            <span>${fac.type === "pharmacy" ? "💊" : "🏥"}</span>
            <span class="truncate max-w-[120px]">${isBn ? (fac.short_bn || fac.name_bn?.split(" ")[0]) : fac.name.split(" ")[0]}</span>
          </div>
        `,
        iconSize: [120, 28],
        iconAnchor: [60, 14],
      });

      const fMarker = L.marker([fac.lat, fac.lng], { icon: facIcon })
        .addTo(map)
        .bindPopup(
          `<div class="p-1.5 font-sans text-xs min-w-[160px]">
            <strong class="text-slate-900 block">${isBn ? (fac.name_bn || fac.name) : fac.name}</strong>
            <span class="text-indigo-600 font-medium block">${isBn ? (fac.specialty_bn || fac.specialty) : fac.specialty}</span>
            <div class="text-[10px] text-gray-600 mt-1 pt-1 border-t border-gray-100 flex items-center justify-between">
              <span>${isBn ? "দূরত্ব: " + stats.distStrBn : "Dist: " + stats.distStr}</span>
              <span class="font-bold text-amber-600">${isBn ? "সময়: " + stats.etaStrBn : "ETA: " + stats.etaStr}</span>
            </div>
          </div>`
        );
      facilityMarkersRef.current.push(fMarker);
    });
  }, [defaultLat, defaultLng, displayLocation, filterType, targetFac, nearestPharmacy, isBn]);

  // Run or toggle real Geoapify road routing & ambulance simulation
  const startAmbulanceSimulation = useCallback(async () => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    setIsSimulating(true);
    setRouteInfo((prev) => ({
      ...prev,
      status: isBn ? "রুট গণনা হচ্ছে..." : "CALCULATING_ROAD_ROUTE",
    }));

    const dest = targetFac;
    const routeData = await getAmbulanceRoute(defaultLat, defaultLng, dest.lat, dest.lng);
    const waypoints = routeData.coordinates || [];

    if (waypoints.length === 0) {
      setIsSimulating(false);
      return;
    }

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
    }
    if (ambulanceMarkerRef.current) {
      map.removeLayer(ambulanceMarkerRef.current);
    }

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
    const totalKm = (routeData.distance_meters / 1000).toFixed(1);
    const totalMins = Math.ceil(routeData.time_seconds / 60);

    setRouteInfo({
      distance: isBn ? `${toBengaliDigits(totalKm)} কিমি` : `${totalKm} km`,
      time: isBn ? `${toBengaliDigits(totalMins)} মিনিট` : `${totalMins} mins`,
      speed: 48,
      status: "EN_ROUTE_TO_BAY",
      currentWaypointIndex: 0,
      totalWaypoints: total,
    });

    animationTimerRef.current = setInterval(() => {
      currentIndex += 1;
      if (currentIndex >= total) {
        stopSimulation();
        setRouteInfo((prev) => ({
          ...prev,
          status: "ARRIVED_AT_BAY_2",
          time: isBn ? "০ মিনিট (পৌঁছেছে)" : "0 mins (On Scene)",
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
      const remainingKm = Math.max(
        0.1,
        (((total - currentIndex) / total) * (routeData.distance_meters / 1000)).toFixed(1)
      );

      setRouteInfo((prev) => ({
        ...prev,
        currentWaypointIndex: currentIndex,
        distance: isBn ? `${toBengaliDigits(remainingKm)} কিমি` : `${remainingKm} km`,
        time: isBn ? `${toBengaliDigits(remainingMins)} মিনিট` : `${remainingMins} mins`,
      }));
    }, 700);
  }, [defaultLat, defaultLng, targetFac, isBn, stopSimulation]);

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
              <span>{isBn ? "লাইভ অ্যাম্বুলেন্স নেভিগেশন ও ট্রমা রুট" : "Live Dispatch & Telemetry Navigation"}</span>
              <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded font-mono font-medium">
                {isBn ? "লাইভ রুট ম্যাপিং" : "Live Routing"}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {isBn
                ? "ঢাকার জরুরি হাসপাতাল ও ফার্মেসি ট্র্যাকিং • রিয়েল-টাইম জিপিএস"
                : "Real-time road network routing • Dhaka emergency hospital POIs & ambulance tracking"}
            </p>
          </div>
        </div>

        {/* Filter and Simulation Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#07090e] p-1 rounded-xl border border-slate-800 text-[11px]">
            <button
              onClick={() => setFilterType("all")}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                filterType === "all" ? "bg-teal-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              {isBn ? "সব" : "All"}
            </button>
            <button
              onClick={() => setFilterType("hospital")}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                filterType === "hospital" ? "bg-red-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              {isBn ? "হাসপাতাল" : "Hospitals"}
            </button>
            <button
              onClick={() => setFilterType("pharmacy")}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                filterType === "pharmacy" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              {isBn ? "ফার্মেসি" : "Pharmacies"}
            </button>
          </div>

          <button
            onClick={isSimulating ? stopSimulation : startAmbulanceSimulation}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
              isSimulating
                ? "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                : "bg-teal-700 hover:bg-teal-800 text-white"
            }`}
          >
            {isSimulating ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isBn ? "সিমুলেশন থামান" : "Stop Run"}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>{isBn ? "অ্যাম্বুলেন্স রান শুরু" : "Simulate Run"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Telemetry HUD Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-[#07090e]/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">{isBn ? "রুট অবস্থা" : "Route Status"}</span>
            <span
              className={`font-bold font-mono text-xs ${
                routeInfo.status.includes("ARRIVED")
                  ? "text-emerald-400"
                  : routeInfo.status.includes("EN_ROUTE")
                  ? "text-red-400"
                  : "text-slate-300"
              }`}
            >
              {isBn && routeInfo.status === "STANDBY"
                ? "স্ট্যান্ডবাই"
                : isBn && routeInfo.status.includes("ARRIVED")
                ? "হাসপাতালে পৌঁছেছে"
                : isBn && routeInfo.status.includes("EN_ROUTE")
                ? "জরুরি রুটে চলমান"
                : routeInfo.status}
            </span>
          </div>
          <Compass className="w-4 h-4 text-slate-600" />
        </div>

        <div className="bg-[#07090e]/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">{isBn ? "পৌঁছানোর সময়" : "Road ETA"}</span>
            <span className="font-bold font-mono text-xs text-amber-300 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {routeInfo.time}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Live</span>
        </div>

        <div className="bg-[#07090e]/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">{isBn ? "দূরত্ব" : "Distance"}</span>
            <span className="font-bold font-mono text-xs text-cyan-300">{routeInfo.distance}</span>
          </div>
          <MapPin className="w-3 h-3 text-cyan-500" />
        </div>

        <div className="bg-[#07090e]/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">{isBn ? "অ্যাম্বুলেন্স গতি" : "Speed"}</span>
            <span className="font-bold font-mono text-xs text-white">
              {isSimulating ? (isBn ? `${toBengaliDigits(routeInfo.speed)} কিমি/ঘণ্টা` : `${routeInfo.speed} km/h`) : (isBn ? "০ কিমি/ঘণ্টা" : "0 km/h")}
            </span>
          </div>
          <Activity className="w-3.5 h-3.5 text-teal-400" />
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className="relative w-full h-[340px] rounded-xl overflow-hidden border border-slate-800 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Dynamic Emergency Grid Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-[400] bg-[#07090e]/95 border border-slate-800/90 rounded-xl p-3 text-[11px] text-slate-300 space-y-2 backdrop-blur shadow-2xl max-w-[285px] border-l-2 border-l-teal-500 pointer-events-none">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-100 text-xs">
              <span>🗺️</span>
              <span>{isBn ? "লাইভ ইমার্জেন্সি গ্রিড" : "Live Emergency Grid"}</span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              GPS {defaultLat.toFixed(2)}, {defaultLng.toFixed(2)}
            </span>
          </div>

          <div className="space-y-1.5">
            {/* 1. Patient Location */}
            <div className="flex items-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 mt-1 shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.9)] animate-pulse"></span>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block leading-tight font-medium">
                  {isBn ? "রোগীর বর্তমান অবস্থান" : "Patient Current Location"}
                </span>
                <span className="text-white font-semibold leading-snug truncate block text-xs">
                  {displayLocation}
                </span>
              </div>
            </div>

            {/* 2. Target Emergency Hospital */}
            <div className="flex items-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.9)]"></span>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block leading-tight font-medium">
                  {isBn ? "গন্তব্য জরুরি হাসপাতাল" : "Target Emergency Hospital"}
                </span>
                <span className="text-red-300 font-semibold leading-snug truncate block text-xs">
                  {isBn ? (targetFac.short_bn || targetFac.name_bn || targetFac.name) : targetFac.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {isBn
                    ? `${targetStats.distStrBn} • আনুমানিক ${targetStats.etaStrBn}`
                    : `${targetStats.distStr} • ~${targetStats.etaStr}`}
                </span>
              </div>
            </div>

            {/* 3. Nearest Pharmacy */}
            <div className="flex items-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.9)]"></span>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block leading-tight font-medium">
                  {isBn ? "নিকটস্থ ২৪/৭ ফার্মেসি" : "Nearest 24/7 Pharmacy"}
                </span>
                <span className="text-emerald-300 font-semibold leading-snug truncate block text-xs">
                  {isBn ? (nearestPharmacy.short_bn || nearestPharmacy.name_bn || nearestPharmacy.name) : nearestPharmacy.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {isBn
                    ? `${pharmStats.distStrBn} • আনুমানিক ${pharmStats.etaStrBn}`
                    : `${pharmStats.distStr} • ~${pharmStats.etaStr}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

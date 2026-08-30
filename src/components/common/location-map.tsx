import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, Navigation, Route, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/locale-context";
import { cn } from "@/lib/utils";

/**
 * خريطة عرض لموقع محافظة أو مكان، مع رسم مسار الوصول إليه من موقع الزائر.
 *
 * البلاطات من OpenStreetMap والمسار من OSRM — كلاهما مفتوح ولا يحتاج مفتاحاً،
 * ويبقى رابط خرائط جوجل متاحاً لمن يفضّل الملاحة الصوتية على هاتفه.
 */

const DESTINATION_ZOOM = 14;

const destinationIcon = L.divIcon({
  className: "",
  html: `
    <span style="display:grid;place-items:center;width:34px;height:34px;margin:-34px 0 0 -17px;">
      <svg viewBox="0 0 24 24" width="34" height="34" fill="#d9a441" stroke="#0f2a24" stroke-width="1.5">
        <path d="M12 22s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"/>
        <circle cx="12" cy="11" r="2.6" fill="#0f2a24" stroke="none"/>
      </svg>
    </span>`,
  iconSize: [0, 0],
});

const originIcon = L.divIcon({
  className: "",
  html: `
    <span style="display:grid;place-items:center;width:20px;height:20px;margin:-10px 0 0 -10px;">
      <span style="width:14px;height:14px;border-radius:9999px;background:#275145;border:3px solid #ffffff;box-shadow:0 0 0 2px rgba(39,81,69,.35);"></span>
    </span>`,
  iconSize: [0, 0],
});

interface RouteSummary {
  /** إحداثيات المسار بترتيب leaflet: [lat, lng] */
  points: [number, number][];
  distanceKm: number;
  durationMinutes: number;
}

/** يطلب مساراً بالسيارة من OSRM بين نقطتين. */
async function fetchRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<RouteSummary> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson`;

  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("routing failed");

  const payload = (await response.json()) as {
    code?: string;
    routes?: Array<{
      distance: number;
      duration: number;
      geometry: { coordinates: [number, number][] };
    }>;
  };

  const route = payload.routes?.[0];
  if (payload.code !== "Ok" || !route) throw new Error("no route");

  return {
    /* GeoJSON يعطي [lng, lat] بينما leaflet ينتظر [lat, lng] */
    points: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: route.distance / 1000,
    durationMinutes: route.duration / 60,
  };
}

export function LocationMap({
  latitude,
  longitude,
  title,
  className,
}: {
  latitude: number;
  longitude: number;
  title: string;
  className?: string;
}) {
  const t = useT();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  const [routing, setRouting] = useState(false);
  const [summary, setSummary] = useState<RouteSummary | null>(null);

  /* إنشاء الخريطة مرة واحدة على الوجهة. */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: DESTINATION_ZOOM,
      scrollWheelZoom: false,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    L.marker([latitude, longitude], { icon: destinationIcon })
      .addTo(map)
      .bindPopup(title);

    /* التمرير بالعجلة معطّل افتراضياً حتى لا تبتلع الخريطة تمرير الصفحة. */
    map.on("click", () => map.scrollWheelZoom.enable());
    map.on("mouseout", () => map.scrollWheelZoom.disable());

    mapRef.current = map;
    routeLayerRef.current = L.layerGroup().addTo(map);

    /* الحاوية قد تُقاس قبل اكتمال التخطيط. */
    const timer = window.setTimeout(() => map.invalidateSize(), 150);

    return () => {
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      routeLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* تحديث الوجهة إن تغيّرت دون إعادة بناء الخريطة. */
  useEffect(() => {
    mapRef.current?.setView([latitude, longitude], DESTINATION_ZOOM);
  }, [latitude, longitude]);

  const clearRoute = () => {
    routeLayerRef.current?.clearLayers();
    setSummary(null);
    mapRef.current?.setView([latitude, longitude], DESTINATION_ZOOM);
  };

  const drawRoute = async () => {
    if (!navigator.geolocation) {
      toast.error(t("map.locationDenied"));
      return;
    }

    setRouting(true);

    const position = await new Promise<GeolocationPosition | null>((resolve) =>
      navigator.geolocation.getCurrentPosition(
        resolve,
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 12000 },
      ),
    );

    if (!position) {
      setRouting(false);
      toast.error(t("map.locationDenied"));
      return;
    }

    const from = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };

    try {
      const route = await fetchRoute(from, { lat: latitude, lng: longitude });
      const map = mapRef.current;
      const layer = routeLayerRef.current;
      if (!map || !layer) return;

      layer.clearLayers();

      /* خط سميك فاتح تحت الخط الأساسي — يبقى المسار واضحاً فوق البلاطات. */
      L.polyline(route.points, {
        color: "#ffffff",
        weight: 9,
        opacity: 0.9,
      }).addTo(layer);

      L.polyline(route.points, {
        color: "#0f2a24",
        weight: 5,
        opacity: 0.95,
      }).addTo(layer);

      L.marker([from.lat, from.lng], { icon: originIcon })
        .addTo(layer)
        .bindPopup(t("map.youAreHere"));

      map.fitBounds(L.latLngBounds(route.points), {
        padding: [32, 32],
      });

      setSummary(route);
    } catch {
      toast.error(t("map.routeFailed"));
    } finally {
      setRouting(false);
    }
  };

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        ref={containerRef}
        className="h-72 w-full overflow-hidden rounded-[var(--radius-xl2)] border border-basalt-900/10 bg-sand-100"
        style={{ zIndex: 0 }}
        role="application"
        aria-label={title}
      />

      {summary ? (
        <p className="rounded-2xl bg-basalt-400/10 px-4 py-2.5 text-sm font-semibold text-basalt-800">
          {t("map.routeSummary", {
            km: summary.distanceKm.toFixed(1),
            minutes: Math.max(1, Math.round(summary.durationMinutes)),
          })}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {summary ? (
          <Button variant="outline" size="sm" onClick={clearRoute}>
            <X />
            {t("map.hideRoute")}
          </Button>
        ) : (
          <Button size="sm" onClick={() => void drawRoute()} loading={routing}>
            {routing ? null : <Route />}
            {routing ? t("map.routing") : t("map.showRoute")}
          </Button>
        )}

        <Button variant="outline" size="sm" asChild>
          <a href={directionsUrl} target="_blank" rel="noreferrer noopener">
            <Navigation />
            {t("map.openDirections")}
          </a>
        </Button>
      </div>
    </div>
  );
}

/** حالة تحميل أثناء تحميل حزمة الخريطة كسولاً. */
export function LocationMapFallback() {
  return (
    <div className="grid h-72 w-full place-items-center rounded-[var(--radius-xl2)] border border-basalt-900/10 bg-sand-100">
      <Loader2 className="size-6 animate-spin text-basalt-600/50" aria-hidden />
    </div>
  );
}

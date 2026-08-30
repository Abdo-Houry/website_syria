import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, Loader2, MapPin, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale, useT } from "@/i18n/locale-context";
import { cn } from "@/lib/utils";

export interface LatLng {
  lat: number;
  lng: number;
}

/* مركز افتراضي: وسط سوريا تقريباً، حتى تبدأ الخريطة في المنطقة الصحيحة. */
const DEFAULT_CENTER: LatLng = { lat: 34.8021, lng: 38.9968 };
const DEFAULT_ZOOM = 6;
const PICKED_ZOOM = 13;

/**
 * أيقونة العلامة مرسومة كـ SVG مضمَّن.
 * صور leaflet الافتراضية تأتي من مسارات نسبية تنكسر بعد الحزم،
 * والـ divIcon يتجنّب ذلك تماماً.
 */
const markerIcon = L.divIcon({
  className: "",
  html: `
    <span style="
      display:grid;place-items:center;
      width:34px;height:34px;margin:-34px 0 0 -17px;
    ">
      <svg viewBox="0 0 24 24" width="34" height="34" fill="#d9a441" stroke="#0f2a24" stroke-width="1.5">
        <path d="M12 22s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"/>
        <circle cx="12" cy="11" r="2.6" fill="#0f2a24" stroke="none"/>
      </svg>
    </span>`,
  iconSize: [0, 0],
});

interface SearchResult {
  label: string;
  lat: number;
  lng: number;
}

/**
 * البحث عن اسم محافظة أو مكان عبر Nominatim.
 *
 * نُجرّب سوريا أولاً لأن كل محتوى التطبيق سوري، فيعطي «حلب» أو «قلعة الحصن»
 * النتيجة المتوقّعة مباشرة بدل متشابهات من دول أخرى؛ وإن لم نجد شيئاً نُعيد
 * البحث عالمياً حتى لا نمنع إدخال موقع خارج سوريا.
 */
async function geocode(
  query: string,
  language: string,
  signal: AbortSignal,
): Promise<SearchResult[]> {
  const request = async (restrictToSyria: boolean) => {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "8");
    url.searchParams.set("accept-language", language);
    if (restrictToSyria) url.searchParams.set("countrycodes", "sy");

    const response = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("search failed");

    const payload = (await response.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
    }>;

    return payload
      .map((item) => ({
        label: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
      }))
      .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  };

  const local = await request(true);
  return local.length ? local : await request(false);
}

/**
 * منتقي موقع على خريطة — بديل عن إدخال خط العرض والطول يدوياً.
 *
 * البلاطات من OpenStreetMap، والبحث عبر Nominatim. كلاهما يحتاج اتصالاً
 * بالإنترنت؛ عند تعذّره تبقى الخريطة قابلة للنقر إن كانت البلاطات مخزّنة،
 * ويظهر خطأ واضح للبحث.
 */
export function MapPicker({
  value,
  onChange,
  className,
}: {
  value: LatLng | null;
  onChange: (next: LatLng | null) => void;
  className?: string;
}) {
  const t = useT();
  const { locale } = useLocale();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  /* onChange يتغيّر بين الرندرات — نحفظه في ref حتى لا نعيد بناء الخريطة. */
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  /* إنشاء الخريطة مرة واحدة. */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: value ? [value.lat, value.lng] : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
      zoom: value ? PICKED_ZOOM : DEFAULT_ZOOM,
      scrollWheelZoom: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    map.on("click", (event: L.LeafletMouseEvent) => {
      onChangeRef.current({
        lat: Number(event.latlng.lat.toFixed(7)),
        lng: Number(event.latlng.lng.toFixed(7)),
      });
    });

    mapRef.current = map;

    /* الحاوية تُقاس قبل ظهورها داخل الحوار — نجبر إعادة القياس. */
    const timer = window.setTimeout(() => map.invalidateSize(), 120);

    return () => {
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* مزامنة العلامة مع القيمة. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([value.lat, value.lng]);
      return;
    }

    const marker = L.marker([value.lat, value.lng], {
      icon: markerIcon,
      draggable: true,
    }).addTo(map);

    marker.on("dragend", () => {
      const position = marker.getLatLng();
      onChangeRef.current({
        lat: Number(position.lat.toFixed(7)),
        lng: Number(position.lng.toFixed(7)),
      });
    });

    markerRef.current = marker;
  }, [value]);

  const flyTo = useCallback((next: LatLng) => {
    mapRef.current?.flyTo([next.lat, next.lng], PICKED_ZOOM, { duration: 0.6 });
  }, []);

  /* طلب واحد فعّال في كل لحظة — الكتابة السريعة تُلغي ما قبلها. */
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const search = useCallback(
    async (raw: string, { silent = false }: { silent?: boolean } = {}) => {
      const query = raw.trim();
      if (query.length < 2) {
        setResults(null);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSearching(true);

      try {
        const found = await geocode(query, locale, controller.signal);
        if (controller.signal.aborted) return;
        setResults(found);
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        setResults([]);
        if (!silent) toast.error(t("map.searchFailed"));
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    },
    [locale, t],
  );

  /*
    بحث تلقائي أثناء الكتابة مع مهلة قصيرة — Nominatim يطلب عدم تجاوز
    طلب واحد في الثانية، والمهلة تحترم ذلك وتُبقي التجربة فورية.
  */
  useEffect(() => {
    const query = term.trim();
    if (query.length < 2) {
      setResults(null);
      return;
    }

    const timer = window.setTimeout(() => {
      void search(query, { silent: true });
    }, 600);

    return () => window.clearTimeout(timer);
  }, [term, search]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t("map.locationDenied"));
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const next = {
          lat: Number(position.coords.latitude.toFixed(7)),
          lng: Number(position.coords.longitude.toFixed(7)),
        };
        onChangeRef.current(next);
        flyTo(next);
      },
      () => {
        setLocating(false);
        toast.error(t("map.locationDenied"));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/*
        ليس <form>: هذا المنتقي يُستعمل داخل نموذج حوار الإدارة، ونموذج
        داخل نموذج غير صالح في HTML — المتصفح يُسقط الداخلي فيصبح زر البحث
        وزر Enter مُرسِلَين لنموذج المحافظة/المكان بدل تنفيذ البحث.
      */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-basalt-600/45"
            aria-hidden
          />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              event.stopPropagation();
              void search(term);
            }}
            placeholder={t("map.searchPlaceholder")}
            className="h-11 ps-10"
            aria-label={t("map.searchPlaceholder")}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          loading={searching}
          aria-label={t("common.search")}
          onClick={() => void search(term)}
        >
          {searching ? null : <Search />}
        </Button>
      </div>

      {results ? (
        results.length ? (
          <ul className="max-h-44 overflow-y-auto rounded-2xl border border-basalt-900/10 bg-white p-1.5">
            {results.map((result) => (
              <li key={`${result.lat},${result.lng}`}>
                <button
                  type="button"
                  onClick={() => {
                    onChange({ lat: result.lat, lng: result.lng });
                    flyTo(result);
                    setResults(null);
                  }}
                  className="flex w-full items-start gap-2 rounded-xl px-3 py-2 text-start text-xs text-basalt-700 transition-colors hover:bg-sand-100"
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-gold-600" aria-hidden />
                  <span className="line-clamp-2">{result.label}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-sand-100 px-4 py-2.5 text-xs text-basalt-600/75">
            {t("map.noResults")}
          </p>
        )
      ) : null}

      {/* الخريطة */}
      <div
        ref={containerRef}
        className="h-64 w-full overflow-hidden rounded-2xl border border-basalt-900/10 bg-sand-100"
        style={{ zIndex: 0 }}
      />

      <p className="text-xs text-basalt-600/70">{t("map.pickHint")}</p>

      {/* الحالة والإجراءات */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={useMyLocation}
          loading={locating}
        >
          <Crosshair />
          {locating ? t("map.locating") : t("map.myLocation")}
        </Button>

        {value ? (
          <>
            <span
              dir="ltr"
              className="rounded-full bg-sand-100 px-3 py-1.5 text-xs font-semibold tabular-nums text-basalt-800"
            >
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-clay-500 hover:bg-clay-500/10"
              onClick={() => onChange(null)}
            >
              <X />
              {t("map.clear")}
            </Button>
          </>
        ) : (
          <span className="text-xs text-basalt-600/60">{t("map.noLocation")}</span>
        )}
      </div>
    </div>
  );
}

/** حالة تحميل بسيطة عند تحميل الخريطة كسولاً. */
export function MapPickerFallback() {
  return (
    <div className="grid h-64 w-full place-items-center rounded-2xl border border-basalt-900/10 bg-sand-100">
      <Loader2 className="size-6 animate-spin text-basalt-600/50" aria-hidden />
    </div>
  );
}

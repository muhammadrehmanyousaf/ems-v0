"use client";

/**
 * Event-day weather (§M4) — outdoor weddings need the forecast. Lazy-
 * fetches /bookings/:id/weather (which is graceful: returns ok:false
 * when no WEATHER_API_KEY or the date is outside the forecast window).
 * Renders NOTHING unless there's a usable forecast — so it never adds
 * noise. Gated by NEXT_PUBLIC_WEATHER.
 */

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosConfig";
import { CloudRain, CloudSun } from "lucide-react";

interface Forecast {
  date: string; city: string;
  maxTempC: number; minTempC: number;
  condition: string | null; iconUrl: string | null;
  chanceOfRain: number | null; willRain: boolean;
}

export default function EventWeatherChip({ bookingId }: { bookingId: number }) {
  const [fc, setFc] = useState<Forecast | null>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_WEATHER !== "1") return;
    let alive = true;
    axiosInstance
      .get(`/api/v1/bookings/${bookingId}/weather`)
      .then((r) => {
        const data = r.data?.data;
        if (alive && data?.ok && data.forecast) setFc(data.forecast);
      })
      .catch(() => { /* silent — weather is best-effort */ });
    return () => { alive = false; };
  }, [bookingId]);

  if (!fc) return null;

  const rainy = fc.willRain || (fc.chanceOfRain ?? 0) >= 50;
  return (
    <div className={`mt-2 ml-6 flex items-center gap-2 rounded-md border p-2 text-xs ${
      rainy ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"
    }`}>
      {fc.iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fc.iconUrl} alt={fc.condition || "weather"} className="h-7 w-7" />
      ) : rainy ? (
        <CloudRain className="h-5 w-5 text-blue-600" />
      ) : (
        <CloudSun className="h-5 w-5 text-amber-600" />
      )}
      <div className="min-w-0">
        <p className="font-medium text-foreground">
          {fc.condition || "Forecast"} · {Math.round(fc.maxTempC)}° / {Math.round(fc.minTempC)}°C
        </p>
        <p className="text-[11px] text-muted-foreground">
          {fc.city}
          {fc.chanceOfRain != null && ` · ${fc.chanceOfRain}% chance of rain`}
          {rainy && " — plan a backup for outdoor setups"}
        </p>
      </div>
    </div>
  );
}

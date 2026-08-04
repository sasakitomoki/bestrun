"use client";

import { useEffect, useState } from "react";
import type { WeatherData } from "@/lib/weather";

// Advice message based on temperature and weather code.
function runAdvice(temp: number, code: number): { text: string; color: string } {
  if (code >= 95) return { text: "雷雨のため走行は危険です ⚡", color: "text-red-600" };
  if (code >= 61 && code <= 67) return { text: "雨の中のランもいい思い出に 🌧️", color: "text-blue-600" };
  if (code >= 71 && code <= 77) return { text: "積雪に注意して走りましょう ❄️", color: "text-blue-400" };
  if (temp >= 35) return { text: "猛暑日！水分補給をこまめに 🥵", color: "text-red-600" };
  if (temp >= 30) return { text: "真夏日！熱中症に注意 ☀️", color: "text-orange-500" };
  if (temp >= 20) return { text: "気持ちいい気候でのラン日和 😊", color: "text-green-600" };
  if (temp >= 10) return { text: "少し肌寒い。軽く着込んで 🧥", color: "text-blue-500" };
  return { text: "防寒対策をしっかりして 🧤", color: "text-indigo-500" };
}

// Color of the temperature badge.
function tempColor(temp: number): string {
  if (temp >= 35) return "text-red-600";
  if (temp >= 30) return "text-orange-500";
  if (temp >= 20) return "text-green-600";
  if (temp >= 10) return "text-blue-500";
  return "text-indigo-500";
}

export function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: WeatherData) => setWeather(d))
      .catch(() => setError(true));
  }, []);

  if (error) return null;
  if (!weather) {
    return (
      <div className="rounded-xl border border-sap-border bg-white p-4 shadow-sm animate-pulse">
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="mt-2 h-8 w-16 rounded bg-gray-200" />
      </div>
    );
  }

  const advice = runAdvice(weather.temp, weather.code);

  return (
    <div className="rounded-xl border border-sap-border bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-sap-text-mid">
        皇居周辺の現在の天気
      </p>

      <div className="mt-2 flex items-center gap-4">
        <span className="text-5xl" role="img" aria-label={weather.label}>
          {weather.emoji}
        </span>
        <div>
          <p className={`text-4xl font-bold ${tempColor(weather.temp)}`}>
            {weather.temp}°C
          </p>
          <p className="text-sm text-sap-text-mid">{weather.label}</p>
        </div>

        <div className="ml-auto text-right text-sm text-sap-text-mid space-y-0.5">
          <p>体感 {weather.feelsLike}°C</p>
          <p>湿度 {weather.humidity}%</p>
          <p>風速 {weather.windSpeed} km/h</p>
        </div>
      </div>

      <p className={`mt-3 text-sm font-medium ${advice.color}`}>{advice.text}</p>
    </div>
  );
}

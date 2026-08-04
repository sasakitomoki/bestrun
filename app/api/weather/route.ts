import { NextResponse } from "next/server";
import { describeWeather, type WeatherData } from "@/lib/weather";

const LAT = 35.6852;
const LON = 139.7528;

export const revalidate = 1800;

export async function GET() {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m` +
      `&timezone=Asia%2FTokyo`;

    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);

    const json = await res.json();
    const cur = json.current;
    const code: number = cur.weather_code;
    const { label, emoji } = describeWeather(code);

    const data: WeatherData = {
      temp:      Math.round(cur.temperature_2m * 10) / 10,
      feelsLike: Math.round(cur.apparent_temperature * 10) / 10,
      code,
      label,
      emoji,
      windSpeed: Math.round(cur.wind_speed_10m),
      humidity:  cur.relative_humidity_2m,
    };

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "天気の取得に失敗しました。" },
      { status: 502 }
    );
  }
}

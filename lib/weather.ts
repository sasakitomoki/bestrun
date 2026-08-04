export type WeatherData = {
  temp: number;
  feelsLike: number;
  code: number;
  label: string;
  emoji: string;
  windSpeed: number;
  humidity: number;
};

const WMO_LABELS: Record<number, { label: string; emoji: string }> = {
  0:  { label: "快晴",       emoji: "☀️" },
  1:  { label: "晴れ",       emoji: "🌤️" },
  2:  { label: "一部曇り",   emoji: "⛅" },
  3:  { label: "曇り",       emoji: "☁️" },
  45: { label: "霧",         emoji: "🌫️" },
  48: { label: "着氷霧",     emoji: "🌫️" },
  51: { label: "霧雨（弱）", emoji: "🌦️" },
  53: { label: "霧雨",       emoji: "🌦️" },
  55: { label: "霧雨（強）", emoji: "🌧️" },
  61: { label: "小雨",       emoji: "🌧️" },
  63: { label: "雨",         emoji: "🌧️" },
  65: { label: "大雨",       emoji: "🌧️" },
  71: { label: "小雪",       emoji: "🌨️" },
  73: { label: "雪",         emoji: "❄️" },
  75: { label: "大雪",       emoji: "❄️" },
  80: { label: "にわか雨",   emoji: "🌦️" },
  81: { label: "雨（強）",   emoji: "🌧️" },
  82: { label: "暴雨",       emoji: "⛈️" },
  95: { label: "雷雨",       emoji: "⛈️" },
  96: { label: "雷雨＋雹",   emoji: "⛈️" },
  99: { label: "激しい雷雨", emoji: "⛈️" },
};

export function describeWeather(code: number): { label: string; emoji: string } {
  return WMO_LABELS[code] ?? { label: "不明", emoji: "🌡️" };
}

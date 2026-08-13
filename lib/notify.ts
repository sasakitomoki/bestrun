// Email notification helper using Resend REST API (no SDK — plain fetch).
// Sends to tomoki.sasaki@sap.com with a fixed subject that triggers the
// Teams workflow on the receiving end.

const TO = "tomoki.sasaki@sap.com";
const SUBJECT = "The Best Runners teams notification";
const FROM = process.env.NOTIFY_FROM_EMAIL ?? "noreply@bestrunners.app";
const APP_URL = process.env.APP_URL ?? "https://bestrunners.onrender.com";

const DIV = "━━━━━━━━━━━━━━━━━━━━";

async function sendMail(lines: string[]): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[notify] RESEND_API_KEY not set, skipping notification.");
    return;
  }

  const html = `<p>${lines.join("<br>")}</p>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from: FROM, to: [TO], subject: SUBJECT, html }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[notify] Resend error:", res.status, text);
  }
}

// --- Notification functions ---

// #1 走破申請が届いた（グループ）
export async function notifyRunSubmitted(params: {
  runnerName: string;
  approverName: string;
  laps: number;
  km: number;
  date: string; // YYYY-MM-DD
}): Promise<void> {
  const { runnerName, approverName, laps, km, date } = params;
  await sendMail([
    `🏃 <b>承認依頼が届いています！</b>`,
    DIV,
    `👤 申請者：<b>${runnerName}</b> さん`,
    `📋 内容：${laps}周 (${km}km)　📆 ${date}`,
    ``,
    `${approverName} さん、マイページから確認をお願いします！`,
    DIV,
    `👉 <a href="${APP_URL}/mypage">マイページで確認する</a>`,
  ]);
}

// #3 バッジ獲得（グループ）
export async function notifyBadgeEarned(params: {
  userName: string;
  badges: { icon: string; name: string }[];
}): Promise<void> {
  const { userName, badges } = params;
  await sendMail([
    `🎖️ <b>新バッジを獲得しました！</b>`,
    DIV,
    `🎉 <b>${userName}</b> さん、おめでとうございます！`,
    ``,
    ...badges.map((b) => `　${b.icon}『${b.name}』`),
    DIV,
    `👉 <a href="${APP_URL}/mypage">マイページで確認する</a>`,
  ]);
}

// #4 首位交代（グループ・1日1回制限はDBで管理）
export async function notifyRankingChanged(params: {
  newLeaderName: string;
  laps: number;
}): Promise<void> {
  const { newLeaderName, laps } = params;
  await sendMail([
    `🥇 <b>首位が交代しました！</b>`,
    DIV,
    `👑 <b>${newLeaderName}</b> さんが今月のトップに立ちました！`,
    `🏃 累計：<b>${laps}周</b>`,
    DIV,
    `👉 <a href="${APP_URL}/ranking">ランキングを見る</a>`,
  ]);
}

// #5/#6 気温バッジ狙い通知（グループ・朝1回）
export async function notifyBadgeWeather(params: {
  temp: number;
  badge: { icon: string; name: string };
}): Promise<void> {
  const { temp, badge } = params;
  const ishot = temp >= 35;
  await sendMail([
    `${badge.icon} <b>今日の皇居は ${temp}℃！</b>`,
    DIV,
    `🏅 走れば ${badge.icon}『${badge.name}』バッジが狙えます`,
    ``,
    ishot ? `💧 熱中症対策を万全に！水分補給をこまめに。` : `🧤 防寒対策をしっかりと！`,
    DIV,
    `👉 <a href="${APP_URL}">ランを記録する</a>`,
  ]);
}

// #7 月間ランキング確定（グループ・月1回）
export async function notifyMonthlyRanking(params: {
  month: string; // e.g. "8月"
  top: { rank: number; name: string; laps: number; km: number }[];
}): Promise<void> {
  const { month, top } = params;
  const medals = ["🥇", "🥈", "🥉"];
  await sendMail([
    `🏆 <b>${month}ランキング確定！</b>`,
    DIV,
    ...top.slice(0, 3).map((u) => `${medals[u.rank - 1]} ${u.name}　${u.laps}周 (${u.km}km)`),
    DIV,
    `👉 <a href="${APP_URL}/ranking">フル結果はこちら</a>`,
  ]);
}

// #8 イベント追加（グループ）
export async function notifyEventCreated(params: {
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  description: string | null;
}): Promise<void> {
  const { title, date, startTime, endTime, location, description } = params;

  const d = new Date(date);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const dateLabel = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
  const timeLabel = startTime
    ? `${startTime}${endTime ? `〜${endTime}` : "〜"}`
    : null;

  await sendMail([
    `📅 <b>新しいイベントが追加されました！</b>`,
    DIV,
    `🏃 <b>${title}</b>`,
    ``,
    `🗓 ${dateLabel}${timeLabel ? `　${timeLabel}` : ""}`,
    ...(location ? [`📍 ${location}`] : []),
    ...(description ? [``, `💬 ${description.replace(/\n/g, "<br>　　")}`] : []),
    DIV,
    `👉 <a href="${APP_URL}">詳細・参加登録はこちら</a>`,
  ]);
}

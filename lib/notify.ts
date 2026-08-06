// Email notification helper using Resend REST API (no SDK — plain fetch).
// Sends to tomoki.sasaki@sap.com with a fixed subject that triggers the
// Teams workflow on the receiving end.

const TO = "tomoki.sasaki@sap.com";
const SUBJECT = "The Best Runners teams notification";
const FROM = process.env.NOTIFY_FROM_EMAIL ?? "noreply@bestrunners.app";
const APP_URL = process.env.APP_URL ?? "https://bestrunners.onrender.com";

async function sendMail(html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // No key configured — log and skip silently so the app still works.
    console.warn("[notify] RESEND_API_KEY not set, skipping notification.");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      subject: SUBJECT,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[notify] Resend error:", res.status, text);
  }
}

// Plain-text-like HTML so the Teams workflow can parse the body easily.
function wrap(lines: string[]): string {
  return `<p>${lines.join("<br>")}</p>`;
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
  await sendMail(wrap([
    `🏃 ${runnerName}さんが${approverName}さんに承認依頼を送りました`,
    `　${laps}周 (${km}km) / ${date}`,
    `　${approverName}さん、マイページから確認をお願いします！`,
    `　👉 ${APP_URL}/mypage`,
  ]));
}

// #2 承認が完了した（グループ）
export async function notifyRunApproved(params: {
  approverName: string;
  runnerName: string;
  laps: number;
  km: number;
  totalLaps: number;
}): Promise<void> {
  const { approverName, runnerName, laps, km, totalLaps } = params;
  await sendMail(wrap([
    `✅ ${approverName}さんが承認！${runnerName}さんの${laps}周 (${km}km) が記録されました`,
    `　今月の累計：${totalLaps}周`,
    `　👉 ${APP_URL}/ranking`,
  ]));
}

// #3 バッジ獲得（グループ）
export async function notifyBadgeEarned(params: {
  userName: string;
  badges: { icon: string; name: string }[];
}): Promise<void> {
  const { userName, badges } = params;
  const badgeLines = badges.map((b) => `　${b.icon}『${b.name}』`);
  await sendMail(wrap([
    `🎖️ ${userName}さんが新バッジを獲得しました！`,
    ...badgeLines,
    `　👉 ${APP_URL}/mypage`,
  ]));
}

// #4 首位交代（グループ・1日1回制限はDBで管理）
export async function notifyRankingChanged(params: {
  newLeaderName: string;
  laps: number;
}): Promise<void> {
  const { newLeaderName, laps } = params;
  await sendMail(wrap([
    `🥇 ${newLeaderName}さんが今月の首位に立ちました！(${laps}周)`,
    `　追いかけよう 👉 ${APP_URL}/ranking`,
  ]));
}

// #5/#6 気温バッジ狙い通知（グループ・朝1回）
export async function notifyBadgeWeather(params: {
  temp: number;
  badge: { icon: string; name: string };
}): Promise<void> {
  const { temp, badge } = params;
  const ishot = temp >= 35;
  await sendMail(wrap([
    `${badge.icon} 今日の皇居は ${temp}℃！`,
    `　走れば ${badge.icon}『${badge.name}』バッジが狙えます`,
    `　${ishot ? "熱中症対策を万全に！💧" : "防寒対策をしっかりと！🧤"}`,
    `　👉 ${APP_URL}`,
  ]));
}

// #7 月間ランキング確定（グループ・月1回）
export async function notifyMonthlyRanking(params: {
  month: string; // e.g. "8月"
  top: { rank: number; name: string; laps: number; km: number }[];
}): Promise<void> {
  const { month, top } = params;
  const lines = top.slice(0, 3).map(
    (u) => `　${["🥇","🥈","🥉"][u.rank - 1]} ${u.name} ${u.laps}周 (${u.km}km)`
  );
  await sendMail(wrap([
    `🏆 ${month}ランキング確定！`,
    ...lines,
    `　フル結果はこちら 👉 ${APP_URL}/ranking`,
  ]));
}

// #8 イベント追加（グループ）
export async function notifyEventCreated(params: {
  title: string;
  date: string;       // ISO string
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  description: string | null;
}): Promise<void> {
  const { title, date, startTime, endTime, location, description } = params;

  const d = new Date(date);
  const days = ["日","月","火","水","木","金","土"];
  const dateLabel = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
  const timeLabel = startTime
    ? `${startTime}${endTime ? `〜${endTime}` : "〜"}`
    : null;

  const lines = [
    `📅 新しいイベントが追加されました！`,
    ``,
    `　${title}`,
    `　${dateLabel}${timeLabel ? `　${timeLabel}` : ""}`,
    location    ? `　📍 ${location}` : null,
    description ? `　${description}` : null,
    ``,
    `　👉 詳細・参加登録はこちら：${APP_URL}`,
  ].filter((l): l is string => l !== null);

  await sendMail(wrap(lines));
}

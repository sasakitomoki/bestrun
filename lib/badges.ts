export type BadgeId =
  | "first_step"
  | "rookie"
  | "veteran"
  | "legend"
  | "master"
  | "summer_warrior"
  | "heat_god"
  | "cold_runner"
  | "ice_warrior"
  | "long_runner";

export type Badge = {
  id: BadgeId;
  icon: string;
  name: string;
  description: string;
};

export const BADGES: Badge[] = [
  { id: "first_step",     icon: "👟", name: "ファーストステップ", description: "初めて1回承認された" },
  { id: "rookie",         icon: "🏅", name: "ルーキー",           description: "累計5周達成" },
  { id: "veteran",        icon: "🥈", name: "ベテラン",           description: "累計20周達成" },
  { id: "legend",         icon: "🥇", name: "レジェンド",         description: "累計30周達成" },
  { id: "master",         icon: "🏆", name: "皇居マスター",       description: "累計50周達成" },
  { id: "summer_warrior", icon: "🔥", name: "炎のランナー",       description: "30℃以上で承認" },
  { id: "heat_god",       icon: "☀️", name: "猛暑の覇者",         description: "35℃以上で承認" },
  { id: "cold_runner",    icon: "🧊", name: "寒冷地ランナー",     description: "10℃以下で承認" },
  { id: "ice_warrior",    icon: "❄️", name: "氷の戦士",           description: "5℃以下で承認" },
  { id: "long_runner",    icon: "💪", name: "ロングランナー",     description: "1回の申請で5周以上" },
];

export const BADGE_MAP = Object.fromEntries(
  BADGES.map((b) => [b.id, b])
) as Record<BadgeId, Badge>;

type EvalInput = {
  totalApprovedRuns: number;  // 承認済みラン数（今回の分含む）
  totalLaps: number;          // 累計承認済み周回数（今回の分含む）
  currentLaps: number;        // 今回のランの周回数
  weatherTemp: number | null; // 今回のランの気温（null = データなし）
};

// Returns badge IDs that should be awarded given the current state.
// Caller is responsible for filtering out already-earned badges.
export function evaluateBadges(input: EvalInput): BadgeId[] {
  const earned: BadgeId[] = [];
  const { totalApprovedRuns, totalLaps, currentLaps, weatherTemp } = input;

  // First approval ever
  if (totalApprovedRuns === 1) earned.push("first_step");

  // Cumulative laps milestones
  if (totalLaps >= 5)  earned.push("rookie");
  if (totalLaps >= 20) earned.push("veteran");
  if (totalLaps >= 30) earned.push("legend");
  if (totalLaps >= 50) earned.push("master");

  // Single-run distance
  if (currentLaps >= 5) earned.push("long_runner");

  // Temperature-based (skip if no data)
  if (weatherTemp !== null) {
    if (weatherTemp >= 30) earned.push("summer_warrior");
    if (weatherTemp >= 35) earned.push("heat_god");
    if (weatherTemp <= 10) earned.push("cold_runner");
    if (weatherTemp <= 5)  earned.push("ice_warrior");
  }

  return earned;
}

// Backfill auto-generated avatars for users who have no photo set.
// Run once after deploying: node scripts/backfill-avatars.js

const { PrismaClient } = require("@prisma/client");
const { generateAvatarDataUrl } = require("../lib/avatar");

// lib/avatar.ts is TypeScript — require won't work directly.
// Re-implement the minimal logic here for the plain JS script.
const PALETTE = [
  "#0070F2","#E76500","#D20A0A","#6A1B9A","#0E7C59",
  "#C87400","#1565C0","#2E7D32","#AD1457","#00838F",
];
function colorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
function makeAvatar(name) {
  const initial = [...name][0] ?? "?";
  const bg = colorForName(name);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">`,
    `<circle cx="64" cy="64" r="64" fill="${bg}"/>`,
    `<text x="64" y="64" dy="0.35em" text-anchor="middle"`,
    ` font-family="72,Arial,Helvetica,sans-serif"`,
    ` font-weight="bold" font-size="60" fill="#ffffff">${initial}</text>`,
    `</svg>`,
  ].join("");
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const p = new PrismaClient();

p.user.findMany({ select: { id: true, name: true, photo: true } })
  .then(async (users) => {
    const targets = users.filter((u) => !u.photo);
    if (targets.length === 0) {
      console.log("全ユーザーに写真が設定されています。更新不要。");
      return;
    }
    for (const u of targets) {
      await p.user.update({
        where: { id: u.id },
        data: { photo: makeAvatar(u.name) },
      });
      console.log(`更新: ${u.name}`);
    }
    console.log(`完了: ${targets.length}件`);
  })
  .catch((e) => console.error(e.message))
  .finally(() => p.$disconnect());

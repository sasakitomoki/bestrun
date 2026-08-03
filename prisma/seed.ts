import { PrismaClient, RunStatus } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

// Small inline SVG avatars encoded as Base64 data URLs so the seed has no
// external image dependencies.
function avatar(bg: string, initial: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="${bg}"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="sans-serif" font-size="64" fill="#ffffff">${initial}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

// Build a Date at noon UTC to avoid timezone edge cases around month boundaries.
function dateFor(year: number, month1to12: number, day: number): Date {
  return new Date(Date.UTC(year, month1to12 - 1, day, 12, 0, 0));
}

async function main() {
  console.log("Seeding database...");

  // Reset in FK-safe order.
  await prisma.run.deleteMany();
  await prisma.user.deleteMany();

  const [taro, hanako, ken] = await Promise.all([
    prisma.user.create({
      data: { name: "たろう", photo: avatar("#166534", "太"), passwordHash: hashSync("password123", 10) },
    }),
    prisma.user.create({
      data: { name: "はなこ", photo: avatar("#b91c1c", "花"), passwordHash: hashSync("password123", 10) },
    }),
    prisma.user.create({
      data: { name: "けん", photo: avatar("#1d4ed8", "健"), passwordHash: hashSync("password123", 10) },
    }),
  ]);

  // Current month (relative to seed run) plus two prior months.
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1; // 1-12

  function prevMonth(offset: number): { year: number; month: number } {
    const d = new Date(Date.UTC(y, m - 1 - offset, 1));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
  }

  const cur = { year: y, month: m };
  const last = prevMonth(1);
  const twoAgo = prevMonth(2);

  type SeedRun = {
    runner: string;
    approver: string;
    when: { year: number; month: number };
    day: number;
    laps: number;
    status: RunStatus;
  };

  const runs: SeedRun[] = [
    // --- Current month (approved -> counts in ranking) ---
    { runner: taro.id, approver: hanako.id, when: cur, day: 2, laps: 3, status: "APPROVED" },
    { runner: taro.id, approver: ken.id, when: cur, day: 9, laps: 2, status: "APPROVED" },
    { runner: hanako.id, approver: taro.id, when: cur, day: 3, laps: 4, status: "APPROVED" },
    { runner: ken.id, approver: hanako.id, when: cur, day: 5, laps: 1, status: "APPROVED" },
    // Pending requests addressed to different approvers (show up in inbox / badge).
    { runner: hanako.id, approver: ken.id, when: cur, day: 12, laps: 2, status: "PENDING" },
    { runner: ken.id, approver: taro.id, when: cur, day: 14, laps: 3, status: "PENDING" },
    { runner: taro.id, approver: hanako.id, when: cur, day: 15, laps: 1, status: "PENDING" },

    // --- Last month ---
    { runner: taro.id, approver: hanako.id, when: last, day: 6, laps: 5, status: "APPROVED" },
    { runner: hanako.id, approver: ken.id, when: last, day: 8, laps: 3, status: "APPROVED" },
    { runner: hanako.id, approver: taro.id, when: last, day: 20, laps: 2, status: "APPROVED" },
    { runner: ken.id, approver: taro.id, when: last, day: 11, laps: 4, status: "APPROVED" },

    // --- Two months ago ---
    { runner: taro.id, approver: ken.id, when: twoAgo, day: 4, laps: 2, status: "APPROVED" },
    { runner: hanako.id, approver: taro.id, when: twoAgo, day: 18, laps: 6, status: "APPROVED" },
    { runner: ken.id, approver: hanako.id, when: twoAgo, day: 25, laps: 3, status: "APPROVED" },
  ];

  await prisma.run.createMany({
    data: runs.map((r) => ({
      runnerId: r.runner,
      approverId: r.approver,
      date: dateFor(r.when.year, r.when.month, r.day),
      laps: r.laps,
      status: r.status,
    })),
  });

  console.log(`Seeded ${runs.length} runs for 3 users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

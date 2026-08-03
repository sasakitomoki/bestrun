const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

p.user.findMany({ select: { name: true, passwordHash: true } })
  .then((users) => {
    console.log("=== ユーザーのパスワード状態 ===");
    users.forEach((u) => {
      // ダミーhash（マイグレーション時のデフォルト値）かどうか判定
      const isDummy = u.passwordHash === "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345";
      console.log(`${u.name}: ${isDummy ? "⚠️  ダミーhash（ログイン不可）" : "✅ 正規のhash"}`);
    });
  })
  .catch((e) => console.error(e.message))
  .finally(() => p.$disconnect());

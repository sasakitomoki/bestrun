# 皇居ラン ランキング (Kokyo Run)

皇居ランの周回数を登録・承認し、月間ランキングとして可視化する Web アプリケーションです。
各ユーザーが走破申請を行い、指定した承認者が承認すると、その実績が月間ランキングに集計されます。

## 主な機能

- **簡易ログイン**：登録済みユーザーを選択してログイン状態を切り替え（プロトタイプ用）
- **新規ユーザー登録**：ユーザー名（ユニーク制約）＋顔写真（アップロード → Base64 / 外部 URL）
- **走破申請**：日付・周回数（1周＝約5km、推定距離をリアルタイム表示）・承認者を指定
- **承認管理**：自分宛ての未承認申請の一覧、承認 / 否認、承認待ち件数バッジ
- **月間ランキング**：承認済み周回数を集計し、棒グラフ（recharts）と順位リストで表示。過去12ヶ月を月選択で切替

## 技術スタック

| 分類 | 使用技術 |
| --- | --- |
| フレームワーク | Next.js 14 (App Router, TypeScript) |
| スタイリング | Tailwind CSS |
| DB / ORM | PostgreSQL + Prisma ORM |
| UI / アイコン / グラフ | lucide-react, recharts |
| 画像処理 | Base64 (data URL) を DB 保存、または外部 URL |

## ローカル開発

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、`DATABASE_URL` をローカルの PostgreSQL に合わせて設定します。

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kokyo_run?schema=public"
```

### 3. データベースのマイグレーションとシード

```bash
npx prisma generate
npx prisma migrate dev --name init   # 初回はマイグレーションを作成
npm run seed                         # テストデータ（ユーザー3名＋実績）を投入
```

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 を開きます。

## Render.com へのデプロイ（Blueprint）

本リポジトリには `render.yaml`（Infrastructure as Code）が含まれており、Web Service と PostgreSQL を自動構築できます。

### 手順

1. 本プロジェクトを GitHub（または GitLab）リポジトリに push します。
2. Render ダッシュボードで **New → Blueprint** を選択します。
3. 対象のリポジトリを接続すると、`render.yaml` が自動的に読み込まれ、以下が作成されます：
   - **PostgreSQL**：`kokyo-run-db`
   - **Web Service**：`kokyo-run`（`DATABASE_URL` は DB から自動注入）
4. **Apply** をクリックするとビルドが開始します。ビルド時に以下が実行されます：

   ```
   npm install && npx prisma generate && npx prisma migrate deploy && npm run build
   ```

   起動コマンドは `npm start` です。
5. デプロイ完了後、発行された URL にアクセスします。

### デプロイ後のシード（任意）

初期テストデータを投入する場合は、Web Service の **Shell** から実行します：

```bash
npm run seed
```

> **補足**：`prisma migrate deploy` は `prisma/migrations/` にコミット済みのマイグレーションを適用します。
> ローカルで `npx prisma migrate dev` を実行してマイグレーションを生成・コミットしてから push してください。

## 画像の扱いについて

Render の無料プランでは永続ストレージを使わないため、顔写真は **Base64 データURL として DB に保存**（アップロード時にクライアント側で 256px に縮小）するか、**外部画像 URL** を指定する方式にしています。

## ディレクトリ構成

```
app/
  api/            # API Route (users, runs, approvals, ranking)
  login/          # 簡易ログイン
  register/       # 新規登録
  mypage/         # マイページ（申請・承認・履歴）
  ranking/        # 月間ランキング
components/        # Avatar, NavBar, RunForm, ApprovalInbox, MyRuns
lib/               # prisma クライアント, 距離・月ユーティリティ, セッション
prisma/
  schema.prisma    # PostgreSQL スキーマ
  seed.ts          # シードスクリプト
render.yaml        # Render Blueprint
```

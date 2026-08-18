"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Upload, Mail, KeyRound } from "lucide-react";
import { useSession } from "@/lib/session";
import { Avatar } from "@/components/Avatar";

function fileToResizedDataUrl(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("画像の読み込みに失敗しました。"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("画像を解析できませんでした。"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("画像処理に失敗しました。"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function RegisterPage() {
  const { login } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoData, setPhotoData] = useState<string | null>(null);

  // Step 2
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectivePhoto = photoData ?? (photoUrl.trim() || null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setPhotoData(dataUrl);
      setPhotoUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "画像処理に失敗しました。");
    }
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("ユーザー名を入力してください。"); return; }
    if (!email.trim()) { setError("メールアドレスを入力してください。"); return; }
    if (!email.toLowerCase().endsWith("@sap.com")) {
      setError("メールアドレスは @sap.com のドメインのみ使用できます。");
      return;
    }
    if (password.length < 6) { setError("パスワードは6文字以上で入力してください。"); return; }
    if (password !== passwordConfirm) { setError("パスワードが一致しません。"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, photo: effectivePhoto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "送信に失敗しました。");
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (otp.length !== 6) { setError("6桁の認証コードを入力してください。"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "認証に失敗しました。");
      login({ id: data.id, name: data.name, photo: data.photo });
      router.push("/mypage");
    } catch (err) {
      setError(err instanceof Error ? err.message : "認証に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <UserPlus className="mx-auto mb-2 text-brand" size={32} />
        <h1 className="text-2xl font-bold">新規ユーザー登録</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        <div className={`flex-1 rounded-full h-1.5 ${step >= 1 ? "bg-sap-blue" : "bg-gray-200"}`} />
        <span className="text-xs text-gray-400">1</span>
        <div className={`flex-1 rounded-full h-1.5 ${step >= 2 ? "bg-sap-blue" : "bg-gray-200"}`} />
        <span className="text-xs text-gray-400">2</span>
        <div className="flex-1 rounded-full h-1.5 bg-gray-200" />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {step === 1 ? (
        <form
          onSubmit={handleStep1}
          className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            <Mail size={16} /> ステップ 1 — アカウント情報を入力
          </p>

          <div className="flex flex-col items-center gap-3">
            <Avatar photo={effectivePhoto} name={name} size={96} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Upload size={16} />
              顔写真をアップロード
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ユーザー名（重複不可）</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              autoComplete="username"
              placeholder="例: たろう"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              メールアドレス <span className="text-xs text-gray-400">（@sap.com のみ）</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="yourname@sap.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">パスワード（6文字以上）</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="6文字以上"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">パスワード（確認）</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="もう一度入力してください"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">または画像URLを指定</label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => { setPhotoUrl(e.target.value); setPhotoData(null); }}
              placeholder="https://example.com/photo.jpg"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {submitting ? "送信中..." : "認証コードを送信 →"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleStep2}
          className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            <KeyRound size={16} /> ステップ 2 — メール認証
          </p>
          <p className="text-sm text-gray-500">
            <b>{email}</b> に6桁の認証コードを送りました。メールを確認してください。
          </p>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">認証コード（6桁）</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full rounded-lg border border-gray-300 px-3 py-4 text-center text-2xl tracking-widest font-bold focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || otp.length !== 6}
            className="w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {submitting ? "確認中..." : "登録してログイン"}
          </button>

          <button
            type="button"
            onClick={() => { setStep(1); setOtp(""); setError(null); }}
            className="w-full text-sm text-gray-400 hover:text-gray-600"
          >
            ← 最初からやり直す
          </button>
        </form>
      )}

      <p className="text-center text-sm text-gray-500">
        既に登録済みですか？{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { Pencil, Upload, X, Check } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useSession, type SessionUser } from "@/lib/session";

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

export function EditProfile({ currentUser }: { currentUser: SessionUser }) {
  const { login } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState(currentUser.photo ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectivePhoto = photoData ?? (photoUrl.trim() || null);

  function handleOpen() {
    setName(currentUser.name);
    setPhotoData(null);
    setPhotoUrl(currentUser.photo ?? "");
    setError(null);
    setOpen(true);
  }

  function handleCancel() {
    setOpen(false);
    setError(null);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      setPhotoData(await fileToResizedDataUrl(file));
      setPhotoUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "画像処理に失敗しました。");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), photo: effectivePhoto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "更新に失敗しました。");
      // Sync session so NavBar and header reflect the new name/photo immediately.
      login({ id: data.id, name: data.name, photo: data.photo });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        <Pencil size={14} />
        プロフィール編集
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 w-full space-y-4 rounded-xl border border-brand/30 bg-green-50 p-5"
    >
      <h3 className="font-bold text-brand-dark">プロフィール編集</h3>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {/* Photo preview + upload */}
      <div className="flex items-center gap-4">
        <Avatar photo={effectivePhoto} name={name} size={72} />
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Upload size={14} />
            写真を変更
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <div>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => { setPhotoUrl(e.target.value); setPhotoData(null); }}
              placeholder="または画像URLを入力"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          ユーザー名
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          <Check size={16} />
          {submitting ? "保存中..." : "保存"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-600 hover:bg-gray-50"
        >
          <X size={16} />
          キャンセル
        </button>
      </div>
    </form>
  );
}

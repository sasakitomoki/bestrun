"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Pencil, Upload, X, Check, ZoomIn, ZoomOut } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useSession, type SessionUser } from "@/lib/session";

const OUTPUT_SIZE = 256; // Final image px

// Render scaled+offset image onto a square canvas and return JPEG data URL.
function cropToDataUrl(
  img: HTMLImageElement,
  scale: number,
  offsetX: number,
  offsetY: number
): string {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d")!;
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, offsetX, offsetY, w, h);
  return canvas.toDataURL("image/jpeg", 0.85);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Image cropper sub-component: drag + zoom on a square viewport.
function ImageCropper({
  src,
  onCropped,
}: {
  src: string;
  onCropped: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);

  // Load image and initialize scale to fill the viewport.
  useEffect(() => {
    loadImage(src).then((img) => {
      imgRef.current = img;
      const fitScale = Math.max(
        OUTPUT_SIZE / img.naturalWidth,
        OUTPUT_SIZE / img.naturalHeight
      );
      const initialX = (OUTPUT_SIZE - img.naturalWidth * fitScale) / 2;
      const initialY = (OUTPUT_SIZE - img.naturalHeight * fitScale) / 2;
      setScale(fitScale);
      setOffset({ x: initialX, y: initialY });
      setReady(true);
    });
  }, [src]);

  // Redraw on every state change.
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !ready) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.drawImage(img, offset.x, offset.y, img.naturalWidth * scale, img.naturalHeight * scale);
    // Emit updated crop.
    onCropped(canvas.toDataURL("image/jpeg", 0.85));
  }, [scale, offset, ready, onCropped]);

  function clampOffset(x: number, y: number, s: number) {
    const img = imgRef.current!;
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    return {
      x: Math.min(0, Math.max(OUTPUT_SIZE - w, x)),
      y: Math.min(0, Math.max(OUTPUT_SIZE - h, y)),
    };
  }

  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current || !imgRef.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => clampOffset(prev.x + dx, prev.y + dy, scale));
  }

  function onMouseUp() { dragging.current = false; }

  function onTouchStart(e: React.TouchEvent) {
    dragging.current = true;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current || !imgRef.current) return;
    const dx = e.touches[0].clientX - lastPos.current.x;
    const dy = e.touches[0].clientY - lastPos.current.y;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setOffset((prev) => clampOffset(prev.x + dx, prev.y + dy, scale));
  }

  function handleScale(newScale: number) {
    if (!imgRef.current) return;
    const minScale = Math.max(
      OUTPUT_SIZE / imgRef.current.naturalWidth,
      OUTPUT_SIZE / imgRef.current.naturalHeight
    );
    const clamped = Math.max(minScale, Math.min(4, newScale));
    setScale(clamped);
    setOffset((prev) => clampOffset(prev.x, prev.y, clamped));
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={OUTPUT_SIZE}
        height={OUTPUT_SIZE}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onMouseUp}
        className="block rounded-full border-2 border-sap-blue cursor-grab active:cursor-grabbing"
        style={{ width: 128, height: 128, touchAction: "none" }}
      />
      <div className="flex items-center gap-2">
        <ZoomOut size={14} className="text-gray-500 shrink-0" />
        <input
          type="range"
          min={50}
          max={400}
          step={1}
          value={Math.round(scale * 100)}
          onChange={(e) => handleScale(Number(e.target.value) / 100)}
          className="flex-1 accent-sap-blue"
        />
        <ZoomIn size={14} className="text-gray-500 shrink-0" />
      </div>
      <p className="text-xs text-gray-400">ドラッグで位置調整・スライダーで拡大縮小</p>
    </div>
  );
}

export function EditProfile({ currentUser }: { currentUser: SessionUser }) {
  const { login } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [rawSrc, setRawSrc] = useState<string | null>(null);   // original file src for cropper
  const [photoData, setPhotoData] = useState<string | null>(null); // cropped output
  const [photoUrl, setPhotoUrl] = useState(currentUser.photo ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectivePhoto = rawSrc
    ? photoData   // show cropped result when editing
    : photoUrl.trim() || null;

  function handleOpen() {
    setName(currentUser.name);
    setRawSrc(null);
    setPhotoData(null);
    setPhotoUrl(currentUser.photo ?? "");
    setError(null);
    setOpen(true);
  }

  function handleCancel() {
    setOpen(false);
    setRawSrc(null);
    setPhotoData(null);
    setError(null);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setRawSrc(reader.result as string);
      setPhotoUrl("");
    };
    reader.onerror = () => setError("画像の読み込みに失敗しました。");
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected.
    e.target.value = "";
  }

  const handleCropped = useCallback((dataUrl: string) => {
    setPhotoData(dataUrl);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const photo = rawSrc ? photoData : (photoUrl.trim() || null);
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), photo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "更新に失敗しました。");
      login({ id: data.id, name: data.name, photo: data.photo });
      setOpen(false);
      setRawSrc(null);
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
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        <Pencil size={14} />
        プロフィール編集
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 w-full space-y-4 rounded-xl border border-sap-blue/20 bg-sap-blue-light p-5"
    >
      <h3 className="font-bold text-sap-text-dark">プロフィール編集</h3>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {/* Photo section */}
      <div className="flex flex-wrap items-start gap-4">
        {rawSrc ? (
          <ImageCropper src={rawSrc} onCropped={handleCropped} />
        ) : (
          <Avatar photo={effectivePhoto} name={name} size={96} />
        )}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Upload size={14} />
            {rawSrc ? "別の写真を選ぶ" : "写真を変更"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          {!rawSrc && (
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => { setPhotoUrl(e.target.value); setPhotoData(null); }}
              placeholder="または画像URLを入力"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-sap-blue focus:outline-none focus:ring-1 focus:ring-sap-blue"
            />
          )}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">ユーザー名</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-sap-blue focus:outline-none focus:ring-1 focus:ring-sap-blue"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sap-blue px-4 py-2 font-semibold text-white hover:bg-sap-blue-dark disabled:opacity-50"
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

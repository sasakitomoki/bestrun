"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, PlusCircle, ClipboardList, Pencil, Check, X } from "lucide-react";
import { useSession } from "@/lib/session";
import { isOwner } from "@/lib/owner";

type Post = {
  id: string;
  title: string;
  body: string;
  photo: string | null;
  authorName: string;
  createdAt: string;
  updatedAt: string;
};

function fileToResizedDataUrl(file: File, max = 800): Promise<string> {
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
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("画像処理に失敗しました。"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function PostForm({
  userName,
  onPosted,
  onCancel,
}: {
  userName: string;
  onPosted: (post: Post) => void;
  onCancel: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { setPhotoData(await fileToResizedDataUrl(file)); }
    catch (err) { setError(err instanceof Error ? err.message : "画像処理に失敗しました。"); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError("見出しを入力してください。"); return; }
    if (!body.trim()) { setError("コメントを入力してください。"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterName: userName, title: title.trim(), body: body.trim(), photo: photoData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onPosted(data.post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "投稿に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-sap-border bg-white p-5 shadow-sm">
      {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-600">見出し</label>
        <input
          type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
          placeholder="見出しを入力"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sap-blue focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-600">コメント</label>
        <textarea
          value={body} onChange={(e) => setBody(e.target.value)} rows={4}
          placeholder="コメントを入力"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sap-blue focus:outline-none resize-none"
        />
      </div>
      <div>
        {photoData ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoData} alt="preview" className="max-h-40 rounded-lg object-cover" />
            <button type="button" onClick={() => setPhotoData(null)}
              className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70">
              <Trash2 size={12} />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <Upload size={15} /> 写真を追加（任意）
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={submitting}
          className="flex-1 rounded-lg bg-sap-blue py-2.5 text-sm font-bold text-white hover:bg-sap-blue-dark disabled:opacity-50">
          {submitting ? "投稿中..." : "投稿する"}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
          キャンセル
        </button>
      </div>
    </form>
  );
}

function EditForm({
  post,
  userName,
  onSaved,
  onCancel,
}: {
  post: Post;
  userName: string;
  onSaved: (post: Post) => void;
  onCancel: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  const [photoData, setPhotoData] = useState<string | null>(post.photo);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { setPhotoData(await fileToResizedDataUrl(file)); }
    catch (err) { setError(err instanceof Error ? err.message : "画像処理に失敗しました。"); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError("見出しを入力してください。"); return; }
    if (!body.trim()) { setError("コメントを入力してください。"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterName: userName, title: title.trim(), body: body.trim(), photo: photoData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved(data.post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4">
      {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <input
        type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold focus:border-sap-blue focus:outline-none"
      />
      <textarea
        value={body} onChange={(e) => setBody(e.target.value)} rows={4}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sap-blue focus:outline-none resize-none"
      />
      <div>
        {photoData ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoData} alt="preview" className="max-h-40 rounded-lg object-cover" />
            <button type="button" onClick={() => setPhotoData(null)}
              className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70">
              <X size={12} />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <Upload size={15} /> 写真を追加
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sap-blue px-4 py-2 text-sm font-bold text-white hover:bg-sap-blue-dark disabled:opacity-50">
          <Check size={14} /> {submitting ? "保存中..." : "保存"}
        </button>
        <button type="button" onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          <X size={14} /> キャンセル
        </button>
      </div>
    </form>
  );
}

export default function BoardPage() {
  const { user } = useSession();
  const owner = user ? isOwner(user.name) : false;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function canEdit(post: Post) {
    if (!user) return false;
    return post.authorName === user.name || owner;
  }

  async function handleDelete(id: string) {
    if (!user || !confirm("この投稿を削除しますか？")) return;
    await fetch(`/api/posts/${id}?requesterName=${encodeURIComponent(user.name)}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between rounded-xl border border-sap-border bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-sap-text-dark">
          <ClipboardList size={18} className="text-sap-blue" />
          掲示板
        </div>
        {user && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sap-blue px-3 py-1.5 text-sm font-semibold text-white hover:bg-sap-blue-dark"
          >
            <PlusCircle size={15} />
            投稿する
          </button>
        )}
      </div>

      {/* Post form */}
      {user && showForm && (
        <PostForm
          userName={user.name}
          onPosted={(post) => { setPosts((prev) => [post, ...prev]); setShowForm(false); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Posts */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">まだ投稿がありません。</p>
        </div>
      ) : (
        <ol className="space-y-4">
          {posts.map((post) => (
            <li key={post.id} className="rounded-xl border border-sap-border bg-white shadow-sm overflow-hidden">
              {editingId === post.id ? (
                <EditForm
                  post={post}
                  userName={user!.name}
                  onSaved={(updated) => { setPosts((prev) => prev.map((p) => p.id === updated.id ? updated : p)); setEditingId(null); }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  {post.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.photo} alt={post.title} className="w-full max-h-72 object-cover" />
                  )}
                  <div className="p-4 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-base font-bold text-sap-text-dark leading-snug">{post.title}</h2>
                      {canEdit(post) && (
                        <div className="flex shrink-0 gap-1">
                          <button onClick={() => setEditingId(post.id)}
                            className="rounded p-1 text-gray-300 hover:text-sap-blue">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(post.id)}
                            className="rounded p-1 text-gray-300 hover:text-red-400">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {post.authorName && <span className="mr-2 font-medium text-gray-500">{post.authorName}</span>}
                      {formatDate(post.createdAt)}
                      {post.updatedAt !== post.createdAt && <span className="ml-1 text-gray-300">（編集済み）</span>}
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-gray-700 pt-1">{post.body}</p>
                  </div>
                </>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { BADGES, BADGE_MAP } from "@/lib/badges";
import { MOTIVATIONS } from "@/components/StatusEditor";

type ProfileData = {
  id: string;
  name: string;
  photo: string | null;
  selectedBadgeId: string | null;
  statusMessage: string | null;
  motivation: string | null;
  achievements: { badgeId: string; earnedAt: string }[];
  totalLaps: number;
  totalRuns: number;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export function UserProfileModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((d) => {
        setProfile(d);
        setLoading(false);
        requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      })
      .catch(() => setLoading(false));
  }, [userId]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  const earnedSet = new Set(profile?.achievements.map((a) => a.badgeId) ?? []);
  const earnedBadges = profile?.achievements ?? [];
  const motivationObj = MOTIVATIONS.find((m) => m.value === profile?.motivation);
  const selectedBadge = profile?.selectedBadgeId
    ? BADGE_MAP[profile.selectedBadgeId as keyof typeof BADGE_MAP]
    : null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={handleClose}
    >
      <div
        className={`relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 ${
          visible ? "translate-y-0 scale-100" : "translate-y-4 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <X size={18} />
        </button>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-gray-400">読み込み中...</p>
          </div>
        ) : profile ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-br from-sap-shell to-gray-800 px-6 py-8 text-center">
              <div className="mx-auto mb-3 inline-block">
                <Avatar photo={profile.photo} name={profile.name} size={80} />
              </div>
              <h2 className="text-xl font-bold text-white">{profile.name}</h2>
              {selectedBadge && (
                <p className="mt-1 text-sm text-white/70">
                  {selectedBadge.icon} {selectedBadge.name}
                </p>
              )}
              {motivationObj && (
                <p className="mt-1.5 text-sm font-semibold text-sap-blue-light">
                  {motivationObj.label}
                </p>
              )}
              {profile.statusMessage && (
                <p className="mt-1 text-sm text-white/70">💬 {profile.statusMessage}</p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
              <div className="py-4 text-center">
                <p className="text-2xl font-bold text-sap-blue">{profile.totalLaps}</p>
                <p className="text-xs text-gray-500">累計周回数</p>
              </div>
              <div className="py-4 text-center">
                <p className="text-2xl font-bold text-sap-blue">{profile.totalLaps * 5}</p>
                <p className="text-xs text-gray-500">累計距離 (km)</p>
              </div>
            </div>

            {/* Badges */}
            <div className="p-5">
              <h3 className="mb-3 text-sm font-bold text-sap-text-dark">
                獲得バッジ
                <span className="ml-2 text-xs font-normal text-gray-400">
                  {earnedBadges.length} / {BADGES.length}
                </span>
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {BADGES.map((badge) => {
                  const achievement = profile.achievements.find((a) => a.badgeId === badge.id);
                  const isEarned = earnedSet.has(badge.id);
                  return (
                    <div
                      key={badge.id}
                      title={
                        isEarned
                          ? `${badge.name}\n獲得日: ${formatDate(achievement!.earnedAt)}`
                          : `${badge.name}（未獲得）`
                      }
                      className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center ${
                        isEarned
                          ? "border-sap-blue/30 bg-sap-blue-light"
                          : "border-gray-100 bg-gray-50 opacity-30 grayscale"
                      }`}
                    >
                      <span className="text-2xl leading-none">{badge.icon}</span>
                      <span className="text-xs leading-tight text-gray-700">{badge.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-red-400">読み込みに失敗しました</p>
          </div>
        )}
      </div>
    </div>
  );
}

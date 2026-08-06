"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { UserProfileModal } from "@/components/UserProfileModal";

type Props = {
  userId: string;
  photo: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
  // Pass currentUserId to skip modal for the logged-in user themselves.
  currentUserId?: string;
};

// Avatar that opens UserProfileModal on click.
// Falls back to plain Avatar for self (currentUserId === userId).
export function ClickableAvatar({ userId, photo, name, size, className, currentUserId }: Props) {
  const [open, setOpen] = useState(false);
  const isSelf = currentUserId && currentUserId === userId;

  if (isSelf) {
    return <Avatar photo={photo} name={name} size={size} className={className} />;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`rounded-full focus:outline-none focus:ring-2 focus:ring-sap-blue focus:ring-offset-1 ${className ?? ""}`}
        title={`${name}のプロフィールを見る`}
      >
        <Avatar photo={photo} name={name} size={size} />
      </button>
      {open && (
        <UserProfileModal userId={userId} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

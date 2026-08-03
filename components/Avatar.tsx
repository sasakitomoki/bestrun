import { User as UserIcon } from "lucide-react";

type AvatarProps = {
  photo: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
};

// Renders a user's face photo, falling back to an initial / icon.
export function Avatar({ photo, name, size = 40, className = "" }: AvatarProps) {
  const dimension = { width: size, height: size };

  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photo}
        alt={name}
        style={dimension}
        className={`rounded-full object-cover ring-2 ring-white shadow-sm ${className}`}
      />
    );
  }

  return (
    <span
      style={dimension}
      className={`inline-flex items-center justify-center rounded-full bg-brand text-white ring-2 ring-white shadow-sm ${className}`}
    >
      {name ? (
        <span style={{ fontSize: size * 0.45 }}>{name.charAt(0)}</span>
      ) : (
        <UserIcon size={size * 0.55} />
      )}
    </span>
  );
}

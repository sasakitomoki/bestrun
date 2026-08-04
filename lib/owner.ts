// Add names to this array to grant owner privileges.
export const OWNER_NAMES: string[] = ["ささとも", "りんたろう"];

export function isOwner(name: string | null | undefined): boolean {
  return typeof name === "string" && OWNER_NAMES.includes(name);
}

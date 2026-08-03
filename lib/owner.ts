// Change this value to reassign the owner role.
export const OWNER_NAME = "ささとも";

export function isOwner(name: string | null | undefined): boolean {
  return name === OWNER_NAME;
}

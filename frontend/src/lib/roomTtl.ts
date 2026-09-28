// Mirrors backend/src/lib/roomTtl.js.
export const ROOM_TTL_OPTIONS = [
  { hours: 24, label: "24h" },
  { hours: 36, label: "36h" },
  { hours: 144, label: "6d" },
] as const;

export type RoomTtlHours = (typeof ROOM_TTL_OPTIONS)[number]["hours"];

export const DEFAULT_ROOM_TTL_HOURS: RoomTtlHours = 144;

const HOUR_MS = 60 * 60 * 1000;

export function getRoomExpiry(room: {
  expiresAt?: string;
  createdAt?: string;
  ttlHours?: number;
}): Date | null {
  if (room.expiresAt) return new Date(room.expiresAt);
  if (!room.createdAt) return null;
  return new Date(
    new Date(room.createdAt).getTime() +
      (room.ttlHours ?? DEFAULT_ROOM_TTL_HOURS) * HOUR_MS
  );
}

export function formatTimeLeft(expiry: Date | null): string {
  if (!expiry) return "";
  const ms = expiry.getTime() - Date.now();
  if (ms <= 0) return "expiring";
  const hours = Math.floor(ms / HOUR_MS);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h left`;
  const minutes = Math.floor((ms % HOUR_MS) / 60000);
  return `${hours}h ${minutes}m left`;
}

// A lifetime is only valid if the room would still be alive under it.
export function isTtlAvailable(createdAt: string | undefined, hours: number) {
  if (!createdAt) return true;
  return new Date(createdAt).getTime() + hours * HOUR_MS > Date.now();
}

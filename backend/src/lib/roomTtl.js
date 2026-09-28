// Allowed room lifetimes in hours: 24h, 36h and 6 days.
export const ROOM_TTL_HOURS = [24, 36, 144];
export const DEFAULT_ROOM_TTL_HOURS = 144;

export const isValidTtl = (hours) => ROOM_TTL_HOURS.includes(Number(hours));

export const computeExpiry = (createdAt, ttlHours) =>
  new Date(new Date(createdAt).getTime() + Number(ttlHours) * 60 * 60 * 1000);

// Rooms created before per-room TTLs existed have no expiresAt; they fall back to 6 days.
export const getRoomExpiry = (room) =>
  room.expiresAt ??
  computeExpiry(room.createdAt ?? Date.now(), room.ttlHours ?? DEFAULT_ROOM_TTL_HOURS);

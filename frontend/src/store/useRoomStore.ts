import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "sonner";

// Type definitions
interface User {
  _id: string;
  name: string;
  email: string;
  picture?: string;
}

interface Room {
  _id: string;
  name: string;
  roomCode: string;
  createdBy: User | null;
  members: User[];
  inviteLink?: string;
}

interface RoomExpiration {
  timeLeft: number;
  timestamp: number;
}

// Temporary types for API response
interface RawMember {
  _id: string;
  name: string;
  email: string;
  picture?: string;
}

interface RawRoom {
  _id: string;
  name: string;
  roomCode: string;
  createdBy?: RawMember;
  members?: RawMember[];
  inviteLink?: string;
}

interface RoomStore {
  rooms: Room[];
  userRooms: Room[];
  isCreatingRoom: boolean;
  isJoiningRoom: boolean;
  createdRoomCode: string;
  roomExpirationTimes: Record<string, RoomExpiration>;

  fetchRooms: () => Promise<void>;
  createRoom: (data: { name: string }) => Promise<Room | undefined>;
  joinRoom: (roomCode: string) => Promise<Room | undefined>;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  getUserRooms: () => Promise<void>;
  getRoomExpirationTime: (roomCodeOrId: string) => Promise<number | undefined>;
  updateExpirationTime: (roomCodeOrId: string) => void;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  rooms: [],
  userRooms: [],
  isCreatingRoom: false,
  isJoiningRoom: false,
  createdRoomCode: "",
  roomExpirationTimes: {},

  fetchRooms: async () => {
    try {
      const res = await axiosInstance.get<Room[]>("room/users");
      set({ rooms: res.data });
    } catch {
      toast.error("Failed to fetch rooms");
    }
  },

  createRoom: async (data) => {
    set({ isCreatingRoom: true });
    try {
      const res = await axiosInstance.post("/room/create", data);

      if (res.status === 200 && res.data?.roomCode) {
        if (res.data?.message) toast.success(res.data.message);

        const room: Room = {
          _id: res.data.roomId,
          name: data.name,
          roomCode: res.data.roomCode,
          createdBy: { _id: "", name: "", email: "" },
          members: [],
          inviteLink: res.data.inviteLink,
        };

        set({
          createdRoomCode: room.roomCode,
          rooms: [...get().rooms, room],
        });

        return room;
      } else {
        toast.error(res.data?.message || "Failed to create room");
      }
    } catch {
      toast.error("Failed to create room");
    } finally {
      set({ isCreatingRoom: false });
    }
  },

  joinRoom: async (roomCode) => {
    set({ isJoiningRoom: true });
    try {
      const res = await axiosInstance.post<{ room: Room; message?: string }>("/room/join", { roomCode });
      const room: Room = res.data.room;

      if (res.data?.message) 
      toast.success(res.data.message);
    
      set({ userRooms: [...get().userRooms, room] });

      return room;
    } catch {
      toast.error("Failed to join room");
    } finally {
      set({ isJoiningRoom: false });
    }
  },

  showToast: (message, type = "success") => {
    if (type === "success") toast.success(message);
    else if (type === "error") toast.error(message);
    else toast(message);
  },

  getUserRooms: async () => {
    try {
      const res = await axiosInstance.get("/room/users");
      const rawRooms: RawRoom[] = Array.isArray(res.data) ? res.data : res.data.rooms || [];

      const userRooms: Room[] = rawRooms.map((room) => ({
        _id: room._id,
        name: room.name,
        roomCode: room.roomCode,
        members: Array.isArray(room.members)
          ? room.members.map((member) => ({
              _id: member._id,
              name: member.name,
              email: member.email,
              picture: member.picture,
            }))
          : [],
        createdBy: room.createdBy
          ? {
              _id: room.createdBy._id,
              name: room.createdBy.name,
              email: room.createdBy.email,
              picture: room.createdBy.picture,
            }
          : null,
        inviteLink: room.inviteLink || undefined,
      }));

      set({ userRooms });
    } catch {
      set({ userRooms: [] });
    }
  },

  getRoomExpirationTime: async (roomCodeOrId) => {
    const currentTime = Date.now();
    const state = get();

    const cachedExpiration = state.roomExpirationTimes[roomCodeOrId];
    if (cachedExpiration && currentTime - cachedExpiration.timestamp < 10 * 60 * 1000) {
      return cachedExpiration.timeLeft;
    }

    try {
      const url = `/room/${roomCodeOrId}/expiry`;
      const res = await axiosInstance.get<{ timeLeft: string }>(url);
      const { timeLeft } = res.data;

      const [hours, minutes, seconds] = timeLeft.split(":").map(Number);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;

      set((state) => ({
        roomExpirationTimes: {
          ...state.roomExpirationTimes,
          [roomCodeOrId]: { timeLeft: totalSeconds, timestamp: currentTime },
        },
      }));

      return totalSeconds;
    } catch {
      toast.error("Failed to fetch room expiration time");
    }
  },

  updateExpirationTime: (roomCodeOrId) => {
    const state = get();
    const cachedExpiration = state.roomExpirationTimes[roomCodeOrId];

    if (cachedExpiration) {
      const timeLeft = cachedExpiration.timeLeft - 1;
      set((state) => ({
        roomExpirationTimes: {
          ...state.roomExpirationTimes,
          [roomCodeOrId]: {
            ...cachedExpiration,
            timeLeft: timeLeft > 0 ? timeLeft : 0,
          },
        },
      }));
    }
  },
}));

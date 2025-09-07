import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "sonner";

// Type definitions
interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

interface Room {
  _id: string;
  name: string;
  roomCode: string;
  createdBy: User;
  members: User[];
  inviteLink?: string;
}

interface RoomExpiration {
  timeLeft: number;
  timestamp: number;
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
      const res = await axiosInstance.get("room/users");
      set({ rooms: res.data });
    } catch (error) {
      console.error("Failed to fetch rooms", error);
      toast.error("Failed to fetch rooms");
    }
  },

  createRoom: async (data) => {
    set({ isCreatingRoom: true });
    try {
      const res = await axiosInstance.post("/room/create", data);
      const room: Room = res.data.room;

      if (res.data?.message) toast.success(res.data.message);

      set({
        createdRoomCode: room.roomCode,
        rooms: [...get().rooms, room],
      });

      return room;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create room");
    } finally {
      set({ isCreatingRoom: false });
    }
  },

  joinRoom: async (roomCode) => {
    set({ isJoiningRoom: true });
    try {
      const res = await axiosInstance.post("/room/join", { roomCode });
      const room: Room = res.data.room;

      if (res.data?.message) toast.success(res.data.message);

      set({ userRooms: [...get().userRooms, room] });

      return room;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to join room");
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
      const userRooms: Room[] = res.data.map((room: any) => ({
        ...room,
        members: room.members.map((member: any) => ({
          id: member._id,
          name: member.name,
          email: member.email,
          picture: member.picture,
        })),
        createdBy: {
          id: room.createdBy._id,
          name: room.createdBy.name,
          email: room.createdBy.email,
          picture: room.createdBy.picture,
        },
        inviteLink: room.inviteLink, // added invite link
      }));
      set({ userRooms });
    } catch (error) {
      console.error("Error fetching user rooms:", error);
      toast.error("Failed to fetch user rooms");
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
      const res = await axiosInstance.get(url);
      const { timeLeft } = res.data;

      set((state) => ({
        roomExpirationTimes: {
          ...state.roomExpirationTimes,
          [roomCodeOrId]: { timeLeft, timestamp: currentTime },
        },
      }));

      setInterval(() => {
        get().updateExpirationTime(roomCodeOrId);
      }, 1000);

      return timeLeft;
    } catch (error) {
      console.error("Error fetching room expiration time:", error);
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

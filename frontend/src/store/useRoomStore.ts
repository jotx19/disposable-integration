import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "sonner";
import { useChatStore } from "./useChatStore";

const getErrorMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data
    ?.message ?? fallback;

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
  ttlHours?: number;
  expiresAt?: string;
  createdAt?: string;
  isPublic?: boolean;
}

interface RoomExpiration {
  // Epoch ms when the room expires.
  deadline: number;
}

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
  ttlHours?: number;
  expiresAt?: string;
  createdAt?: string;
  isPublic?: boolean;
}

interface RoomStore {
  rooms: Room[];
  userRooms: Room[];
  isCreatingRoom: boolean;
  isJoiningRoom: boolean;
  createdRoomCode: string;
  roomExpirationTimes: Record<string, RoomExpiration>;

  fetchRooms: () => Promise<void>;
  createRoom: (data: { name: string; ttlHours?: number }) => Promise<Room | undefined>;
  joinRoom: (roomCode: string) => Promise<Room | undefined>;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  getUserRooms: () => Promise<void>;
  getRoomDeadline: (roomCodeOrId: string) => Promise<number | undefined>;
  removeUserFromRoom: (roomCode: string, userId: string) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<boolean>;
  leaveRoom: (roomId: string) => Promise<boolean>;
  updateRoomTtl: (roomId: string, ttlHours: number) => Promise<boolean>;
  removeRoomLocally: (roomId: string) => void;
  applyRoomTtl: (roomId: string, ttlHours: number, expiresAt: string) => void;
  setRoomVisibility: (roomId: string, isPublic: boolean) => Promise<boolean>;
  applyRoomVisibility: (roomId: string, isPublic: boolean) => void;
  // Room to open once /chat has loaded (after joining or saving a guest chat).
  pendingRoomId: string | null;
  setPendingRoomId: (roomId: string | null) => void;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  rooms: [],
  userRooms: [],
  isCreatingRoom: false,
  isJoiningRoom: false,
  createdRoomCode: "",
  roomExpirationTimes: {},
  pendingRoomId: null,

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
          ttlHours: res.data.ttlHours,
          expiresAt: res.data.expiresAt,
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
    
      set({ userRooms: [...get().userRooms.filter((r) => r._id !== room._id), room] });

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
        ttlHours: room.ttlHours,
        expiresAt: room.expiresAt,
        createdAt: room.createdAt,
        isPublic: room.isPublic ?? false,
      }));

      set({ userRooms });
    } catch {
      set({ userRooms: [] });
    }
  },

  getRoomDeadline: async (roomCodeOrId) => {
    const cached = get().roomExpirationTimes[roomCodeOrId];
    if (cached) return cached.deadline;

    try {
      const requestedAt = Date.now();
      const res = await axiosInstance.get<{ timeLeft?: string }>(
        `/room/${roomCodeOrId}/expiry`
      );
      // Server reports time left, so the deadline is independent of client clock skew.
      const [hours = 0, minutes = 0, seconds = 0] = (res.data.timeLeft ?? "0:0:0")
        .split(":")
        .map(Number);
      const deadline = requestedAt + (hours * 3600 + minutes * 60 + seconds) * 1000;

      set((state) => ({
        roomExpirationTimes: {
          ...state.roomExpirationTimes,
          [roomCodeOrId]: { deadline },
        },
      }));
      return deadline;
    } catch {
      toast.error("Failed to fetch room expiration time");
    }
  },

  removeUserFromRoom: async (roomCode, userId) => {
    try {
      const res = await axiosInstance.post("/room/removeUser", { roomCode, userId });
  
      if (res.data?.message) toast.success(res.data.message);
      else toast.success("User removed");

      const { selectedRoom } = useChatStore.getState();
      if (selectedRoom?.roomCode === roomCode) {
        useChatStore.setState({
          selectedRoom: {
            ...selectedRoom,
            members: (selectedRoom.members ?? []).filter((m) => m._id !== userId),
          },
        });
      }
  
      set((state) => ({
        userRooms: state.userRooms.map((r) =>
          r.roomCode === roomCode
            ? { ...r, members: (r.members || []).filter((m) => m._id !== userId) }
            : r
        ),
        rooms: state.rooms.map((r) =>
          r.roomCode === roomCode
            ? { ...r, members: (r.members || []).filter((m) => m._id !== userId) }
            : r
        ),
      }));
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    
      toast.error(message || "Failed to remove user");
    }
  },

  deleteRoom: async (roomId) => {
    try {
      await axiosInstance.delete(`/room/${roomId}`);
      get().removeRoomLocally(roomId);
      toast.success("Room deleted");
      return true;
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to delete room"));
      return false;
    }
  },

  leaveRoom: async (roomId) => {
    try {
      await axiosInstance.post(`/room/${roomId}/leave`);
      get().removeRoomLocally(roomId);
      toast.success("You left the room");
      return true;
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to leave room"));
      return false;
    }
  },

  updateRoomTtl: async (roomId, ttlHours) => {
    try {
      const res = await axiosInstance.patch<{ ttlHours: number; expiresAt: string }>(
        `/room/${roomId}/ttl`,
        { ttlHours }
      );
      get().applyRoomTtl(roomId, res.data.ttlHours, res.data.expiresAt);
      toast.success("Room lifetime updated");
      return true;
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to update room lifetime"));
      return false;
    }
  },

  removeRoomLocally: (roomId) => {
    set((state) => ({
      userRooms: state.userRooms.filter((r) => r._id !== roomId),
      rooms: state.rooms.filter((r) => r._id !== roomId),
    }));
    const { selectedRoom, setSelectedRoom } = useChatStore.getState();
    if (selectedRoom?._id === roomId) setSelectedRoom(null);
  },

  applyRoomTtl: (roomId, ttlHours, expiresAt) => {
    set((state) => {
      const room = state.userRooms.find((r) => r._id === roomId);
      const roomExpirationTimes = { ...state.roomExpirationTimes };
      delete roomExpirationTimes[roomId];
      if (room?.roomCode) delete roomExpirationTimes[room.roomCode];
      return {
        roomExpirationTimes,
        userRooms: state.userRooms.map((r) =>
          r._id === roomId ? { ...r, ttlHours, expiresAt } : r
        ),
      };
    });
    // A new selectedRoom object makes the header timer refetch the expiry.
    const { selectedRoom } = useChatStore.getState();
    if (selectedRoom?._id === roomId) {
      useChatStore.setState({ selectedRoom: { ...selectedRoom, ttlHours, expiresAt } });
    }
  },

  setRoomVisibility: async (roomId, isPublic) => {
    try {
      await axiosInstance.patch(`/room/${roomId}/visibility`, { isPublic });
      get().applyRoomVisibility(roomId, isPublic);
      toast.success(isPublic ? "Room is now public" : "Room is now private");
      return true;
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to change visibility"));
      return false;
    }
  },

  applyRoomVisibility: (roomId, isPublic) => {
    set((state) => ({
      userRooms: state.userRooms.map((r) => (r._id === roomId ? { ...r, isPublic } : r)),
    }));
    const { selectedRoom } = useChatStore.getState();
    if (selectedRoom?._id === roomId) {
      useChatStore.setState({ selectedRoom: { ...selectedRoom, isPublic } });
    }
  },

  setPendingRoomId: (roomId) => set({ pendingRoomId: roomId }),
}));

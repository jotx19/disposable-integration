import { create } from "zustand";
import { toast } from "sonner";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { Socket } from "socket.io-client";

export interface User {
  _id: string;
  name: string;
  profilepic?: string;
}

export interface Message {
  _id: string;
  text?: string;
  image?: string;
  sender: string | User;
  room: string;
  createdAt: string;
}
export interface Room {
  _id: string;
  name: string;
  members: User[];
  roomCode?: string;
  createdBy?: User;
  inviteLink?: string;
}

interface ChatStore {
  messages: Message[];
  rooms: Room[];
  selectedMessages: string[];
  selectedRoom: Room | null;
  isRoomLoading: boolean;
  isMessagesLoading: boolean;

  getRooms: () => Promise<void>;
  getMessages: (roomId: string) => Promise<void>;
  sendMessage: (messageData: {
    text?: string;
    image?: string | null;
    roomId: string;
  }) => Promise<void>;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  setSelectedRoom: (room: Room | null) => void;
  deleteSelectedMessages: (ids?: string[]) => Promise<void>;
  addMessageToState: (msg: Message) => void;
  toggleSelectedMessage: (id: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  rooms: [],
  selectedMessages: [],
  selectedRoom: null,
  isRoomLoading: false,
  isMessagesLoading: false,

  getRooms: async () => {
    set({ isRoomLoading: true });
    try {
      const res = await axiosInstance.get("/room/users");
      set({ rooms: res.data });
    } catch (error) {
      console.error("Failed to fetch rooms", error);
    } finally {
      set({ isRoomLoading: false });
    }
  },

  getMessages: async (roomId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/message/${roomId}/messages`);
      set({ messages: res.data });
    } catch (error) {
      toast.error("Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedRoom } = get();
    if (!selectedRoom?._id) {
      console.error("Room ID is missing!");
      return;
    }
    try {
      await axiosInstance.post(
        `/message/${selectedRoom._id}/sendMessage`,
        messageData
      );
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  },

  subscribeToMessages: () => {
    const { selectedRoom } = get();
    if (!selectedRoom) return;

    const socket: Socket | null = useAuthStore.getState().socket;
    if (!socket) {
      console.warn("Socket not connected, cannot subscribe");
      return;
    }

    socket.emit("joinRoom", selectedRoom._id);

    socket.on("message", (message: Message) => {
      if (message.room === selectedRoom._id) {
        set((state) => {
          const exists = state.messages.some((m) => m._id === message._id);
          return exists
            ? state
            : { messages: [...state.messages, message] };
        });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket: Socket | null = useAuthStore.getState().socket;
    if (!socket) return;

    socket.emit("leaveRoom");
    socket.off("message");
  },

  setSelectedRoom: (room) => {
    const { unsubscribeFromMessages, subscribeToMessages, getMessages } = get();
    unsubscribeFromMessages();
    set({ selectedRoom: room });
    if (room) {
      getMessages(room._id);
      subscribeToMessages();
    }
  },

  deleteSelectedMessages: async (ids) => {
    const { selectedMessages, messages } = get();
    const toDelete = ids || selectedMessages;
    if (toDelete.length === 0) {
      toast.error("No messages selected");
      return;
    }
    try {
      await axiosInstance.delete("/message/delete", {
        data: { messageIds: toDelete },
      });
      toast.success("Deleted successfully");
      set({
        messages: messages.filter((m) => !toDelete.includes(m._id)),
        selectedMessages: [],
      });
    } catch (error) {
      toast.error("Failed to delete selected messages");
    }
  },

  addMessageToState: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  toggleSelectedMessage: (id) => {
    const { selectedMessages } = get();
    set({
      selectedMessages: selectedMessages.includes(id)
        ? selectedMessages.filter((m) => m !== id)
        : [...selectedMessages, id],
    });
  },
  
}));
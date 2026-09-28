import { create } from "zustand";
import { toast } from "sonner";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { useCallStore } from "./useCallStore";
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
  // Missing on system messages; null if the sender's account was deleted.
  sender?: string | User | null;
  room: string;
  createdAt: string;
  type?: "user" | "system";
  // Live message from an unsaved guest in a public room (not in the database).
  guest?: boolean;
}

export function getSenderId(message: Pick<Message, "sender">): string | null {
  const { sender } = message;
  if (!sender) return null;
  return typeof sender === "string" ? sender : sender._id;
}

export interface RoomGuest {
  id: string;
  username: string;
}

export interface Room {
  _id: string;
  name: string;
  members?: User[];
  roomCode?: string;
  createdBy?: User | null;
  inviteLink?: string;
  ttlHours?: number;
  expiresAt?: string;
  createdAt?: string;
  isPublic?: boolean;
}

interface ChatStore {
  messages: Message[];
  rooms: Room[];
  selectedMessages: string[];
  // Message whose swipe-to-delete action is revealed; only one at a time.
  openMessageId: string | null;
  // Guests currently chatting in the open room.
  roomGuests: RoomGuest[];
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
  setOpenMessageId: (id: string | null) => void;
}

// Handlers for the currently open room, kept so they can be removed precisely.
let roomSubscription: {
  socket: Socket;
  roomId: string;
  onConnect: () => void;
  onMessage: (message: Message) => void;
  onCallActive: (payload: { hostId: string; roomId: string }) => void;
  onCallInactive: (payload?: { roomId?: string }) => void;
  onMessagesRemoved: (payload: { roomId: string; ids: string[] }) => void;
  onMessagesClaimed: (payload: { roomId: string; ids: string[]; messages: Message[] }) => void;
  onRoomGuests: (payload: { roomId: string; guests: RoomGuest[] }) => void;
} | null = null;

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  rooms: [],
  selectedMessages: [],
  openMessageId: null,
  roomGuests: [],
  selectedRoom: null,
  isRoomLoading: false,
  isMessagesLoading: false,

  getRooms: async () => {
    set({ isRoomLoading: true });
    try {
      const res = await axiosInstance.get<Room[]>("/room/users");
      set({ rooms: res.data });
    } catch {
      toast.error("Failed to fetch rooms");
    } finally {
      set({ isRoomLoading: false });
    }
  },

  getMessages: async (roomId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get<Message[]>(`/message/${roomId}/messages`);
      set({ messages: res.data });
    } catch {
      toast.error("Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedRoom } = get();
    if (!selectedRoom?._id) {
      toast.error("Room ID is missing!");
      return;
    }
    try {
      await axiosInstance.post(`/message/${selectedRoom._id}/sendMessage`, messageData);
    } catch {
      toast.error("Failed to send message");
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

    const roomId = selectedRoom._id;

    // Emits are buffered until connected, and re-sent on every reconnect because
    // the server forgets which rooms a socket was in when the connection drops.
    const joinRoom = () => {
      socket.emit("joinRoom", roomId);
      socket.emit("get-active-call", { roomId });
    };

    const onConnect = () => {
      joinRoom();
      // If the server couldn't replay what we missed while offline, refetch.
      if (!socket.recovered && get().selectedRoom?._id === roomId) {
        void get().getMessages(roomId);
      }
    };

    const onMessage = (message: Message) => {
      if (message.room !== roomId) return;
      set((state) => {
        const exists = state.messages.some((m) => m._id === message._id);
        return exists ? state : { messages: [...state.messages, message] };
      });
    };

    const onCallActive = ({ hostId, roomId: callRoomId }: { hostId: string; roomId: string }) => {
      const authUser = useAuthStore.getState().authUser;
      if (callRoomId === roomId && authUser && hostId !== authUser._id) {
        useCallStore.getState().setActiveCallInRoom({ hostId, roomId: callRoomId });
      }
    };

    const onCallInactive = (payload?: { roomId?: string }) => {
      if (!payload?.roomId || payload.roomId === roomId) {
        useCallStore.getState().setActiveCallInRoom(null);
      }
    };

    // A guest disconnected without saving: their messages disappear.
    const onMessagesRemoved = ({ roomId: rid, ids }: { roomId: string; ids: string[] }) => {
      if (rid !== roomId) return;
      set((state) => ({ messages: state.messages.filter((m) => !ids.includes(m._id)) }));
    };

    // A guest signed up: swap their live messages for the saved ones.
    const onMessagesClaimed = ({
      roomId: rid,
      ids,
      messages: saved,
    }: {
      roomId: string;
      ids: string[];
      messages: Message[];
    }) => {
      if (rid !== roomId) return;
      set((state) => ({
        messages: [...state.messages.filter((m) => !ids.includes(m._id)), ...saved].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
      }));
    };

    const onRoomGuests = ({ roomId: rid, guests }: { roomId: string; guests: RoomGuest[] }) => {
      if (rid === roomId) set({ roomGuests: guests });
    };

    joinRoom();
    socket.on("connect", onConnect);
    socket.on("message", onMessage);
    socket.on("call-active", onCallActive);
    socket.on("call-inactive", onCallInactive);
    socket.on("messages-removed", onMessagesRemoved);
    socket.on("messages-claimed", onMessagesClaimed);
    socket.on("room-guests", onRoomGuests);

    roomSubscription = {
      socket,
      roomId,
      onConnect,
      onMessage,
      onCallActive,
      onCallInactive,
      onMessagesRemoved,
      onMessagesClaimed,
      onRoomGuests,
    };
  },

  unsubscribeFromMessages: () => {
    const sub = roomSubscription;
    if (!sub) return;
    const { socket } = sub;
    socket.emit("leaveRoom", sub.roomId);
    // Remove only our handlers so the call store's listeners survive.
    socket.off("connect", sub.onConnect);
    socket.off("message", sub.onMessage);
    socket.off("call-active", sub.onCallActive);
    socket.off("call-inactive", sub.onCallInactive);
    socket.off("messages-removed", sub.onMessagesRemoved);
    socket.off("messages-claimed", sub.onMessagesClaimed);
    socket.off("room-guests", sub.onRoomGuests);
    roomSubscription = null;
    useChatStore.setState({ roomGuests: [] });
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
        openMessageId: null,
      });
    } catch {
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

  setOpenMessageId: (id) => set({ openMessageId: id }),
}));

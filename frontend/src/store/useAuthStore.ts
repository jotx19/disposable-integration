import { create } from "zustand";
import { axiosInstance, BASE_URL } from "../lib/axios";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

// User type
export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  profilepic?: string;
  defaultRoomTtlHours?: number;
}

const getErrorMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data
    ?.message ?? fallback;

interface AuthState {
  authUser: AuthUser | null;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isLoggingInWithGoogle: boolean;
  isUpdatingProfile: boolean;
  isUpdatingAccount: boolean;
  isDeletingAccount: boolean;
  isCheckingAuth: boolean;
  onlineUsers: string[];
  socket: Socket | null;

  checkAuth: () => Promise<void>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    claimToken?: string;
  }) => Promise<{ claimedRoomId?: string | null } | null>;
  login: (data: { email: string; password: string }) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  updateAccount: (data: { name?: string; defaultRoomTtlHours?: number }) => Promise<boolean>;
  deleteAccount: (confirmation: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isLoggingInWithGoogle: false,
  isUpdatingProfile: false,
  isUpdatingAccount: false,
  isDeletingAccount: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get<AuthUser>("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post<{
        token: string;
        _id: string;
        name: string;
        email: string;
        profilepic?: string;
        claimedRoomId?: string | null;
      }>("/auth/signup", data);
      localStorage.setItem("jwt", res.data.token);
      set({ authUser: { _id: res.data._id, name: res.data.name, email: res.data.email, profilepic: res.data.profilepic } });

      toast.success("Account created successfully");
      get().connectSocket();
      return { claimedRoomId: res.data.claimedRoomId };
    } catch (e) {
      toast.error(getErrorMessage(e, "Signup failed"));
      return null;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post<{ token: string; _id: string; name: string; email: string; profilepic?: string }>("/auth/login", data);
      localStorage.setItem("jwt", res.data.token);
      set({ authUser: { _id: res.data._id, name: res.data.name, email: res.data.email, profilepic: res.data.profilepic } });
  
      toast.success("Logged in successfully");
      get().connectSocket();
  
      return res.data;
    } catch {
      toast.error("Login failed");
      return null;
    } finally {
      set({ isLoggingIn: false });
    }
  },


  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch {
      toast.error("Logout failed");
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser) return;

    // Reuse the one socket. Checking `connected` alone raced on slow networks:
    // a still-connecting socket looked absent, so duplicates were created.
    if (socket) {
      if (socket.disconnected) socket.connect();
      return;
    }

    const newSocket = io(BASE_URL, {
      // Read the token on every (re)connect so it's never stale.
      auth: (cb) => cb({ token: localStorage.getItem("jwt") }),
      transports: ["websocket", "polling"],
      tryAllTransports: true,
      reconnectionDelayMax: 5000,
    });

    newSocket.on("ONLINE_USERS", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });

    newSocket.on("connect_error", (err) => {
      if (err.message === "unauthorized") {
        // The server rejected the token; retrying won't help until the user signs in again.
        newSocket.disconnect();
      }
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    socket?.removeAllListeners();
    socket?.disconnect();
    set({ socket: null, onlineUsers: [] });
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put<AuthUser>("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  updateAccount: async (data) => {
    set({ isUpdatingAccount: true });
    try {
      const res = await axiosInstance.put<AuthUser>("/auth/update-account", data);
      set({ authUser: res.data });
      toast.success("Settings saved");
      return true;
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to save settings"));
      return false;
    } finally {
      set({ isUpdatingAccount: false });
    }
  },

  deleteAccount: async (confirmation) => {
    set({ isDeletingAccount: true });
    try {
      await axiosInstance.delete("/auth/account", { data: { confirmation } });
      localStorage.removeItem("jwt");
      get().disconnectSocket();
      set({ authUser: null });
      toast.success("Your account has been deleted");
      return true;
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to delete account"));
      return false;
    } finally {
      set({ isDeletingAccount: false });
    }
  },
}));

import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

const BASE_URL = "http://localhost:5001";

// User type
export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  profilepic?: string;
}

interface AuthState {
  authUser: AuthUser | null;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isLoggingInWithGoogle: boolean;
  isUpdatingProfile: boolean;
  isCheckingAuth: boolean;
  onlineUsers: string[];
  socket: Socket | null;

  checkAuth: () => Promise<void>;
  signup: (data: { name: string; email: string; password: string }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<AuthUser | null>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isLoggingInWithGoogle: false,
  isUpdatingProfile: false,
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
      const res = await axiosInstance.post<AuthUser>("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch {
      toast.error("Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post<AuthUser>("/auth/login", data);
      set({ authUser: res.data });
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

  loginWithGoogle: async () => {
    set({ isLoggingInWithGoogle: true });
    try {
      const googleAuthWindow = window.open(
        `${BASE_URL}/api/auth/google`,
        "Google Login"
      );

      const checkIfClosed = setInterval(() => {
        if (googleAuthWindow?.closed) {
          clearInterval(checkIfClosed);
          axiosInstance
            .get<AuthUser>("api/auth/google")
            .then((res) => {
              set({ authUser: res.data });
              toast.success("Logged in with Google successfully!");
              get().connectSocket();
            })
            .catch(() => {
              toast.error("Google login failed");
            });
        }
      }, 1000);
    } catch {
      toast.error("Error with Google login flow");
    } finally {
      set({ isLoggingInWithGoogle: false });
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
    if (!authUser || socket?.connected) return;

    const newSocket = io(BASE_URL, { query: { userId: authUser._id } });

    newSocket.connect();
    set({ socket: newSocket });

    newSocket.on("ONLINE_USERS", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
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
}));

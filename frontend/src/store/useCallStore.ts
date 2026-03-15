import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { Socket } from "socket.io-client";
import { toast } from "sonner";

export type CallMode = "video" | "voice";

export interface Participant {
  userId: string;
  stream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isAudioMuted: boolean;
  isVideoOff: boolean;
}

interface CallState {
  isCallOpen: boolean;
  isMinimized: boolean;
  isInCall: boolean;
  callMode: CallMode;
  roomId: string | null;
  isHost: boolean;
  maxParticipants: number;
  callDuration: number;
  callTimerRef: ReturnType<typeof setInterval> | null;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isSharingScreen: boolean;
  participants: Record<string, Participant>;
  incomingCall: { from: string; offer: RTCSessionDescriptionInit; roomId: string } | null;
  activeCallInRoom: { hostId: string; roomId: string } | null;

  openCall: () => void;
  closeCall: () => void;
  minimize: () => void;
  maximize: () => void;
  setActiveCallInRoom: (data: { hostId: string; roomId: string } | null) => void;

  startCall: (roomId: string, mode: CallMode, maxParticipants?: number) => Promise<void>;
  joinCall: (roomId: string, mode: CallMode) => Promise<void>;
  leaveCall: () => void;
  endCall: () => void;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => void;

  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;

  subscribeToCallEvents: () => void;
  unsubscribeFromCallEvents: () => void;

  _createPeerConnection: (targetUserId: string) => RTCPeerConnection;
  _addParticipant: (userId: string, stream?: MediaStream) => void;
  _removeParticipant: (userId: string) => void;
  _cleanupCall: () => void;
  _startTimer: () => void;
  _stopTimer: () => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const useCallStore = create<CallState>((set, get) => ({
  isCallOpen: false,
  isMinimized: false,
  isInCall: false,
  callMode: "video",
  roomId: null,
  isHost: false,
  maxParticipants: 5,
  callDuration: 0,
  callTimerRef: null,
  localStream: null,
  screenStream: null,
  isAudioMuted: false,
  isVideoOff: false,
  isSharingScreen: false,
  participants: {},
  incomingCall: null,
  activeCallInRoom: null,

  openCall: () => set({ isCallOpen: true, isMinimized: false }),
  closeCall: () => set({ isCallOpen: false, isMinimized: false }),
  minimize: () => set({ isMinimized: true }),
  maximize: () => set({ isMinimized: false }),
  setActiveCallInRoom: (data) => set({ activeCallInRoom: data }),

  startCall: async (roomId, mode, maxParticipants = 5) => {
    const socket: Socket | null = useAuthStore.getState().socket;
    if (!socket) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: mode === "video",
        audio: true,
      });
      set({
        isInCall: true,
        isCallOpen: true,
        isMinimized: false,
        callMode: mode,
        roomId,
        isHost: true,
        maxParticipants,
        localStream: stream,
        isAudioMuted: false,
        isVideoOff: false,
        isSharingScreen: false,
        participants: {},
        callDuration: 0,
        activeCallInRoom: null,
      });
      socket.emit("start-call", { roomId, maxParticipants });
      get().subscribeToCallEvents();
      get()._startTimer();
    } catch {
      toast.error("Could not access camera/microphone");
    }
  },

  joinCall: async (roomId, mode) => {
    const socket: Socket | null = useAuthStore.getState().socket;
    if (!socket) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: mode === "video",
        audio: true,
      });
      set({
        isInCall: true,
        isCallOpen: true,
        isMinimized: false,
        callMode: mode,
        roomId,
        isHost: false,
        localStream: stream,
        isAudioMuted: false,
        isVideoOff: false,
        participants: {},
        callDuration: 0,
        activeCallInRoom: null,
      });
      socket.emit("join-call", { roomId });
      get().subscribeToCallEvents();
      get()._startTimer();
    } catch {
      toast.error("Could not access camera/microphone");
    }
  },

  leaveCall: () => {
    const { roomId } = get();
    const socket: Socket | null = useAuthStore.getState().socket;
    if (socket && roomId) socket.emit("leave-call", { roomId });
    get().unsubscribeFromCallEvents();
    get()._cleanupCall();
  },

  endCall: () => {
    const { roomId } = get();
    const socket: Socket | null = useAuthStore.getState().socket;
    if (socket && roomId) socket.emit("end-call", { roomId });
    get().unsubscribeFromCallEvents();
    get()._cleanupCall();
  },

  acceptIncomingCall: async () => {
    const { incomingCall } = get();
    if (!incomingCall) return;
    const socket: Socket | null = useAuthStore.getState().socket;
    if (!socket) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      set({
        localStream: stream,
        isInCall: true,
        isCallOpen: true,
        roomId: incomingCall.roomId,
        incomingCall: null,
        callDuration: 0,
        activeCallInRoom: null,
      });
      const pc = get()._createPeerConnection(incomingCall.from);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer-call", {
        roomId: incomingCall.roomId,
        targetUserId: incomingCall.from,
        answer,
      });
      get().subscribeToCallEvents();
      get()._startTimer();
    } catch {
      toast.error("Failed to accept call");
    }
  },

  rejectIncomingCall: () => set({ incomingCall: null }),

  toggleAudio: () => {
    const { localStream, isAudioMuted } = get();
    localStream?.getAudioTracks().forEach((t) => (t.enabled = isAudioMuted));
    set({ isAudioMuted: !isAudioMuted });
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    localStream?.getVideoTracks().forEach((t) => (t.enabled = isVideoOff));
    set({ isVideoOff: !isVideoOff });
  },

  toggleScreenShare: async () => {
    const { isSharingScreen, localStream, participants, roomId } = get();
    const socket: Socket | null = useAuthStore.getState().socket;
    if (isSharingScreen) {
      get().screenStream?.getTracks().forEach((t) => t.stop());
      const cameraTrack = localStream?.getVideoTracks()[0];
      if (cameraTrack) {
        Object.values(participants).forEach(({ peerConnection }) => {
          const sender = peerConnection?.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(cameraTrack);
        });
      }
      set({ isSharingScreen: false, screenStream: null });
      if (socket && roomId) socket.emit("screen-share-stopped", { roomId });
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screen.getVideoTracks()[0];
        Object.values(participants).forEach(({ peerConnection }) => {
          const sender = peerConnection?.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(screenTrack);
        });
        screenTrack.onended = () => get().toggleScreenShare();
        set({ isSharingScreen: true, screenStream: screen });
        if (socket && roomId) socket.emit("screen-share-started", { roomId });
      } catch {
        toast.error("Screen share cancelled or denied");
      }
    }
  },

  _startTimer: () => {
    const ref = setInterval(() => {
      set((s) => ({ callDuration: s.callDuration + 1 }));
    }, 1000);
    set({ callTimerRef: ref });
  },

  _stopTimer: () => {
    const { callTimerRef } = get();
    if (callTimerRef) clearInterval(callTimerRef);
    set({ callTimerRef: null, callDuration: 0 });
  },

  subscribeToCallEvents: () => {
    const socket: Socket | null = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    if (!socket || !authUser) return;
  
    socket.on("incoming-call", async ({ from, offer, roomId }) => {
      const { isInCall } = get();
      if (isInCall) {
        let pc = get().participants[from]?.peerConnection;
        if (!pc) {
          pc = get()._createPeerConnection(from);
          const { localStream } = get();
          if (localStream) localStream.getTracks().forEach((t) => pc!.addTrack(t, localStream));
        }
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer-call", { roomId, targetUserId: from, answer });
      } else {
        set({ incomingCall: { from, offer, roomId } });
      }
    });
  
    socket.on("call-answered", async ({ from, answer }) => {
      const pc = get().participants[from]?.peerConnection;
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });
  
    socket.on("ice-candidate", async ({ from, candidate }) => {
      const pc = get().participants[from]?.peerConnection;
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("ICE candidate error", e);
        }
      }
    });
  
    socket.on("participants-update", async ({ participants: ids }: { participants: string[] }) => {
      const { localStream, roomId } = get();
      const authId = authUser._id;
  
      for (const peerId of ids) {
        if (peerId === authId) continue;
        if (get().participants[peerId]?.peerConnection) continue;
  
        const pc = get()._createPeerConnection(peerId);
        if (localStream) localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
  
        // only the peer with smaller userId initiates the offer — prevents collision
        if (authId < peerId) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("call-user", { roomId, targetUserId: peerId, offer });
        }
      }
  
      Object.keys(get().participants).forEach((id) => {
        if (!ids.includes(id)) get()._removeParticipant(id);
      });
    });
  
    socket.on("call-ended", () => {
      const { isHost } = get();
      if (!isHost) toast.info("Call ended by host");
      get().unsubscribeFromCallEvents();
      get()._cleanupCall();
    });
  
    socket.on("call-denied", ({ reason }: { reason: string }) => {
      toast.error(`Could not join: ${reason}`);
      get()._cleanupCall();
    });
  
    socket.on("call-active", ({ hostId, roomId }: { hostId: string; roomId: string }) => {
      if (hostId !== authUser._id) {
        set({ activeCallInRoom: { hostId, roomId } });
      }
    });
  
    socket.on("call-inactive", () => {
      set({ activeCallInRoom: null });
    });
  },

  unsubscribeFromCallEvents: () => {
    const socket: Socket | null = useAuthStore.getState().socket;
    if (!socket) return;
    [
      "incoming-call", "call-answered", "ice-candidate",
      "participants-update", "call-ended", "call-denied",
      "call-active", "call-inactive",
    ].forEach((ev) => socket.off(ev));
  },

  _createPeerConnection: (targetUserId) => {
    const socket: Socket | null = useAuthStore.getState().socket;
    const { roomId } = get();
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socket && roomId)
        socket.emit("ice-candidate", { roomId, targetUserId, candidate });
    };
    pc.ontrack = ({ streams }) => get()._addParticipant(targetUserId, streams[0]);
    set((s) => ({
      participants: {
        ...s.participants,
        [targetUserId]: {
          userId: targetUserId,
          stream: null,
          peerConnection: pc,
          isAudioMuted: false,
          isVideoOff: false,
        },
      },
    }));
    return pc;
  },

  _addParticipant: (userId, stream) => {
    set((s) => ({
      participants: {
        ...s.participants,
        [userId]: {
          ...(s.participants[userId] ?? {
            userId,
            peerConnection: null,
            isAudioMuted: false,
            isVideoOff: false,
          }),
          stream: stream ?? s.participants[userId]?.stream ?? null,
        },
      },
    }));
  },

  _removeParticipant: (userId) => {
    set((s) => {
      const p = s.participants[userId];
      p?.peerConnection?.close();
      p?.stream?.getTracks().forEach((t) => t.stop());
      const updated = { ...s.participants };
      delete updated[userId];
      return { participants: updated };
    });
  },

  _cleanupCall: () => {
    const { localStream, screenStream, participants } = get();
    localStream?.getTracks().forEach((t) => t.stop());
    screenStream?.getTracks().forEach((t) => t.stop());
    Object.values(participants).forEach((p) => {
      p.peerConnection?.close();
      p.stream?.getTracks().forEach((t) => t.stop());
    });
    get()._stopTimer();
    set({
      isInCall: false,
      isCallOpen: false,
      isMinimized: false,
      callMode: "video",
      roomId: null,
      isHost: false,
      localStream: null,
      screenStream: null,
      isAudioMuted: false,
      isVideoOff: false,
      isSharingScreen: false,
      participants: {},
      incomingCall: null,
      activeCallInRoom: null,
    });
  },
}));
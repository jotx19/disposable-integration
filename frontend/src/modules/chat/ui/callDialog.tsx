"use client";

import { useEffect, useRef, useState } from "react";
import { useCallStore } from "@/store/useCallStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Monitor, MonitorOff, Minus, Phone, Maximize2, Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function getGridClass(count: number) {
  if (count === 1) return "grid-cols-1 grid-rows-1";
  if (count === 2) return "grid-cols-2 grid-rows-1";
  if (count <= 4) return "grid-cols-2 grid-rows-2";
  return "grid-cols-3 grid-rows-2";
}

function VideoTile({ stream, label, muted = false }: { stream: MediaStream | null; label: string; muted?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="relative w-full h-full bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center">
      {stream ? (
        <video ref={ref} autoPlay playsInline muted={muted} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-2 text-zinc-600">
          <VideoOff className="w-8 h-8" />
          <span className="text-xs">No video</span>
        </div>
      )}
      <span className="absolute bottom-3 left-3 text-xs text-white/80 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}

function IncomingCallBanner() {
  const { incomingCall, acceptIncomingCall, rejectIncomingCall } = useCallStore();
  if (!incomingCall) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-2xl px-5 py-3 shadow-2xl animate-in slide-in-from-top-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-white">Incoming call</span>
        <span className="text-xs text-zinc-400">from {incomingCall.from}</span>
      </div>
      <button onClick={rejectIncomingCall} className="p-2 rounded-full bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white transition-colors">
        <PhoneOff className="w-4 h-4" />
      </button>
      <button onClick={acceptIncomingCall} className="p-2 rounded-full bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-white transition-colors">
        <Phone className="w-4 h-4" />
      </button>
    </div>
  );
}

function ControlButton({ onClick, active, label, icon }: { onClick: () => void; active: boolean; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-2 sm:px-4 py-2 sm:py-3 rounded-xl transition-all min-w-[48px] sm:min-w-[64px]",
        active ? "bg-red-500/30 text-red-400 hover:bg-red-500/40" : "bg-white/10 text-white hover:bg-white/20"
      )}
    >
      {icon}
      <span className="text-[9px] sm:text-[10px] leading-tight text-center">{label}</span>
    </button>
  );
}

export function CallDialog() {
  const {
    isCallOpen, isMinimized, isInCall,
    localStream, participants, callMode,
    isAudioMuted, isVideoOff, isSharingScreen,
    callDuration, isHost,
    toggleAudio, toggleVideo, toggleScreenShare,
    leaveCall, endCall, minimize,
    incomingCall,
  } = useCallStore();

  const authUser = useAuthStore((s) => s.authUser);
  const selectedRoom = useChatStore((s) => s.selectedRoom);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const participantList = Object.values(participants);
  const totalCount = participantList.length + 1;

  function getParticipantName(userId: string) {
    const members = selectedRoom?.members ?? [];
    const found = members.find((m) => m._id === userId);
    return found?.name ?? userId.slice(0, 8);
  }

  if (incomingCall && !isInCall) return <IncomingCallBanner />;
  if (!isCallOpen || isMinimized) return null;

  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 bg-black"
    : "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm";

  const dialogClass = isFullscreen
    ? "relative w-full h-full bg-black"
    : "relative w-full max-w-6xl h-[96vh] bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl";

  return (
    <div className={containerClass}>
      <div className={dialogClass}>

        <div className={cn("absolute inset-0 grid gap-1 p-1", getGridClass(totalCount))}>
          <VideoTile stream={localStream} label={`${authUser?.name ?? "You"} (you)`} muted />
          {participantList.map((p) => (
            <VideoTile key={p.userId} stream={p.stream} label={getParticipantName(p.userId)} />
          ))}
        </div>

        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3 bg-black/40 backdrop-blur-md rounded-full px-3 sm:px-4 py-1.5 sm:py-2 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs sm:text-sm text-white font-mono">{formatDuration(callDuration)}</span>
            <span className="text-[10px] sm:text-xs text-white/50 capitalize">{callMode} call</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs text-white/60 bg-black/40 backdrop-blur-md rounded-full px-2 sm:px-3 py-1 sm:py-1.5 border border-white/10">
              {totalCount} participant{totalCount !== 1 && "s"}
            </span>
            <button onClick={minimize} className="p-1.5 sm:p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/60 hover:text-white hover:bg-black/60 transition-all">
              <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 sm:gap-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-2 sm:px-4 py-2 sm:py-3 shadow-2xl max-w-[95vw]">
          <ControlButton
            onClick={toggleAudio}
            active={isAudioMuted}
            label={isAudioMuted ? "Unmute" : "Mute"}
            icon={isAudioMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          />
          {callMode === "video" && (
            <ControlButton
              onClick={toggleVideo}
              active={isVideoOff}
              label={isVideoOff ? "Video" : "Stop"}
              icon={isVideoOff ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
            />
          )}
          <ControlButton
            onClick={toggleScreenShare}
            active={isSharingScreen}
            label={isSharingScreen ? "Stop" : "Share"}
            icon={isSharingScreen ? <MonitorOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />}
          />
          <ControlButton
            onClick={() => setIsFullscreen((f) => !f)}
            active={isFullscreen}
            label={isFullscreen ? "Window" : "Maximize"}
            icon={isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          />
          <div className="w-px h-8 bg-white/10 mx-0.5 sm:mx-1" />
          <button
            onClick={isHost ? endCall : leaveCall}
            className="flex flex-col items-center gap-1 px-3 sm:px-5 py-2 sm:py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9px] sm:text-[10px]">{isHost ? "End" : "Leave"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
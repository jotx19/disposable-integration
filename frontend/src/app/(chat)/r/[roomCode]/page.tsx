"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { SquareLock02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { useRoomStore } from "@/store/useRoomStore";
import SharedLogo from "@/modules/auth/ui/AuthLoader";
import GuestJoinForm, { guestErrorText, randomUsername } from "@/modules/guest/guestJoinForm";
import GuestChat from "@/modules/guest/guestChat";
import SaveChatDialog from "@/modules/guest/saveChatDialog";
import { useGuestRoom } from "@/modules/guest/useGuestRoom";

interface PublicRoomInfo {
  name: string;
  memberCount: number;
  expiresAt: string;
}

interface GuestRoomPageProps {
  params: Promise<{ roomCode: string }>;
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-svh items-center justify-center p-4 dark:bg-[#0A0A0A]">
      <div className="w-full max-w-md space-y-4 rounded-3xl bg-[#FAFAFA] p-8 text-center shadow-lg dark:bg-[#171717]">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-black/5 dark:bg-white/10">
          <HugeiconsIcon icon={SquareLock02Icon} className="size-6" />
        </div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{body}</p>
        <div className="flex justify-center gap-2 pt-2">
          <Button asChild className="rounded-xl">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function GuestRoomPage({ params }: GuestRoomPageProps) {
  const { roomCode } = use(params);
  const router = useRouter();
  const { checkAuth, signup } = useAuthStore();
  const { setPendingRoomId } = useRoomStore();
  const guest = useGuestRoom(roomCode);

  const [phase, setPhase] = useState<"checking" | "form" | "private">("checking");
  const [info, setInfo] = useState<PublicRoomInfo | null>(null);
  const [initialUsername, setInitialUsername] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // Signed-in people join as members instead.
      if (localStorage.getItem("jwt")) {
        await checkAuth();
        if (cancelled) return;
        if (useAuthStore.getState().authUser) {
          router.replace(`/join/${roomCode}`);
          return;
        }
      }
      try {
        const { data } = await axiosInstance.get<{ isPublic: boolean } & Partial<PublicRoomInfo>>(
          `/room/public/${roomCode}`
        );
        if (cancelled) return;
        if (!data.isPublic) {
          setPhase("private");
          return;
        }
        setInfo({ name: data.name!, memberCount: data.memberCount ?? 0, expiresAt: data.expiresAt! });
        let saved: string | null = null;
        try {
          saved = sessionStorage.getItem(`guest-name:${roomCode}`);
        } catch {}
        setInitialUsername(saved || randomUsername());
        setPhase("form");
      } catch {
        if (!cancelled) setPhase("private");
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [roomCode, checkAuth, router]);

  const handleSave = async (data: { name: string; email: string; password: string }) => {
    const claimToken = guest.beginClaim();
    const res = await signup({ ...data, claimToken: claimToken ?? undefined });
    if (!res) {
      guest.cancelClaim();
      return false;
    }
    setSaveOpen(false);
    guest.leave();
    if (res.claimedRoomId) {
      toast.success("Chat saved. Welcome to the room!");
      setPendingRoomId(res.claimedRoomId);
      router.push("/chat");
    } else {
      toast.info("Account created, but your guest session had ended so those messages couldn't be saved.");
      router.push(`/join/${roomCode}`);
    }
    return true;
  };

  if (phase === "checking") return <SharedLogo />;

  if (phase === "private") {
    return (
      <Notice
        title="This room isn't open to guests"
        body="It's private, it has expired, or the link is wrong. Sign in to join if you're a member."
      />
    );
  }

  if (guest.status === "closed") {
    return (
      <Notice
        title="You're no longer in this room"
        body={
          guestErrorText(guest.error) ??
          "The room closed your guest session. Your unsaved messages were removed."
        }
      />
    );
  }

  const inChat =
    guest.room && guest.you && (guest.status === "connected" || guest.status === "reconnecting");

  if (inChat) {
    return (
      <>
        <GuestChat
          room={guest.room!}
          you={guest.you!}
          messages={guest.messages}
          guests={guest.guests}
          status={guest.status}
          lostMessages={guest.lostMessages}
          onDismissLost={guest.dismissLostMessages}
          onSend={guest.send}
          onSaveChat={() => setSaveOpen(true)}
          onLeave={() => {
            guest.leave();
            toast("You left the room. Your unsaved messages were removed.");
          }}
        />
        <SaveChatDialog
          open={saveOpen}
          onOpenChange={setSaveOpen}
          roomName={guest.room!.name}
          username={guest.you!.username}
          onSave={handleSave}
        />
      </>
    );
  }

  return (
    <GuestJoinForm
      key={initialUsername}
      room={info!}
      initialUsername={initialUsername}
      connecting={guest.status === "connecting"}
      error={guest.error}
      onJoin={guest.join}
    />
  );
}

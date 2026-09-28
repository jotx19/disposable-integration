"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, GlobalIcon, Loading03Icon, RefreshIcon, UserIcon, Clock01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatTimeLeft } from "@/lib/roomTtl";
import type { GuestError } from "./useGuestRoom";

const ADJECTIVES = ["swift", "quiet", "brave", "lucky", "sunny", "clever", "cosmic", "mellow", "rapid", "tiny"];
const ANIMALS = ["otter", "panda", "falcon", "koala", "lynx", "gecko", "heron", "badger", "fox", "whale"];

export function randomUsername() {
  const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];
  return `${pick(ADJECTIVES)}-${pick(ANIMALS)}-${Math.floor(10 + Math.random() * 90)}`;
}

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,30}$/;

const ERROR_TEXT: Record<GuestError, string> = {
  username_taken: "That username is taken. Try another one.",
  invalid_username: "3-30 characters: letters, numbers, dots, dashes or underscores.",
  room_unavailable: "This room isn't public anymore, or it has expired.",
  room_private: "The owner made this room private.",
  room_deleted: "This room was deleted.",
  connection_failed: "Couldn't reach the server. Check your connection and try again.",
};

export function guestErrorText(error: GuestError | null) {
  return error ? ERROR_TEXT[error] : null;
}

interface GuestJoinFormProps {
  room: { name: string; memberCount: number; expiresAt: string };
  initialUsername: string;
  connecting: boolean;
  error: GuestError | null;
  onJoin: (username: string) => void;
}

export default function GuestJoinForm({
  room,
  initialUsername,
  connecting,
  error,
  onJoin,
}: GuestJoinFormProps) {
  const [username, setUsername] = useState(initialUsername);
  const trimmed = username.trim();
  const valid = USERNAME_PATTERN.test(trimmed);
  const errorText = guestErrorText(error);
  const showError = !!errorText || (!valid && trimmed.length > 0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xs flex-col items-center justify-center px-4 md:max-w-md">
      <div className="grid w-full gap-3">
        <div className="my-4 flex items-center justify-between gap-3">
          <h1 className="min-w-0 truncate text-xl font-medium">#{room.name}</h1>
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-500/10 px-2.5 text-sm font-medium text-blue-600 dark:text-blue-400">
              <HugeiconsIcon icon={GlobalIcon} className="h-4 w-4" />
              Public
            </span>
            <Button title="back to homepage" variant="outline" size="icon" className="h-8 w-8" asChild>
              <Link href="/">
                <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <p className="-mt-2.5 flex max-w-xs items-center gap-5 text-base text-foreground/80">
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon icon={UserIcon} className="h-4 w-4" aria-label="Members" />
            <span className="tabular-nums">{room.memberCount}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon icon={Clock01Icon} className="h-4 w-4" aria-label="Time left" />
            <span className="tabular-nums">{formatTimeLeft(new Date(room.expiresAt))}</span>
          </span>
        </p>
      </div>

      <div className="mt-10 w-full">
        <form
          className="grid gap-2"
          autoComplete="off"
          data-form-type="other"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid && !connecting) onJoin(trimmed);
          }}
        >
          <Label htmlFor="guest-handle">Choose your unique name</Label>
          <div className="relative">
            <Input
              className="py-4 pr-10"
              id="guest-handle"
              name="guest-handle"
              placeholder="swift-otter-42"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
              autoFocus
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
              aria-invalid={showError}
              aria-describedby={showError ? "guest-handle-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setUsername(randomUsername())}
              aria-label="Suggest another name"
              title="Suggest another name"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <HugeiconsIcon icon={RefreshIcon} className="h-4 w-4" />
            </button>
          </div>

          {showError ? (
            <p id="guest-handle-error" className="mt-1.5 text-center text-xs text-destructive">
              {errorText ?? ERROR_TEXT.invalid_username}
            </p>
          ) : (
            <p className="mt-1.5 text-center text-sm text-muted-foreground">
              Already have account.{" "}
              <Link href="/sign-in" className="text-foreground/80 underline hover:text-foreground">
                Sign in
              </Link>
            </p>
          )}

          <Button
            variant="elevated"
            type="submit"
            disabled={!valid || connecting}
            className="mt-2 w-1/2 bg-white mx-auto dark:text-black dark:border-black rounded-xl"
          >
            {connecting ? (
              <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin" />
            ) : (
              "Join as guest"
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}

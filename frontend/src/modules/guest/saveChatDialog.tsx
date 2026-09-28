"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,30}$/;

// Same bar as the regular sign-up form: at least 3 of these 4.
function isStrongPassword(password: string) {
  return (
    [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length >= 3
  );
}

interface SaveChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomName: string;
  username: string;
  // Signs up and claims the guest session; resolves once done.
  onSave: (data: { name: string; email: string; password: string }) => Promise<boolean>;
}

export default function SaveChatDialog({
  open,
  onOpenChange,
  roomName,
  username,
  onSave,
}: SaveChatDialogProps) {
  const isSigningUp = useAuthStore((s) => s.isSigningUp);
  const [name, setName] = useState(username);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const nameValid = USERNAME_PATTERN.test(name.trim());
  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const passwordValid = isStrongPassword(password);
  const canSubmit = nameValid && emailValid && passwordValid && !isSigningUp;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save this chat</DialogTitle>
          <DialogDescription>
            Create an account and your messages in #{roomName} are kept until the
            room expires. You&apos;ll join as a member.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!canSubmit) return;
            await onSave({ name: name.trim(), email: email.trim(), password });
          }}
        >
          <div className="space-y-1.5">
            <label htmlFor="save-name" className="text-xs font-medium">
              Username
            </label>
            <Input
              id="save-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              autoComplete="username"
              aria-invalid={!nameValid}
              className="h-10 rounded-xl font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="save-email" className="text-xs font-medium">
              Email
            </label>
            <Input
              id="save-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="save-password" className="text-xs font-medium">
              Password
            </label>
            <div className="relative">
              <Input
                id="save-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="h-10 rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
              >
                <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} className="size-4" />
              </button>
            </div>
            {password && !passwordValid && (
              <p className="text-xs text-muted-foreground">
                Use 8+ characters with an uppercase letter, a number or a symbol.
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="h-11 w-full rounded-2xl bg-blue-500 text-white hover:bg-blue-600"
          >
            {isSigningUp && <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />}
            Sign up & save chat
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

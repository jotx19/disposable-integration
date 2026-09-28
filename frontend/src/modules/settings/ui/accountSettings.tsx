"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/store/useAuthStore";
import { SettingsHeader, SettingsRow } from "./settingsSection";

export default function AccountSettings({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { authUser, deleteAccount, isDeletingAccount } = useAuthStore();
  const [confirmation, setConfirmation] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!authUser) return null;

  const phrase = `sudo delete ${authUser.name}`;
  const confirmed = confirmation === phrase;

  const handleDelete = async () => {
    if (!confirmed) return;
    const ok = await deleteAccount(confirmation);
    if (ok) {
      setConfirmOpen(false);
      onClose();
      router.push("/");
    }
  };

  return (
    <div className="space-y-2">
      <SettingsHeader
        title="Account"
        description="Your sign-in details and account controls."
      />

      <SettingsRow label="Email" description="Used to sign in. It can't be changed.">
        <Input value={authUser.email} readOnly disabled className="h-10 rounded-xl" />
      </SettingsRow>

      <SettingsRow label="Profile picture">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={authUser.profilepic || undefined} alt={authUser.name} />
            <AvatarFallback className="bg-blue-500 text-white">
              {authUser.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => {
              onClose();
              router.push("/profile");
            }}
          >
            Change photo
          </Button>
        </div>
      </SettingsRow>

      <SettingsRow
        label="Delete account"
        description="Permanently deletes your account, every room you created and all messages you sent. This can't be undone."
        className="rounded-xl"
      >
        <AlertDialog
          open={confirmOpen}
          onOpenChange={(open) => {
            setConfirmOpen(open);
            if (!open) setConfirmation("");
          }}
        >
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="rounded-xl">
              Delete account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <HugeiconsIcon icon={Alert02Icon} className="size-5 text-destructive" />
                Delete your account?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This removes <strong>{authUser.name}</strong>, deletes every room
                you created for all its members, and erases all your messages.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <label htmlFor="delete-confirm" className="text-sm">
                To confirm, type{" "}
                <code className="select-all rounded-md bg-secondary px-1.5 py-0.5 font-mono text-xs">
                  {phrase}
                </code>
              </label>
              <Input
                id="delete-confirm"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleDelete()}
                placeholder={phrase}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                autoFocus
                className="h-10 rounded-xl font-mono"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                className="rounded-xl"
                disabled={!confirmed || isDeletingAccount}
                onClick={handleDelete}
              >
                {isDeletingAccount && (
                  <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
                )}
                Delete forever
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SettingsRow>
    </div>
  );
}

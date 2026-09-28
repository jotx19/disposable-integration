"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { DEFAULT_ROOM_TTL_HOURS } from "@/lib/roomTtl";
import { SettingsHeader, SettingsRow } from "./settingsSection";
import TtlPicker from "./ttlPicker";

export default function GeneralSettings() {
  const { authUser, updateAccount, isUpdatingAccount } = useAuthStore();
  const savedTtl = authUser?.defaultRoomTtlHours ?? DEFAULT_ROOM_TTL_HOURS;

  const [name, setName] = useState(authUser?.name ?? "");
  const [ttl, setTtl] = useState<number>(savedTtl);

  if (!authUser) return null;

  const trimmed = name.trim();
  const nameChanged = trimmed !== authUser.name;
  const ttlChanged = ttl !== savedTtl;
  const nameValid = /^[a-zA-Z0-9._-]{3,30}$/.test(trimmed);

  const handleSave = async () => {
    await updateAccount({
      ...(nameChanged && { name: trimmed }),
      ...(ttlChanged && { defaultRoomTtlHours: ttl }),
    });
  };

  return (
    <div className="space-y-2">
      <SettingsHeader
        title="General"
        description="Your username and defaults for new rooms."
      />

      <SettingsRow
        label="Username"
        description="Shown to everyone in your rooms."
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          aria-invalid={nameChanged && !nameValid}
          className="h-10 rounded-xl"
        />
        {nameChanged && !nameValid && (
          <p className="mt-1.5 text-xs text-destructive">
            3-30 characters: letters, numbers, dots, dashes or underscores.
          </p>
        )}
      </SettingsRow>

      <SettingsRow
        label="Default room lifetime"
        description="Rooms you create auto-delete, with all their messages, after this long. You can still change it per room."
        stacked
      >
        <TtlPicker value={ttl} onChange={setTtl} />
      </SettingsRow>

      <div className="pt-2">
        <Button
          onClick={handleSave}
          disabled={
            isUpdatingAccount ||
            (!nameChanged && !ttlChanged) ||
            (nameChanged && !nameValid)
          }
          className="rounded-xl bg-blue-500 text-white hover:bg-blue-600"
        >
          {isUpdatingAccount && (
            <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
          )}
          Save changes
        </Button>
      </div>
    </div>
  );
}

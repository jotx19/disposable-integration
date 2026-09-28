"use client";

import { useState } from "react";
import {
  MessageMultiple01Icon,
  SlidersHorizontalIcon,
  Sun03Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import SettingsLayout, { SettingsNavGroup } from "./settingsLayout";
import GeneralSettings from "./generalSettings";
import AccountSettings from "./accountSettings";
import RoomSettings from "./roomSettings";
import AppearanceSettings from "./appearanceSettings";

type Tab = "general" | "account" | "rooms" | "appearance";

const NAV: SettingsNavGroup<Tab>[] = [
  {
    items: [
      { id: "general", label: "General", icon: SlidersHorizontalIcon },
      { id: "account", label: "Account", icon: UserIcon },
      { id: "rooms", label: "Rooms", icon: MessageMultiple01Icon },
    ],
  },
  {
    group: "Customize",
    items: [{ id: "appearance", label: "Appearance", icon: Sun03Icon }],
  },
];

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [tab, setTab] = useState<Tab>("general");
  const close = () => onOpenChange(false);

  return (
    <SettingsLayout
      open={open}
      onOpenChange={onOpenChange}
      title="Settings"
      description="Manage your account, rooms and appearance."
      nav={NAV}
      tab={tab}
      onTabChange={setTab}
    >
      {tab === "general" && <GeneralSettings />}
      {tab === "account" && <AccountSettings onClose={close} />}
      {tab === "rooms" && <RoomSettings />}
      {tab === "appearance" && <AppearanceSettings />}
    </SettingsLayout>
  );
}

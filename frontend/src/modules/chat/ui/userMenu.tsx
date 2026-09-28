"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { UnfoldMoreIcon, Home01Icon, Logout03Icon, Moon02Icon, PaintBoardIcon, Add01Icon, Sun03Icon, UserIcon, Settings02Icon } from "@hugeicons/core-free-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/useAuthStore";
import SettingsDialog from "@/modules/settings/ui/settingsDialog";

const getInitials = (name: string) =>
  name
    .split(/[\s\-_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export default function UserMenu() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { authUser, logout } = useAuthStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!authUser) return null;

  const initials = getInitials(authUser.name);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <>
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent transition outline-none">
          <Avatar className="size-9">
            <AvatarImage src={authUser.profilepic || undefined} alt={authUser.name} />
            <AvatarFallback className="bg-blue-500 text-white text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-medium">{authUser.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {authUser.email}
            </div>
          </div>
          <HugeiconsIcon icon={UnfoldMoreIcon} className="size-4 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-2xl p-1.5 [&_[data-slot=dropdown-menu-item]]:py-2 [&_[data-slot=dropdown-menu-sub-trigger]]:py-2"
      >
        <DropdownMenuLabel className="flex items-center gap-3 font-normal">
          <Avatar className="size-9">
            <AvatarImage src={authUser.profilepic || undefined} alt={authUser.name} />
            <AvatarFallback className="bg-blue-500 text-white text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{authUser.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {authUser.email}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/chat/create")}>
            <HugeiconsIcon icon={Add01Icon} />
            New room
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            <HugeiconsIcon icon={UserIcon} />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
            <HugeiconsIcon icon={Settings02Icon} />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <HugeiconsIcon icon={PaintBoardIcon} className="size-4 text-muted-foreground" />
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="rounded-xl">
              <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                <DropdownMenuRadioItem value="light">
                  <HugeiconsIcon icon={Sun03Icon} />
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <HugeiconsIcon icon={Moon02Icon} />
                  Dark
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push("/")}>
          <HugeiconsIcon icon={Home01Icon} />
          Home
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <HugeiconsIcon icon={Logout03Icon} />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}

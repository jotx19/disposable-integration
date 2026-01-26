"use client";

import { Home, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signIn, signOut, useSession } from "next-auth/react";
import DiscordIcon from "./discordIcon";

export default function DiscordNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="fixed bg-transparent z-[9999] bottom-4 left-0 right-0">
      <div className="backdrop-blur-lg overflow-hidden border border-border p-2 rounded-full shadow-md w-fit flex mx-auto gap-1.5 items-center">
        <Button
          className={cn(
            "rounded-2xl group transition",
            pathname === "/" && "bg-secondary"
          )}
          variant="ghost"
          asChild
        >
          <Link href="/" className="flex items-center gap-2 rounded-full">
            <Home className="h-5 w-5" />
            Home
          </Link>
        </Button>

        {session ? (
          <>
            <Link
              href="https://discord.com/app"
              target="_blank"
              className="flex items-center hover:scale-105 transition"
            >
              <div className="inline-flex items-center border bg-[#5865F2] rounded-full px-3 py-2 gap-2">
                <DiscordIcon className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {session.user?.name}
                </span>
              </div>
            </Link>

            <Button
              className="rounded-full group transition"
              size="icon"
              variant="ghost"
              onClick={() => signOut()}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </>
        ) : (
          <Button
            className="rounded-full group transition"
            size="icon"
            variant="ghost"
            onClick={() => signIn("discord")}
          >
            <LogIn className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}

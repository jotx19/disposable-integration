"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Home01Icon, Login03Icon, Logout03Icon, UserIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

export default function Menu() {
  const page = usePathname();
  const router = useRouter();
  const { authUser, logout } = useAuthStore();

  return (
    <div className="fixed bg-transparent z-[9999] bottom-4 left-0 right-0">
      <div className="backdrop-blur-lg overflow-hidden border border-border p-2 rounded-full shadow-md w-fit flex mx-auto gap-1.5">
        <Button
          className={cn(
            "rounded-2xl group transition",
            page === "/" && "bg-secondary"
          )}
          variant="ghost"
          asChild
        >
          <Link
            href="/"
            className="flex items-center justify-center rounded-full"
          >
            <HugeiconsIcon icon={Home01Icon} className="size-6" />
            Home
          </Link>
        </Button>

        {authUser && (
          <Button
            className={cn(
              "size-12 rounded-2xl group transition",
              page === "/profile" && "bg-secondary"
            )}
            size="icon"
            variant="ghost"
            onClick={() => router.push("/profile")}
          >
            <HugeiconsIcon icon={UserIcon} className="size-6" />
          </Button>
        )}

        {authUser ? (
          <Button
            className="size-12 rounded-full group transition bg-red-500/15 text-red-500 hover:bg-red-500/25 hover:text-red-500"
            size="icon"
            variant="ghost"
            aria-label="Log out"
            onClick={logout}
          >
            <HugeiconsIcon icon={Logout03Icon} className="size-6" />
          </Button>
        ) : (
          <Button
            className={cn(
              "size-12 rounded-full group transition",
              page === "/sign-in" && "bg-secondary"
            )}
            asChild
            size="icon"
          >
            <Link href="/sign-in" className="flex items-center justify-center">
              <HugeiconsIcon icon={Login03Icon} className="size-6" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

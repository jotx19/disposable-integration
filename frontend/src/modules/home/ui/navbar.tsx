"use client";

import { Home, LogIn, LogOut, User } from "lucide-react";
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
    <div className="fixed z-[9999] bottom-4 left-0 right-0">
      <div className="bg-background overflow-hidden border border-border p-2 rounded-full shadow-md w-fit flex mx-auto gap-1.5">
        {/* Home */}
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
            <Home className="h-6 w-6" />
            Home
          </Link>
        </Button>

        {authUser && (
          <Button
            className={cn(
              "rounded-xl m-1 group transition",
              page === "/profile" && "bg-secondary"
            )}
            size="icon"
            variant="ghost"
            onClick={() => router.push("/profile")}
          >
            <User className="!h-5 !w-5" />
          </Button>
        )}

        {authUser ? (
          <Button
            className="rounded-xl m-1 group transition"
            size="icon"
            variant="ghost"
            onClick={logout}
          >
            <LogOut className="!h-5 !w-5" />
          </Button>
        ) : (
          <Button
            className={cn(
              "rounded-xl m-1 group transition",
              page === "/sign-in" && "bg-secondary"
            )}
            asChild
            size="icon"
          >
            <Link href="/sign-in" className="flex items-center justify-center">
              <LogIn className="!h-5 !w-5" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

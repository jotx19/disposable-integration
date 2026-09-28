"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import AuthLoader from "@/modules/auth/ui/AuthLoader";

const ProfilePage = () => {
  const { authUser, checkAuth, isCheckingAuth, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isCheckingAuth && !authUser) {
      router.replace("/");
    }
  }, [authUser, isCheckingAuth, router]);

  if (isCheckingAuth) {
    return (
      <div className="max-w-6xl w-full mx-auto mt-20 p-6">
        <Card className="p-6 border rounded-lg">
          <div className="flex items-center gap-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!authUser) {
    return <AuthLoader />;
  }

  return (
    <div className="max-w-6xl mx-auto w-full mt-20 p-6">
      <Card className="p-6 border rounded-lg">
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20">
            {authUser.profilepic && (
              <AvatarImage src={authUser.profilepic} alt={authUser.name} className="object-cover" />
            )}
            <AvatarFallback className="text-xl">{getInitials(authUser.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold">{authUser.name}</h2>
            <p className="text-gray-500 text-sm">{authUser.email}</p>
          </div>
        </div>
        <div className="border-t mt-4" />
        <div className="mt-6 flex gap-4">
          <Button variant="destructive" onClick={logout}>
            Logout
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;

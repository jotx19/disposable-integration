"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronLeft, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

export default function signInPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isLoggingIn = useAuthStore((state) => state.isLoggingIn);
  const authUser = useAuthStore((state) => state.authUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (authUser) router.push("/");
  }, [authUser]);

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    const user = await login({ email, password });
    if (user) router.push("/");
    setEmail("");
    setPassword("");
  };

  return (
    <main className="w-full md:max-w-md max-w-xs mx-auto px-4 flex flex-col justify-center items-center min-h-screen">
      <div className="grid gap-3 w-full">
        <div className="flex items-center justify-between my-4">
          <h1 className="text-xl font-medium">Welcome Back</h1>
          <Button
            title="back to homepage"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            asChild
          >
            <Link href="/">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <p className="text-base max-w-xs text-foreground/80 -mt-2.5">
          Sign in to your account to continue. Don't have an account?{" "}
          <Link className="text-foreground underline" href="/signup">
            SignUp
          </Link>
        </p>
      </div>

      <div className="mt-10 w-full">
        <form onSubmit={handleSignin} className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            className="py-4"
            id="email"
            name="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
          />

          <Label htmlFor="password" className="mt-2">
            Password
          </Label>
          <div className="relative">
            <Input
              className="py-4 pr-10" // extra padding for the eye icon
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="**********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="text-center">
            <Popover>
              <PopoverTrigger>
                <p className="text-sm text-foreground/80 hover:underline cursor-pointer">
                  Forgot your account details?
                </p>
              </PopoverTrigger>
              <PopoverContent className="text-sm -mr-20">
                Your password is encrypted and cannot be retrieved. Try creating
                a new account!
              </PopoverContent>
            </Popover>
          </div>

          <Button
            variant="elevated"
            type="submit"
            className="mt-2 w-1/2 bg-white mx-auto dark:text-black dark:border-black rounded-xl"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
          </Button>
        </form>
      </div>
    </main>
  );
}

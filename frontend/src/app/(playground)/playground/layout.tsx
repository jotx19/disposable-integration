"use client";
export const dynamic = "force-dynamic";


import "@/app/globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import DiscordNavbar from "@/modules/playground/ui/dNavbar";
import { SessionProvider } from "next-auth/react";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <ThemeProvider>
      <SessionProvider>
        <div className="flex flex-col min-h-screen bg-[#F4F4F0] dark:bg-background">
          <DiscordNavbar />
          <main className="flex-1">{children}</main>
        </div>
      </SessionProvider>
    </ThemeProvider>
  );
};

export default Layout;

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageCircleDashed } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-4 z-50 mx-auto max-w-5xl flex items-center justify-between backdrop-blur-xl rounded-full h-14 px-2 border">
      <Link href="/" className="font-bold px-6 text-lg">
      <MessageCircleDashed className="inline-block mr-2 mb-1 text-amber-400" />
      </Link>

      <Button className="px-4 py-1 rounded-full">
        Get Started
      </Button>
    </header>
  );
}

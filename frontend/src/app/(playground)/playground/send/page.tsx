"use client";
export const dynamic = "force-dynamic";

import React, { Suspense } from "react";
import SendClient from "@/modules/playground/views/send-client";
import { LoaderCircle } from "lucide-react";

export default function SendPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <LoaderCircle className="h-10 w-10 animate-spin" />
        </div>
      }
    >
      <SendClient />
    </Suspense>
  );
}

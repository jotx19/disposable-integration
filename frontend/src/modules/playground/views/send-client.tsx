"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Clipboard, Send, LoaderCircle, Lock } from "lucide-react";
import DiscordIcon from "@/modules/playground/ui/discordIcon";


export default function SendClient() {
  const { data: session, status } = useSession();
  const params = useSearchParams();
  const guildId = params.get("guild");

  const [text, setText] = useState("");
  const [filename, setFilename] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      toast.error("You must be signed in to send a PDF");
    }
  }, [status]);

  if (status === "loading") {

    return (
      <div className="flex justify-center items-start min-h-screen p-6">
        <Card className="w-full max-w-3xl animate-pulse">
          <CardHeader>
            <div className="h-8 w-1/2 bg-gray-300 dark:bg-gray-700 rounded mb-3"></div>
            <div className="h-5 w-1/3 bg-gray-200 dark:bg-gray-600 rounded"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-12 w-full bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-60 w-full bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-14 w-full bg-gray-300 dark:bg-gray-700 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 dark:bg-[#0A0A0A]">
        <div>
          <Card className="w-full max-w-5xl bg-[#FAFAFA] dark:bg-[#171717] rounded-xl shadow-lg p-10 flex flex-col justify-center items-center">
            <Lock className="h-8 w-7 mb-4" />
            <h2 className="text-md font-semibold mb-2 text-center">
              You must be signed in to send a PDF
            </h2>
            <button
              onClick={() => signIn("discord")}
              >
              <div className="inline-flex items-center border bg-[#5865F2] hover:scale-105 rounded-full px-3 py-2 gap-2">
                <DiscordIcon className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Sign in with Discord
                </span>
              </div>
              
            </button>
          </Card>
        </div>
      </div>
    );
  }

  const handleSendPDF = async () => {
    if (!text || !filename || !guildId) {
      toast.error("Text, filename are required");
      return;
    }

    setSending(true);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BOT_API_URL}/SendPDFToGuild`,
        { text, filename, guild_id: guildId },
        { headers: { "Content-Type": "application/json" } }
      );

      toast.success("PDF sent successfully");
      setText("");
      setFilename("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send PDF");
    } finally {
      setSending(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      setText(clipText);
      toast.success("Pasted from clipboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to read clipboard");
    }
  };

  return (
    <div className="flex justify-center items-start p-6 pb-24">
      <Card className="w-full max-w-5xl bg-background">
        <CardHeader>
          <CardTitle className="flex items-center mx-auto gap-2 text-3xl">
            Notebook
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-lg font-medium">Filename
            </label>
            <Input
              placeholder="Filename (without .pdf)"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-lg font-medium">
              <Clipboard className="h-5 w-5 text-gray-500" /> Content
            </label>
            <Textarea
              placeholder="Paste or type your content here…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[250px] text-lg"
            />
            <Button
              onClick={handlePasteClipboard}
              variant="outline"
              size="sm"
              className="w-fit mt-1 flex items-center gap-2"
            >
              <Clipboard /> Paste from Clipboard
            </Button>
          </div>

          <Button
            onClick={handleSendPDF}
            disabled={sending}
            size="lg"
            className="w-full flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Send className="h-5 w-5" />
                Sending PDF
                <LoaderCircle className="h-5 w-5 animate-spin" />
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Send PDF
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

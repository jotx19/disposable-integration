"use client";

import { useRef, useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import { X, Plus, Forward } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function ChatMessageInput() {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { sendMessage, selectedRoom } = useChatStore();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async () => {
    if (!text.trim() && !imagePreview) return;

    if (!selectedRoom?._id) {
      toast.error("Please select a room first");
      return;
    }

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        roomId: selectedRoom._id,
      });

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!selectedRoom) {
    return (
      <div className="text-center text-sm text-muted-foreground p-3">
        Please select a room to start chatting
      </div>
    );
  }

  return (
    <div className="w-full border-t border-border p-3">
      {imagePreview && (
        <div className="relative w-24 h-24 mb-3">
          <Image
            src={imagePreview}
            alt="Preview"
            fill
            className="object-cover rounded-lg border"
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-start gap-2 w-full bg-none backdrop-blur-md border border-border rounded-xl px-3 py-1 shadow-sm">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleImageChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full hover:bg-muted transition"
        >
          <Plus className="h-5 w-5 text-muted-foreground" />
        </button>

        <Textarea
          value={text}
          placeholder="Sending message!"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex tracking-tight resize-none font-mono md:h-20 h-15 border-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[120px] overflow-y-auto"
          rows={1}
        />

        <Button
          onClick={handleSendMessage}
          className="rounded-full"
          size="icon"
          disabled={!text.trim() && !imagePreview}
        >
            <Forward className="h-5 w-5" />
        </Button>
      </div>

      <div className="hidden md:block justify-start px-3 mt-1">
        <p className="text-xs">Press <Badge  className="font-mono" variant={'secondary'}>Enter</Badge> to send · <Badge  className="font-mono" variant={'secondary'}>Shift</Badge> + <Badge  className="font-mono" variant={'secondary'}>Enter</Badge> for newline</p>
      </div>
    </div>
  );
}

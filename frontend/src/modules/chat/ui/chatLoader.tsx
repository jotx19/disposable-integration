"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function EmptyRoom() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-center w-80 h-80 rounded-full bg-secondary/30 shadow-md mb-4 overflow-hidden"
      >
        <Image
          src="/glossy.png"
          alt="Empty room illustration"
          width={200}
          height={300}
          className="object-contain"
          priority
        />
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-xl font-semibold"
      >
        No Room Selected
      </motion.h2>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-muted-foreground mt-2 max-w-sm"
      >
        Choose a chat room from the sidebar and start the conversation.
      </motion.p>
    </div>
  );
}

"use client";

import React from "react";

const MessageSkeleton: React.FC = () => {
  const skeletonMessages = Array.from({ length: 6 });

  return (
    <div className="flex-1 overflow-y-auto space-y-4">
      {skeletonMessages.map((_, idx) => {
        const isUserMessage = idx % 2 === 1;

        return (
          <div
            key={idx}
            className={`flex ${isUserMessage ? "justify-end" : "justify-start"}`}
          >
            <div className="flex items-center space-x-2">
              {!isUserMessage && (
                <div className="w-10 h-10 rounded-full bg-[#F5F5F5] dark:bg-gray-900 animate-pulse" />
              )}
              <div>
                <div className="mb-1 h-4 w-16 bg-[#F5F5F5] dark:bg-gray-900 animate-pulse rounded" />
                <div className="h-16 w-[300px] bg-[#F5F5F5] dark:bg-gray-900 animate-pulse rounded-lg" />
              </div>

              {isUserMessage && (
                <div className="w-10 h-10 rounded-full bg-[#F5F5F5] dark:bg-gray-900 animate-pulse" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageSkeleton;

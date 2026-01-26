"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import DiscordIcon from "@/modules/playground/ui/discordIcon";

interface DiscordGuild {
  id: string;
  name: string;
  owner: boolean;
  permissions: number;
}

export default function PlaygroundPage() {
  const { data: session } = useSession();
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!session) return;

    const fetchGuilds = async () => {
      const res = await fetch("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const data: DiscordGuild[] = await res.json();
      const owned = data.filter((g) => g.owner);
      setGuilds(owned);
    };

    fetchGuilds();
  }, [session]);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 dark:bg-[#0A0A0A]">
        <div className="w-full max-w-4xl h-[74vh] bg-[#FAFAFA] dark:bg-[#171717] rounded-xl shadow-lg p-6 flex flex-col">
          <div className="flex flex-col mb-4">
            <div className="h-6 w-1/3 bg-gray-300 dark:bg-gray-700 rounded mx-auto animate-pulse mb-5"></div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ul className="space-y-3 pt-6 md:w-2/3 mx-auto">
              {Array.from({ length: 5 }).map((_, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center bg-gray-200 hover:bg-gray-100 
                     dark:bg-gray-800 rounded-xl p-4 
                     dark:hover:bg-gray-700 hover:text-white transition cursor-pointer"
                >
                  <div className="h-4 w-1/2 bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-4 w-6 bg-gray-600 rounded animate-pulse"></div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }
  

  return (
    <div className="flex items-center justify-center min-h-screen p-4 dark:bg-[#0A0A0A]">
      <div className="w-full max-w-4xl h-[74vh] bg-[#FAFAFA] dark:bg-[#171717] rounded-xl shadow-lg p-6 flex flex-col">
        <div className="flex flex-col mb-4">
          <Badge
            variant="secondary"
            className="md:text-3xl text-xl font-semibold text-center mx-auto mb-1"
          >
            Welcome, {session.user?.name}
          </Badge>
          <p className="md:text-sm text-[10px] text-muted-foreground text-center">
            Servers you own are listed below
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {guilds.length === 0 ? (
            <ul className="space-y-3 pt-9 md:w-2/3 mx-auto">
              {Array.from({ length: 5 }).map((_, idx) => (
                <li
                  key={idx}
                    className="flex justify-between items-center bg-gray-200 hover:bg-gray-100 
                 dark:bg-gray-800 rounded-xl p-4 
                 dark:hover:bg-gray-700 hover:text-white transition cursor-pointer"
                  >
                  <div className="h-4 w-1/2 bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-4 w-6 bg-gray-600 rounded animate-pulse"></div>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-3 pt-6 md:w-2/3 mx-auto">
              {guilds.map((g) => (
                <li
                  key={g.id}
                    className="flex justify-between items-center bg-gray-200 
                 dark:bg-gray-800 rounded-xl p-4 transition cursor-pointer"
                  >
                  <span className="font-medium dark:text-white">
                    {g.name}
                  </span>

                  <div className="flex items-center gap-3">
                    <a
                      href={`https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_BOT_ID}&scope=bot&permissions=8&guild_id=${g.id}`}
                      target="_blank"
                      className="text-sm text-[#5865F2] hover:underline"
                    >
                      <DiscordIcon className="inline-block mr-1 hover:scale-150 transition-all" /> 
                    </a>

                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={() =>
                        router.push(`/playground/send?guild=${g.id}`)
                      }
                    >
                      Send PDF
                      <ArrowRight className="-rotate-45 ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

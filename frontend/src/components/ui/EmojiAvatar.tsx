import { cn } from "@/lib/utils";

const emojis = ["😀", "😎", "🔥", "🚀", "💡", "🌟", "🎨", "💥", "💎", "🦄"];
const colors = [
  "bg-red-500",
  "bg-green-500",
  "bg-blue-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-teal-500",
];

const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

interface EmojiAvatarProps {
  className?: string; // for custom sizing & styling
}

const EmojiAvatar: React.FC<EmojiAvatarProps> = ({ className }) => {
  const emoji = getRandomElement(emojis);
  const bgColor = getRandomElement(colors);

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full text-white font-bold",
        bgColor,
        className
      )}
    >
      <span className={cn("text-center", className ? "text-[inherit]" : "text-4xl")}>{emoji}</span>
    </div>
  );
};

export default EmojiAvatar;

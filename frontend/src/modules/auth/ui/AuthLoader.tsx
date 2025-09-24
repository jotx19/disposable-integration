import { MessageCircleDashed } from "lucide-react";

export default function Preloader() {
  return (
    <div className="flex bg-background items-center justify-center absolute h-full w-full z-[999999] top-0 left-0 right-0">
      <div className="place-items-center space-y-5 grid place-content-center">
        <div className="scale-125 font-medium text-primary">
          <MessageCircleDashed size={60} className="mx-auto mb-2" />
        </div>

        <div className="relative flex items-center justify-center w-40 h-[6px] mx-auto rounded-full overflow-hidden bg-primary/10">
          <div className="absolute left-0 h-full w-1/3 bg-primary rounded-full animate-slide"></div>
        </div>
      </div>
    </div>
  );
}

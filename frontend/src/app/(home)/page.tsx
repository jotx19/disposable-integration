import Hero from "@/modules/home/ui/landing/hero";
import AppDemo from "@/modules/home/ui/landing/appDemo";
import Features from "@/modules/home/ui/landing/features";
import HowItWorks from "@/modules/home/ui/landing/howItWorks";
import Faq from "@/modules/home/ui/landing/faq";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F4F4F0] dark:bg-background">
      <Hero />
      <AppDemo />
      <Features />
      <HowItWorks />
      <Faq />
    </div>
  );
}
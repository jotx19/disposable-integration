import type { Metadata } from "next";
import "../globals.css";
import { ThemeProvider } from "next-themes";
import Header from "@/modules/home/ui/navbar";


export const metadata: Metadata = {
  title: "Dispose [:/]",
  description: "Lets-dispose",
};

interface Props {
  children: React.ReactNode;
}

const Layout = async ({ children }: Props) => {
  return (
    <ThemeProvider attribute="class" enableSystem>
      <div className="flex flex-col min-h-screen">{children}
        <Header/>
      </div>
    </ThemeProvider>
  );
};

export default Layout;

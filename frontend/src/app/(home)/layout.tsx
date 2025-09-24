import type { Metadata } from "next";
import "../globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
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
    <ThemeProvider >
      <div className="flex flex-col ">{children}
        <Header/>
      </div>
    </ThemeProvider>
  );
};

export default Layout;

import type { Metadata } from "next";
import Providers from "./layout-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "贪吃蛇游戏",
  description: "Snake Game with Google Login",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

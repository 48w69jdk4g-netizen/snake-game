import Providers from "./layout-provider";
import "./globals.css";

export const metadata = {
  title: "贪吃蛇游戏",
  description: "Snake Game with Google Login",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

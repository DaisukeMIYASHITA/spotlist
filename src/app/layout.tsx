import type { Metadata } from "next";
import { Providers } from "@/components";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spotlist - プレイリスト作成",
  description: "アーティストリストからSpotifyプレイリストを簡単作成",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased bg-gray-950 text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

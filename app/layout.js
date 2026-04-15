import { Bebas_Neue, Space_Grotesk } from "next/font/google";
import "./globals.css";

const heading = Bebas_Neue({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: "400"
});

const body = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"]
});

export const metadata = {
  title: "DevilMaxy Guild Chat",
  description: "Discord-style chat for subscribers and Free Fire guild mates"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${heading.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}

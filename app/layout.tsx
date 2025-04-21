import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import { ConvexClientProvider } from "./providers/ConvexClientProvider";
import { UserSyncProvider } from "./providers/UserSyncProvider";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lolita - Premium Financial Management",
  description: "Track your finances and expenses effortlessly with Lolita's premium financial management tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${montserrat.variable} antialiased`}>
        <ConvexClientProvider>
          <UserSyncProvider>
            {children}
          </UserSyncProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}

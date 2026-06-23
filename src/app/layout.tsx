import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PostPolish — Format, Preview, and Perfect Your LinkedIn Posts",
  description:
    "Bold, italic, lists, and live preview for LinkedIn posts. No signup, no tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="bg-background text-foreground font-sans min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          {children}
          <Toaster />
        </ThemeProvider>
        {/* Buy Me a Coffee floating widget — second tip pathway alongside
            the custom CoffeeDialog. Loads lazily so it doesn't block first
            paint. data-color tinted to roughly match the theme primary
            instead of BMC's default yellow. */}
        <Script
          id="bmc-widget"
          src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
          strategy="lazyOnload"
          data-name="BMC-Widget"
          data-cfasync="false"
          data-id="ritikbora"
          data-description="Support PostPolish on Buy Me a Coffee"
          data-message=""
          data-color="#1DA1F2"
          data-position="Right"
          data-x_margin="18"
          data-y_margin="18"
        />
      </body>
    </html>
  );
}

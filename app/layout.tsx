import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "QR Pro Generator - Professional QR Code Generator",
  description:
    "Generate professional QR codes instantly for URLs, text, emails, and phone numbers. Fast, secure, and reliable.",
  keywords: [
    "QR code",
    "QR code generator",
    "QR",
    "barcode",
    "QR code creator",
  ],
  authors: [{ name: "QR Pro Generator" }],
  openGraph: {
    title: "QR Pro Generator",
    description: "Generate professional QR codes instantly",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/"
      signInForceRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      signUpForceRedirectUrl="/"
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}

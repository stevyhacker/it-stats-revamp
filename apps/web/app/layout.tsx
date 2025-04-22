import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IT Stats Revamp", // Customize title
  description: "IT Company Statistics Dashboard", // Customize description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Ensure head is present if needed, or body is directly inside html */}
      <body className={inter.className}>
        {/* 
            You might add a ThemeProvider here if needed for more complex theme switching,
            otherwise Tailwind's 'class' strategy in globals.css and tailwind.config.js handles dark mode.
          */}
        {children}
      </body>
    </html>
  );
}

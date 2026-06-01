import type { Metadata } from "next";
import { Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeScript } from "@/components/ThemeScript";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ['600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Montenegro Company Statistics | Revenue, Salary, Profit & Employee Data",
  description: "Explore key financial and employment statistics for Montenegrin companies. Analyze revenue, salaries, profit margins, employee counts, and trends year by year.",
  keywords: [
    "Montenegro company statistics",
    "company data Montenegro",
    "Montenegrin salaries",
    "company profit Montenegro",
    "Podgorica companies",
    "Budva companies",
    "Montenegro business registry",
  ],
  openGraph: {
    title: "Montenegro Company Statistics | Revenue, Salary, Profit & Employee Data",
    description: "Explore key financial and employment statistics for Montenegrin companies. Analyze revenue, salaries, profit margins, employee counts, and trends year by year.",
    url: 'https://itstats.me',
    siteName: 'Montenegro Company Stats',
    // images: [
    //   {
    //     url: 'https://your-website.com/og-image.png', // Replace with your actual OG image URL
    //     width: 1200,
    //     height: 630,
    //     alt: 'Montenegro Company Statistics Dashboard Preview',
    //   },
    // ],
    locale: 'en_US', // Adjust locale if needed
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Montenegro Company Statistics | Revenue, Salary, Profit & Employee Data",
    description: "Explore key financial and employment statistics for Montenegrin companies. Analyze revenue, salaries, profit margins, employee counts, and trends year by year.",
    // siteId: 'YourTwitterSiteID', // Optional: Your Twitter Site ID
    // creator: '@YourTwitterHandle', // Optional: Your Twitter username
    // creatorId: 'YourTwitterCreatorID', // Optional: Your Twitter Creator ID
    // images: ['https://your-website.com/twitter-image.png'], // Replace with your actual Twitter image URL (can be same as OG image)
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <ThemeScript />
      </head>
      <body className={`${jetbrainsMono.variable} ${cormorant.variable} font-sans`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

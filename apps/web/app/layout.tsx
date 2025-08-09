import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeScript } from "@/components/ThemeScript";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Montenegro IT Company Statistics | Salary, Profit & Employee Data",
  description: "Explore key financial and employment statistics for Montenegrin IT companies. Analyze average salaries, profit margins, employee counts, and trends year by year.",
  keywords: ["Montenegro IT statistics", "IT company data Montenegro", "Montenegrin tech salaries", "IT profit Montenegro", "Podgorica IT companies", "Budva IT companies", "IT industry Montenegro"],
  // Add Open Graph and Twitter metadata
  openGraph: {
    title: "Montenegro IT Company Statistics | Salary, Profit & Employee Data",
    description: "Explore key financial and employment statistics for Montenegrin IT companies. Analyze average salaries, profit margins, employee counts, and trends year by year.",
    url: 'https://itstats.me',
    siteName: 'Montenegro IT Stats', // Replace with your site name
    // images: [
    //   {
    //     url: 'https://your-website.com/og-image.png', // Replace with your actual OG image URL
    //     width: 1200,
    //     height: 630,
    //     alt: 'Montenegro IT Company Statistics Dashboard Preview',
    //   },
    // ],
    locale: 'en_US', // Adjust locale if needed
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Montenegro IT Company Statistics | Salary, Profit & Employee Data",
    description: "Explore key financial and employment statistics for Montenegrin IT companies. Analyze average salaries, profit margins, employee counts, and trends year by year.",
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
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

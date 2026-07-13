import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/auth";
import { Toaster } from "react-hot-toast";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://resume-ats-scanner.vercel.ai'),
  title: {
    default: "Resume ATS Scanner & Dashboard",
    template: "%s | DataAssembleHub"
  },
  description: "Analyze, parse, and score your resume against Job Descriptions using hybrid semantic & keyword matches.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Resume ATS Scanner & Dashboard",
    description: "Analyze, parse, and score your resume against Job Descriptions using hybrid semantic & keyword matches.",
    url: 'https://resume-ats-scanner.vercel.ai',
    siteName: 'DataAssembleHub ATS Scanner',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Resume ATS Scanner Preview',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Resume ATS Scanner & Dashboard",
    description: "Analyze, parse, and score your resume against Job Descriptions using hybrid semantic & keyword matches.",
    images: ['/og-image.png'],
  },
};

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Toaster 
              position="bottom-right" 
              toastOptions={{
                style: {
                  background: '#161B22',
                  color: '#F0F6FC',
                  border: '1px solid #30363D',
                  fontSize: '12px',
                  borderRadius: '8px',
                },
              }}
            />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


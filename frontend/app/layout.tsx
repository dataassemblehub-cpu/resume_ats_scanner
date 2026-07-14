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
  metadataBase: new URL('https://ai-resume-ats-scanner.vercel.app'),
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
    url: 'https://ai-resume-ats-scanner.vercel.app',
    siteName: 'DataAssembleHub ATS Scanner',
    images: [
      {
        url: 'https://ai-resume-ats-scanner.vercel.app/og-image.png',
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
    images: ['https://ai-resume-ats-scanner.vercel.app/og-image.png'],
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


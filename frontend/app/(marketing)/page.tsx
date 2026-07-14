import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { ThemeToggle } from '@/components/ThemeToggle';
import LandingClient from './LandingClient';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Free AI Resume ATS Scanner & Resume Optimizer',
  description: 'Scan your resume against job descriptions using our AI-powered ATS scanner. Get detailed scoring, missing keywords, and optimized bullet points.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Free AI Resume ATS Scanner & Resume Optimizer',
    description: 'Scan your resume against job descriptions using our AI-powered ATS scanner. Get detailed scoring, missing keywords, and optimized bullet points.',
    type: 'website',
    images: [
      {
        url: 'https://ai-resume-ats-scanner.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Resume ATS Scanner Preview',
      }
    ],
  },
  twitter: {
    title: 'Free AI Resume ATS Scanner & Resume Optimizer',
    description: 'Scan your resume against job descriptions using our AI-powered ATS scanner. Get detailed scoring, missing keywords, and optimized bullet points.',
    images: ['https://ai-resume-ats-scanner.vercel.app/og-image.png'],
  }
};

export default function MarketingLandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "DataAssembleHub ATS Scanner",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "An AI-powered ATS scanner that scores resumes against job descriptions and provides optimization suggestions."
  };

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen relative z-10 bg-page text-primary overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Navbar */}
      <header className="flex items-center justify-between border-b border-border p-4 md:px-8 max-w-7xl mx-auto w-full relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-sm">
            ATS
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-primary tracking-tight">
              AI Resume Scanner
            </h1>
            <p className="text-[10px] text-muted hidden sm:block">
              ATS scoring & optimization engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/docs"
            className="text-xs font-bold text-muted hover:text-primary transition-colors hidden sm:block"
          >
            How ATS Works
          </Link>
          <ThemeToggle />
          <Link
            href="/scanner"
            className="btn-primary text-xs font-bold px-5 py-2 rounded-full transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
          >
            Try It Out
          </Link>
        </div>
      </header>

      {/* Main Content (Client Component with Framer Motion) */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        <LandingClient />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

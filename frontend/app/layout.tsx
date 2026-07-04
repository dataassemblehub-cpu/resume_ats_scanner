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
  title: "Resume ATS Scanner & Dashboard",
  description: "Analyze, parse, and score your resume against Job Descriptions using hybrid semantic & keyword matches.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
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
      </body>
    </html>
  );
}


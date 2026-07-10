'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/lib/auth';
import ScanFlow from '@/components/ScanFlow';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen relative z-10 bg-page text-primary">
      <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full gap-8 relative z-10">
        {/* Navbar / Header */}
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-sm">
              ATS
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-primary tracking-tight">
                AI Resume Scanner
              </h1>
              <p className="text-[10px] text-muted">
                ATS scoring & optimization engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    try {
                      const { getUserHistory } = await import('@/lib/api');
                      const res = await getUserHistory(1, 1);
                      if (res.items && res.items.length > 0) {
                        router.push(`/dashboard?tab=history`);
                      } else {
                        import('react-hot-toast').then(m => m.toast.error("No past scans found. Run a scan first!"));
                      }
                    } catch (e) {
                      import('react-hot-toast').then(m => m.toast.error("Failed to fetch history"));
                    }
                  }}
                  className="text-xs font-bold text-accent hover:text-primary bg-surface border border-border px-3 py-1.5 rounded-full transition-all cursor-pointer active:scale-95"
                >
                  View History
                </button>
                <span className="text-xs font-mono text-muted bg-surface border border-border px-3 py-1.5 rounded-full truncate max-w-[150px]" title={user.email}>
                  {user.email}
                </span>
                <button
                  onClick={logout}
                  className="text-xs font-bold text-muted hover:text-primary bg-surface border border-border px-3 py-1.5 rounded-full transition-all cursor-pointer active:scale-95"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="btn-primary text-xs font-bold px-4 py-1.5 rounded-full transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <ScanFlow />
      </div>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

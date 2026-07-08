'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const { upgradeAccount } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await upgradeAccount();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Failed to upgrade account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      {/* Modal backdrop closer */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Box */}
      <div className="glass-panel w-full max-w-md p-6 relative z-10 overflow-hidden flex flex-col gap-6 bg-[#0d111d]/90 border border-white/10 shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-sky-500/10 to-transparent blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center gap-3 text-center mt-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shadow-lg shadow-amber-500/5">
            <svg className="w-7 h-7 text-amber-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Free Trial Exhausted
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              You have used your 1 free AI recommendations scan. Upgrade to Premium to unlock full capabilities.
            </p>
          </div>
        </div>

        {/* Feature List */}
        <div className="flex flex-col gap-3 bg-white/5 border border-white/5 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h4 className="text-xs font-bold text-white">Unlimited AI Recommendations</h4>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Scan as many resumes as you want with deep Google Gemini-powered insights.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h4 className="text-xs font-bold text-white">Print-Optimized PDF Export</h4>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Download fully clean, print-ready reports with custom layout optimization toggles.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h4 className="text-xs font-bold text-white">Advanced Experience Optimization</h4>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Unlock clipboard copying of rewritten technical experience sentences.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-neutral-700 disabled:to-neutral-800 disabled:text-gray-500 text-xs font-extrabold text-white uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-98"
          >
            {loading ? 'Processing Upgrade...' : 'Upgrade to Premium Access'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider rounded-xl transition-all active:scale-98"
          >
            Close & Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

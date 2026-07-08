'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { claimScan } from '@/lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }: AuthModalProps) {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    clearForm();
    onClose();
  };

  const handleAuthSuccess = async () => {
    try {
      // Check if there's an active anonymous scan to claim
      const saved = localStorage.getItem('ats_analysis_result');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.resumeDetails && parsed.resumeDetails.id) {
          await claimScan(parsed.resumeDetails.id);
          clearForm();
          onClose();
          return; // Stay on the current page (likely dashboard or navigating there)
        }
      }

      // If no active scan, fetch history and route to latest scan's history tab
      const { getUserHistory } = await import('@/lib/api');
      const { useRouter } = await import('next/navigation');
      const res = await getUserHistory(1, 1);
      if (res.items && res.items.length > 0) {
        const { getHistoryDetail, runComprehensiveAnalysis } = await import('@/lib/api');
        const scan = await getHistoryDetail(res.items[0].id);
        if (scan && scan.resumeDetails) {
          const analysis = await runComprehensiveAnalysis(
            {
              id: scan.resumeDetails.id,
              name: scan.resumeDetails.name,
              email: scan.resumeDetails.email,
              phone: scan.resumeDetails.phone,
              parsed_text: scan.resumeDetails.parsed_text
            },
            scan.jdText || ''
          );
          const finalResult = {
            ...analysis,
            jdText: scan.jd_text || scan.jdText,
            recommendations: scan.recommendations
          };
          localStorage.setItem('ats_analysis_result', JSON.stringify(finalResult));
          window.location.href = `/dashboard?tab=history`;
        }
      }
    } catch (e) {
      console.error('Failed to handle post-auth routing', e);
    }
    clearForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (activeTab === 'login') {
        await login(email, password);
        await handleAuthSuccess();
      } else if (activeTab === 'register') {
        await register(email, password);
        await handleAuthSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      {/* Modal backdrop closer */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Modal Box */}
      <div className="glass-panel w-full max-w-md p-6 relative z-10 overflow-hidden flex flex-col gap-6 bg-[#0d111d]/90 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent blur-2xl pointer-events-none" />
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {activeTab === 'login' && 'Welcome Back'}
            {activeTab === 'register' && 'Create Account'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {activeTab === 'login' && 'Sign in to access resume history and AI recommendations'}
            {activeTab === 'register' && 'Join to scan resumes and unlock professional suggestions'}
          </p>
        </div>

        {/* Tab Toggle (Login & Register) */}
        <div className="flex bg-white/5 border border-white/5 rounded-xl p-1">
          <button
            type="button"
            onClick={() => {
              clearForm();
              setActiveTab('login');
            }}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              clearForm();
              setActiveTab('register');
            }}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Email Address Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all font-mono"
            />
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-400 hover:to-violet-400 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-sky-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>
                {activeTab === 'login' && 'Sign In'}
                {activeTab === 'register' && 'Register'}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

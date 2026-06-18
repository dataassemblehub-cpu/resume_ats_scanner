'use client';

import React from 'react';

export default function SuggestionsPlaceholder() {
  return (
    <div className="glass-panel p-10 flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden min-h-[400px]">
      {/* Decorative glowing gradient ring */}
      <div className="absolute w-[300px] h-[300px] bg-gradient-to-r from-violet-500/20 to-sky-500/20 rounded-full blur-[60px] -top-12 -right-12 pointer-events-none" />
      <div className="absolute w-[200px] h-[200px] bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-full blur-[40px] -bottom-12 -left-12 pointer-events-none" />

      {/* Locked Icon Box */}
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
        <svg
          className="w-8 h-8 text-sky-400 group-hover:scale-110 transition-transform duration-300 relative z-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 21m0 0l-.813-5.096L9 21zm0 0h1m-1 0H8m6.813-5.096L15 21m0 0l-.813-5.096L15 21zm0 0h.5m-.5 0h-.5M8 6h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z"
          />
        </svg>
      </div>

      <div className="flex flex-col gap-2 max-w-md">
        <h3 className="text-xl font-extrabold text-white tracking-tight">
          AI Recommendations Engine
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          Expose tailored resume insights powered by Gemini. Generate Strengths, Weaknesses, missing skills lists, recruiter-oriented improvements, and custom rewrite bullet suggestions.
        </p>
      </div>

      {/* Feature list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mt-2 text-left">
        {[
          'Gemini AI Studio integration',
          'Candidate Strengths & Weaknesses',
          'Recruiter-centric improvements',
          'Actionable rewritten bullet points'
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs text-gray-300 font-medium">
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {item}
          </div>
        ))}
      </div>

      {/* Locked tag */}
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-xs text-violet-300 font-bold uppercase tracking-wider mt-4">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Coming in Phase 9
      </div>
    </div>
  );
}

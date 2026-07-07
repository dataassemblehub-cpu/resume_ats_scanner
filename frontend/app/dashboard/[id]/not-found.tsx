'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen p-6 bg-[#0d111d]">
      <div className="glass-panel w-full max-w-md p-8 flex flex-col items-center text-center gap-5 border-l-4 border-l-amber-500">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-md font-bold text-amber-400">Report Not Found</h3>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            The requested scan ID does not exist in the database or you do not have permission to view it.
          </p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg transition-all cursor-pointer active:scale-95 shadow-md shadow-sky-500/10"
        >
          Back to Landing Page
        </button>
      </div>
    </div>
  );
}

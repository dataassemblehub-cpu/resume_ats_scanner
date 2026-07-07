'use client';

import React from 'react';

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen text-gray-400 bg-[#0d111d]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold tracking-wider uppercase">Loading scan report...</span>
      </div>
    </div>
  );
}

'use client';

import React from 'react';

export interface StageItem {
  id: number;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

interface LoadingStagesProps {
  stages: StageItem[];
}

export default function LoadingStages({ stages }: LoadingStagesProps) {
  return (
    <div className="glass-panel p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold text-gray-100">Analyzing Resume Layout & Context</h3>
        <p className="text-xs text-gray-400">Processing the files through the ATS pipeline...</p>
      </div>

      <div className="flex flex-col gap-4">
        {stages.map((stage) => {
          const isActive = stage.status === 'active';
          const isDone = stage.status === 'done';
          const isError = stage.status === 'error';

          return (
            <div
              key={stage.id}
              className={`flex items-center gap-4 p-3 rounded-lg border transition-all duration-300 ${
                isActive 
                  ? 'bg-sky-500/5 border-sky-500/30' 
                  : isDone 
                    ? 'bg-teal-500/5 border-teal-500/10'
                    : isError 
                      ? 'bg-rose-500/5 border-rose-500/20'
                      : 'bg-white/5 border-white/5 opacity-55'
              }`}
            >
              {/* Icon / Indicator */}
              <div className="flex-shrink-0">
                {isActive && (
                  <div className="relative flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-sky-500 items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    </span>
                  </div>
                )}
                {isDone && (
                  <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
                    <svg className="w-3.5 h-3.5 text-teal-400 animate-draw" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {isError && (
                  <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                    <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                {stage.status === 'pending' && (
                  <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="flex-grow">
                <span
                  className={`text-sm font-medium transition-colors duration-300 ${
                    isActive 
                      ? 'text-sky-400' 
                      : isDone 
                        ? 'text-teal-400' 
                        : isError 
                          ? 'text-rose-400' 
                          : 'text-gray-400'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

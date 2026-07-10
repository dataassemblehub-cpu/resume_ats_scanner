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
        <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
          Analyzing Resume Layout & Context
        </h3>
        <p className="text-xs text-muted">Processing the files through the ATS pipeline...</p>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8 bg-sidebar p-6 rounded-2xl border border-border">
        {/* Radar Scanner Animation */}
        <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
          {/* Pulsing waves */}
          <div className="absolute inset-0 rounded-full border border-sky-500/10 animate-ping opacity-25" />
          <div className="absolute inset-4 rounded-full border border-violet-500/10 animate-pulse opacity-40" />
          
          {/* Radar concentric circles */}
          <div className="absolute inset-0 rounded-full border border-border" />
          <div className="absolute inset-[25%] rounded-full border border-border" />
          <div className="absolute inset-[50%] rounded-full border border-border" />
          <div className="absolute inset-[75%] rounded-full border border-border" />
          
          {/* Radar axis crosshairs */}
          <div className="absolute h-full w-px bg-surface" />
          <div className="absolute w-full h-px bg-surface" />
          
          {/* Rotating sweeping sector */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
            <div className="w-1/2 h-1/2 bg-gradient-to-tr from-sky-500/0 to-sky-500/20 rounded-tl-full origin-bottom-right" />
          </div>
          
          {/* Scanning center beacon */}
          <div className="absolute w-2.5 h-2.5 bg-gradient-to-r from-sky-400 to-violet-500 rounded-full shadow-[0_0_12px_rgba(14,165,233,0.7)] z-10" />
        </div>

        {/* Stages checklist */}
        <div className="flex-1 w-full flex flex-col gap-3">
          {stages.map((stage) => {
            const isActive = stage.status === 'active';
            const isDone = stage.status === 'done';
            const isError = stage.status === 'error';

            return (
              <div
                key={stage.id}
                className={`flex items-center gap-3.5 p-3 rounded-xl border transition-all duration-300 ${
                  isActive 
                    ? 'bg-sky-500/5 border-sky-500/25 shadow-[0_0_15px_rgba(14,165,233,0.05)]' 
                    : isDone 
                      ? 'bg-teal-500/5 border-teal-500/10 opacity-75'
                      : isError 
                        ? 'bg-rose-500/5 border-rose-500/20'
                        : 'bg-surface border-border opacity-40'
                }`}
              >
                {/* Status Indicator */}
                <div className="flex-shrink-0">
                  {isActive && (
                    <div className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500 items-center justify-center">
                        <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                      </span>
                    </div>
                  )}
                  {isDone && (
                    <div className="w-4 h-4 rounded-full bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
                      <svg className="w-3 h-3 text-teal-400 animate-draw" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {isError && (
                    <div className="w-4 h-4 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                      <svg className="w-3 h-3 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                  {stage.status === 'pending' && (
                    <div className="w-4 h-4 rounded-full bg-surface border border-border flex items-center justify-center">
                      <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                    </div>
                  )}
                </div>

                {/* Stage Label */}
                <div className="flex-grow">
                  <span
                    className={`text-xs font-semibold transition-colors duration-300 ${
                      isActive 
                        ? 'text-sky-400 font-bold' 
                        : isDone 
                          ? 'text-teal-400' 
                          : isError 
                            ? 'text-rose-400' 
                            : 'text-muted'
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
    </div>
  );
}

'use client';

import React from 'react';
import { FormattingResult } from '@/lib/api';

interface FormattingDetailsProps {
  formatting: FormattingResult;
}

export default function FormattingDetails({ formatting }: FormattingDetailsProps) {
  
  function getImpact(text: string): { points: string; severity: 'critical' | 'warning' | 'low' } {
    const t = text.toLowerCase();
    if (t.includes('email')) return { points: '-4 ATS pts', severity: 'critical' };
    if (t.includes('phone')) return { points: '-4 ATS pts', severity: 'critical' };
    if (t.includes('linkedin')) return { points: '-2 ATS pts', severity: 'warning' };
    if (t.includes('skills section')) return { points: '-8 ATS pts', severity: 'critical' };
    if (t.includes('extremely short') || t.includes('very long')) return { points: '-2 ATS pts', severity: 'low' };
    if (t.includes('bullet points')) return { points: '-3 ATS pts', severity: 'warning' };
    if (t.includes('icons') || t.includes('symbols') || t.includes('formatting')) return { points: '-2 ATS pts', severity: 'low' };
    if (t.includes('paragraph') || t.includes('80 words')) return { points: '-4 ATS pts', severity: 'warning' };
    if (t.includes('table') || t.includes('column')) return { points: '-5 ATS pts', severity: 'critical' };
    if (t.includes('education')) return { points: '-2 ATS pts', severity: 'low' };
    return { points: '-1 ATS pt', severity: 'low' };
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Issues & Warnings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Critical Issues */}
        <div className="glass-panel p-6 border-l-4 border-l-rose-500">
          <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            Critical Formatting Issues ({formatting.issues.length})
          </h3>

          <div className="flex flex-col gap-4">
            {formatting.issues.map((issue, idx) => {
              const impact = getImpact(issue);
              return (
                <div key={idx} className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm font-medium text-gray-200">{issue}</span>
                    <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md whitespace-nowrap">
                      {impact.points}
                    </span>
                  </div>
                </div>
              );
            })}
            {formatting.issues.length === 0 && (
              <p className="text-sm text-gray-500 py-4 text-center">No critical formatting issues found!</p>
            )}
          </div>
        </div>

        {/* Warnings */}
        <div className="glass-panel p-6 border-l-4 border-l-amber-500">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Layout & Style Warnings ({formatting.warnings.length})
          </h3>

          <div className="flex flex-col gap-4">
            {formatting.warnings.map((warning, idx) => {
              const impact = getImpact(warning);
              return (
                <div key={idx} className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm font-medium text-gray-200">{warning}</span>
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md whitespace-nowrap">
                      {impact.points}
                    </span>
                  </div>
                </div>
              );
            })}
            {formatting.warnings.length === 0 && (
              <p className="text-sm text-gray-500 py-4 text-center">No layout warnings found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="glass-panel p-6">
        <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
          Actionable Recommendations
        </h3>

        <div className="flex flex-col gap-3">
          {formatting.recommendations.map((rec, idx) => (
            <div key={idx} className="flex gap-3 items-start bg-white/5 border border-white/5 p-4 rounded-xl">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                {idx + 1}
              </div>
              <p className="text-sm text-gray-200 leading-relaxed font-sans">{rec}</p>
            </div>
          ))}
          {formatting.recommendations.length === 0 && (
            <p className="text-sm text-gray-500 py-6 text-center">
              Your resume formatting matches ATS best practices! No recommendations needed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

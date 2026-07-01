'use client';

import React, { useState } from 'react';
import { FormattingResult } from '@/lib/api';

interface FormattingDetailsProps {
  formatting: FormattingResult;
}

type DiagnosticTab = 'all' | 'errors' | 'warnings' | 'recommendations';

export default function FormattingDetails({ formatting }: FormattingDetailsProps) {
  const [activeTab, setActiveTab] = useState<DiagnosticTab>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  function getImpact(text: string): { points: string; severity: 'error' | 'warning' | 'info'; pointsNum: number } {
    const t = text.toLowerCase();
    if (t.includes('email')) return { points: '-4 ATS pts', severity: 'error', pointsNum: 4 };
    if (t.includes('phone')) return { points: '-4 ATS pts', severity: 'error', pointsNum: 4 };
    if (t.includes('linkedin')) return { points: '-2 ATS pts', severity: 'warning', pointsNum: 2 };
    if (t.includes('skills section')) return { points: '-8 ATS pts', severity: 'error', pointsNum: 8 };
    if (t.includes('extremely short') || t.includes('very long')) return { points: '-2 ATS pts', severity: 'info', pointsNum: 2 };
    if (t.includes('bullet points')) return { points: '-3 ATS pts', severity: 'warning', pointsNum: 3 };
    if (t.includes('icons') || t.includes('symbols') || t.includes('formatting')) return { points: '-2 ATS pts', severity: 'info', pointsNum: 2 };
    if (t.includes('paragraph') || t.includes('80 words')) return { points: '-4 ATS pts', severity: 'warning', pointsNum: 4 };
    if (t.includes('table') || t.includes('column')) return { points: '-5 ATS pts', severity: 'error', pointsNum: 5 };
    if (t.includes('education')) return { points: '-2 ATS pts', severity: 'info', pointsNum: 2 };
    return { points: '-1 ATS pt', severity: 'info', pointsNum: 1 };
  }

  function getCategory(text: string): string {
    const t = text.toLowerCase();
    if (t.includes('email') || t.includes('phone') || t.includes('contact') || t.includes('linkedin')) return 'Contact Information';
    if (t.includes('skills')) return 'Skills Section';
    if (t.includes('experience') || t.includes('bullet') || t.includes('verb')) return 'Experience Section';
    if (t.includes('table') || t.includes('column') || t.includes('layout')) return 'Layout & Structure';
    if (t.includes('font') || t.includes('size') || t.includes('margin')) return 'Typography';
    return 'General Formatting';
  }

  function getFixGuide(text: string): string {
    const t = text.toLowerCase();
    if (t.includes('email')) return 'Add your email address (e.g., john.doe@email.com) clearly in the header section. ATS parsers need contact details to match candidates.';
    if (t.includes('phone')) return 'Provide a valid phone number including area code. Use simple formatting like standard digits: (123) 456-7890.';
    if (t.includes('linkedin')) return 'Include a full, clean URL to your LinkedIn profile. Make sure there are no hyperlinked anchors, use plaintext URL: linkedin.com/in/username.';
    if (t.includes('skills section')) return 'Create a distinct header named "Skills" or "Technical Skills". List keywords as comma-separated text rather than in columns, boxes, or tables.';
    if (t.includes('extremely short')) return 'Expand your resume text to at least 400 words. Describe your roles, achievements, and technical stack in greater detail.';
    if (t.includes('very long')) return 'Condense your resume to 1-2 pages (approx. 400-800 words). Remove redundant summaries or extremely old, irrelevant job listings.';
    if (t.includes('bullet points')) return 'Use standard round bullets (•) for your work experience. Avoid special characters, arrows, checkboxes, or graphics which confuse ATS parsers.';
    if (t.includes('icons') || t.includes('symbols') || t.includes('formatting')) return 'Remove decorative graphics, icons, ratings stars, or complex shape elements. Keep formatting plain text with clear headings.';
    if (t.includes('paragraph') || t.includes('80 words')) return 'Break large blocks of text into bullet lists of 2-4 lines each. ATS and recruiters screen bullet points much more effectively.';
    if (t.includes('table') || t.includes('column')) return 'Convert all tables or multi-column layouts to single-column, standard linear layout. Tables often disrupt the reading flow of ATS engines.';
    if (t.includes('education')) return 'Clearly list your Degree, Institution, and Graduation Year. Use a clean header like "Education".';
    return 'Review formatting to ensure standard fonts (Arial, Calibri, Times New Roman), margins of 0.5-1 inch, and standard black text.';
  }

  // Map issues, warnings, and recommendations into a single array
  const allIssues = [
    ...formatting.issues.map((text) => ({
      text,
      type: 'error' as const,
      ...getImpact(text),
      category: getCategory(text),
      fix: getFixGuide(text)
    })),
    ...formatting.warnings.map((text) => ({
      text,
      type: 'warning' as const,
      ...getImpact(text),
      category: getCategory(text),
      fix: getFixGuide(text)
    })),
    ...formatting.recommendations.map((text) => ({
      text,
      type: 'info' as const,
      points: 'Suggestion',
      pointsNum: 0,
      severity: 'info' as const,
      category: getCategory(text),
      fix: getFixGuide(text)
    }))
  ];

  const totalErrors = allIssues.filter(i => i.type === 'error').length;
  const totalWarnings = allIssues.filter(i => i.type === 'warning').length;
  const totalInfos = allIssues.filter(i => i.type === 'info').length;

  const filteredIssues = allIssues.filter((issue) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'errors') return issue.type === 'error';
    if (activeTab === 'warnings') return issue.type === 'warning';
    return issue.type === 'info';
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Lint Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 flex items-center justify-between border-l-4 border-l-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.1)] transition-all">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Critical Issues</span>
            <span className="text-2xl font-black text-rose-400 mt-1">{totalErrors}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center justify-between border-l-4 border-l-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Style Warnings</span>
            <span className="text-2xl font-black text-amber-400 mt-1">{totalWarnings}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center justify-between border-l-4 border-l-sky-500 hover:shadow-[0_0_20px_rgba(14,165,233,0.1)] transition-all">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Formatting Tips</span>
            <span className="text-2xl font-black text-sky-400 mt-1">{totalInfos}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Lint Report Container */}
      <div className="glass-panel p-6 flex flex-col gap-6">
        {/* Diagnostic Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-4 gap-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
              <span className="text-gradient">ATS Formatting Diagnostics</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Interactive structural and style check. Click on logs to view fix recommendations.
            </p>
          </div>

          <div className="flex bg-black/30 p-1 rounded-xl border border-white/5">
            {(['all', 'errors', 'warnings', 'recommendations'] as DiagnosticTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.15)]'
                    : 'text-gray-400 hover:text-gray-200 border border-transparent'
                }`}
              >
                {tab === 'all'
                  ? `All (${allIssues.length})`
                  : tab === 'errors'
                    ? `Errors (${totalErrors})`
                    : tab === 'warnings'
                      ? `Warnings (${totalWarnings})`
                      : `Tips (${totalInfos})`}
              </button>
            ))}
          </div>
        </div>

        {/* Diagnostic Logs */}
        <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1.5 scrollbar-thin">
          {filteredIssues.map((issue, idx) => {
            const itemKey = `${issue.type}-${idx}`;
            const isOpen = !!openItems[itemKey];

            return (
              <div
                key={itemKey}
                className={`flex flex-col rounded-xl border transition-all duration-300 ${
                  isOpen ? 'bg-black/30 border-white/10' : 'bg-black/10 border-white/5 hover:border-white/10'
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleItem(itemKey)}
                  className="flex items-center justify-between p-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Severity Badge Indicator */}
                    {issue.type === 'error' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
                    ) : issue.type === 'warning' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 flex-shrink-0" />
                    )}

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          issue.type === 'error'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                            : issue.type === 'warning'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                              : 'bg-sky-500/10 text-sky-400 border border-sky-500/10'
                        }`}>
                          {issue.type === 'error' ? 'Error' : issue.type === 'warning' ? 'Warning' : 'Info'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-semibold">{issue.category}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-200 mt-1.5 leading-relaxed">{issue.text}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {issue.pointsNum > 0 ? (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        issue.type === 'error'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {issue.points}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        Suggestion
                      </span>
                    )}

                    <svg
                      className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Collapsible Fix Guide */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3 bg-black/25 rounded-b-xl">
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Remediation Action:
                      </span>
                      <p className="text-xs text-gray-300 leading-relaxed font-sans">{issue.fix}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filteredIssues.length === 0 && (
            <div className="py-12 text-center text-gray-500 italic">
              No diagnostics match the tab selection. Your resume matches all checks in this category!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


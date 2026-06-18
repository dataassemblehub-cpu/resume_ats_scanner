'use client';

import React, { useState } from 'react';
import { ComprehensiveAnalysisResult } from '@/lib/api';
import OverviewSection from './OverviewSection';
import SectionChecks from './SectionChecks';
import KeywordDetails from './KeywordDetails';
import FormattingDetails from './FormattingDetails';
import SuggestionsPlaceholder from './SuggestionsPlaceholder';

interface DashboardProps {
  result: ComprehensiveAnalysisResult;
  onReset: () => void;
}

type TabType = 'overview' | 'keywords' | 'formatting' | 'ai-suggestions' | 'history' | 'exports';

export default function Dashboard({ result, onReset }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'keywords', label: 'Keywords Match' },
    { key: 'formatting', label: 'Formatting Check' },
    { key: 'ai-suggestions', label: 'AI Suggestions' },
    { key: 'history', label: 'Scan History' },
    { key: 'exports', label: 'Export Options' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-teal-400 to-sky-400"></span>
            ATS Analysis Report
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Candidate: <strong className="text-gray-200">{result.resumeDetails.name || 'Anonymous Candidate'}</strong>
            {result.resumeDetails.email && ` • ${result.resumeDetails.email}`}
            {result.resumeDetails.phone && ` • ${result.resumeDetails.phone}`}
          </p>
        </div>

        <button
          onClick={onReset}
          className="px-4 py-2 border border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-300 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Scan Another Resume
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/5 overflow-x-auto whitespace-nowrap scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`tab-button px-4 pb-3 ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Render active tab content */}
      <div className="transition-all duration-300">
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            <OverviewSection
              score={result.score}
              semantic={result.semantic}
              keywords={result.keywords}
              formatting={result.formatting}
              sections={result.sections}
            />
            <SectionChecks
              sections={result.sections}
              resumeDetails={result.resumeDetails}
            />
          </div>
        )}

        {activeTab === 'keywords' && (
          <KeywordDetails keywords={result.keywords} />
        )}

        {activeTab === 'formatting' && (
          <FormattingDetails formatting={result.formatting} />
        )}

        {activeTab === 'ai-suggestions' && (
          <SuggestionsPlaceholder />
        )}

        {activeTab === 'history' && (
          <div className="glass-panel p-10 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/5 text-gray-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-200">Scan History</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
                Scan history is currently stored locally in your browser. (Feature coming soon in database dashboard expansion).
              </p>
            </div>
          </div>
        )}

        {activeTab === 'exports' && (
          <div className="glass-panel p-8 min-h-[300px] flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Export Analytics</h3>
              <p className="text-xs text-gray-400 mt-1">
                Download your scan results report in various formats for review or sharing.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => alert('PDF Export coming soon.')}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-gray-200">Download PDF Report</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">Styled resume summary card</p>
                </div>
              </button>

              <button
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `ats_report_${result.resumeDetails.name || 'candidate'}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-gray-200">Export Raw JSON</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">Complete parsed analysis data</p>
                </div>
              </button>

              <button
                onClick={() => {
                  const blob = new Blob([result.resumeDetails.parsed_text], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${result.resumeDetails.name || 'candidate'}_extracted_text.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-gray-200">Export Extracted Text</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">Plain text file of parser output</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { KeywordResult } from '@/lib/api';

interface KeywordDetailsProps {
  keywords: KeywordResult;
}

type FilterType = 'all' | 'matched' | 'missing';

export default function KeywordDetails({ keywords }: KeywordDetailsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterType>('all');

  const getFilteredKeywords = (type: FilterType) => {
    const matched = keywords.matched.map(k => ({ term: k, matched: true }));
    const missing = keywords.missing.map(k => ({ term: k, matched: false }));
    let list = [];
    if (type === 'all') {
      list = [...matched, ...missing];
    } else if (type === 'matched') {
      list = matched;
    } else {
      list = missing;
    }
    return list.filter(item => item.term.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const currentKeywords = getFilteredKeywords(activeTab);

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Filter Controls */}
      <div className="glass-panel p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
            <span className="text-gradient">Keyword Coverage Analysis</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            ATS systems scan for specific unigrams & bigrams. Filter by match status to optimize your resume keywords.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Tab Filters */}
          <div className="flex bg-black/30 p-1 rounded-xl border border-white/5 w-full sm:w-auto">
            {(['all', 'matched', 'missing'] as FilterType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-initial text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.15)]'
                    : 'text-gray-400 hover:text-gray-200 border border-transparent'
                }`}
              >
                {tab === 'all' ? `All (${keywords.matched.length + keywords.missing.length})` : tab}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search keywords..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-8 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all duration-300"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Matched & Missing Tag Cloud Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matched Tags */}
        <div className="glass-panel p-6 glow-card-teal">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              Matched Skills ({keywords.matched.length})
            </h4>
            <span className="text-[10px] text-teal-500 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded font-mono font-bold">
              {keywords.matched.length > 0
                ? `${Math.round((keywords.matched.length / (keywords.matched.length + keywords.missing.length)) * 100)}% Coverage`
                : '0% Coverage'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5 max-h-80 overflow-y-auto scrollbar-thin pr-1">
            {keywords.matched
              .filter(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((word) => {
                const freq = keywords.keyword_frequency[word] || { resume: 0, jd: 0 };
                return (
                  <div
                    key={word}
                    className="text-xs font-semibold bg-teal-500/5 hover:bg-teal-500/10 border border-teal-500/20 hover:border-teal-400/40 text-teal-300 hover:text-teal-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-200 cursor-default"
                  >
                    <svg className="w-3.5 h-3.5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{word}</span>
                    <span className="text-[9px] bg-black/35 text-teal-400 px-1.5 py-0.5 rounded-md font-mono">
                      {freq.resume}x
                    </span>
                  </div>
                );
              })}
            {keywords.matched.filter(k => k.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
              <span className="text-xs text-gray-500 italic py-2">No matched skills found.</span>
            )}
          </div>
        </div>

        {/* Missing Tags */}
        <div className="glass-panel p-6 hover:shadow-[0_0_30px_rgba(244,63,94,0.1)] hover:border-rose-500/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              Missing Skills ({keywords.missing.length})
            </h4>
            <span className="text-[10px] text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded font-mono font-bold">
              +{keywords.missing.length} keywords needed
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5 max-h-80 overflow-y-auto scrollbar-thin pr-1">
            {keywords.missing
              .filter(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((word) => {
                const freq = keywords.keyword_frequency[word] || { resume: 0, jd: 0 };
                return (
                  <div
                    key={word}
                    className="text-xs font-semibold bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-400/40 text-rose-300 hover:text-rose-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-200 cursor-default"
                  >
                    <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{word}</span>
                    <span className="text-[9px] bg-black/35 text-rose-400 px-1.5 py-0.5 rounded-md font-mono">
                      0/{freq.jd}x
                    </span>
                  </div>
                );
              })}
            {keywords.missing.filter(k => k.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
              <span className="text-xs text-gray-500 italic py-2">No missing skills found. Great job!</span>
            )}
          </div>
        </div>
      </div>

      {/* Frequently Used & Occurrences Table */}
      <div className="glass-panel p-6">
        <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-6 border-b border-white/5 pb-2 flex items-center justify-between">
          <span>Keyword Frequency & Distribution Ratios</span>
          <span className="text-[10px] text-gray-400 normal-case font-normal">Shows density ratio in Resume vs Job Description</span>
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-gray-400 text-[10px] uppercase font-semibold tracking-wider">
                <th className="pb-3 w-1/4">Keyword</th>
                <th className="pb-3 text-center w-1/6">Resume (Count)</th>
                <th className="pb-3 text-center w-1/6">Job Description (Req)</th>
                <th className="pb-3 w-1/3">Match Density Indicator</th>
                <th className="pb-3 text-right w-1/12">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {currentKeywords.map((item) => {
                const freq = keywords.keyword_frequency[item.term] || { resume: 0, jd: 0 };
                // Calculate percentage comparison for bar visualization
                const maxVal = Math.max(freq.resume, freq.jd, 1);
                const resumePct = Math.round((freq.resume / maxVal) * 100);
                const jdPct = Math.round((freq.jd / maxVal) * 100);

                return (
                  <tr key={item.term} className="text-gray-300 hover:bg-white/5 transition-all duration-150">
                    <td className="py-3.5 font-semibold text-gray-100">{item.term}</td>
                    <td className="py-3.5 text-center font-mono">
                      <span className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                        freq.resume > 0 ? 'bg-teal-500/10 text-teal-400 border border-teal-500/10' : 'bg-white/5 text-gray-500'
                      }`}>
                        {freq.resume}
                      </span>
                    </td>
                    <td className="py-3.5 text-center font-mono text-gray-400 font-bold">{freq.jd}</td>
                    <td className="py-3.5">
                      <div className="flex flex-col gap-1 w-full max-w-xs">
                        {/* Resume vs JD Double Bar */}
                        <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                          <span className="w-8">Resume:</span>
                          <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/5">
                            <div
                              className="bg-teal-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${resumePct}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                          <span className="w-8">JD:</span>
                          <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/5">
                            <div
                              className="bg-sky-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${jdPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-right">
                      <span className={`inline-flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider px-2 py-0.5 rounded ${
                        item.matched
                          ? 'bg-teal-500/10 text-teal-400 border border-teal-500/15'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/15'
                      }`}>
                        {item.matched ? 'Match' : 'Missing'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {currentKeywords.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 italic">
                    No keywords matching "{searchTerm}" for filter "{activeTab}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


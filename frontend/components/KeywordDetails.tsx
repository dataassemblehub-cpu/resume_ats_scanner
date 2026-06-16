'use client';

import React, { useState } from 'react';
import { KeywordResult } from '@/lib/api';

interface KeywordDetailsProps {
  keywords: KeywordResult;
}

export default function KeywordDetails({ keywords }: KeywordDetailsProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Combine and sort all keywords to display matching details
  const allKeywords = [
    ...keywords.matched.map(k => ({ term: k, matched: true })),
    ...keywords.missing.map(k => ({ term: k, matched: false }))
  ].filter(item => item.term.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Filter */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider">
            Keyword Coverage Analysis
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            ATS systems scan for specific unigrams & bigrams extracted from the Job Description.
          </p>
        </div>

        {/* Search filter */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search keywords..."
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-sky-500/50"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Grid of Matched & Missing Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matched Skills */}
        <div className="glass-panel p-6">
          <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            Matched Skills ({keywords.matched.length})
          </h4>
          
          <div className="flex flex-wrap gap-2">
            {keywords.matched
              .filter(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((word) => (
                <div
                  key={word}
                  className="text-xs font-medium bg-teal-500/10 border border-teal-500/20 text-teal-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {word}
                </div>
              ))}
            {keywords.matched.length === 0 && (
              <span className="text-xs text-gray-500">No matching keywords found.</span>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="glass-panel p-6">
          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Missing Skills ({keywords.missing.length})
          </h4>

          <div className="flex flex-wrap gap-2">
            {keywords.missing
              .filter(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((word) => (
                <div
                  key={word}
                  className="text-xs font-medium bg-rose-500/10 border border-rose-500/20 text-rose-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {word}
                </div>
              ))}
            {keywords.missing.length === 0 && (
              <span className="text-xs text-gray-500">No missing keywords found! Excellent!</span>
            )}
          </div>
        </div>
      </div>

      {/* Frequently Used & Occurrences Table */}
      <div className="glass-panel p-6">
        <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-4">
          Keyword Frequency Breakdown
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-gray-400 text-xs uppercase font-semibold">
                <th className="pb-3">Keyword</th>
                <th className="pb-3 text-center">Found in Resume</th>
                <th className="pb-3 text-center">Required in JD</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {allKeywords.map((item) => {
                const freq = keywords.keyword_frequency[item.term] || { resume: 0, jd: 0 };
                return (
                  <tr key={item.term} className="text-gray-300 hover:bg-white/5 transition-all">
                    <td className="py-3 font-semibold text-gray-200">{item.term}</td>
                    <td className="py-3 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded-md ${freq.resume > 0 ? 'bg-teal-500/10 text-teal-400' : 'bg-white/5 text-gray-500'}`}>
                        {freq.resume}
                      </span>
                    </td>
                    <td className="py-3 text-center font-mono text-gray-400">{freq.jd}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 font-medium ${item.matched ? 'text-teal-400' : 'text-rose-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.matched ? 'bg-teal-400' : 'bg-rose-400'}`}></span>
                        {item.matched ? 'Matched' : 'Missing'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {allKeywords.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">
                    No keywords matching "{searchTerm}"
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

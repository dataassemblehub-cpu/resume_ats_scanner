'use client';

import React from 'react';
import { ScoreResult, SemanticResult, KeywordResult, FormattingResult, SectionResult } from '@/lib/api';

interface OverviewSectionProps {
  score: ScoreResult;
  semantic: SemanticResult;
  keywords: KeywordResult;
  formatting: FormattingResult;
  sections: SectionResult;
}

export default function OverviewSection({ score, semantic, keywords, formatting, sections }: OverviewSectionProps) {
  // Compute a heuristic formatting score percentage based on issues (-15% each) and warnings (-5% each)
  const formattingPercentage = Math.max(
    30,
    100 - formatting.issues.length * 15 - formatting.warnings.length * 5
  );

  // Expose score calculation details dynamically
  const activeWeights: { name: string; score: number; weight: number; maxContribution: number }[] = [];

  if (sections.sections_detected.skills) {
    activeWeights.push({ name: 'Skills Score', score: score.skills, weight: 0.4, maxContribution: 40 });
  }
  if (sections.sections_detected.experience) {
    activeWeights.push({ name: 'Experience Score', score: score.experience, weight: 0.4, maxContribution: 40 });
  }
  if (sections.sections_detected.projects) {
    activeWeights.push({ name: 'Projects Score', score: score.projects, weight: 0.1, maxContribution: 10 });
  }
  if (sections.sections_detected.education) {
    activeWeights.push({ name: 'Education Score', score: score.education, weight: 0.1, maxContribution: 10 });
  }

  const sumWeights = activeWeights.reduce((sum, item) => sum + item.weight, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* 2x2 Grid of Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* ATS Score Card */}
        <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-violet-500 relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-all duration-300">
            <svg className="w-28 h-28 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Overall ATS Score</p>
            <p className="text-4xl font-extrabold text-white mt-2 font-sans">{score.overall}</p>
          </div>
          <span className="text-xs text-violet-400 mt-4 font-medium flex items-center gap-1">
            Weighted Match Score
          </span>
        </div>

        {/* Semantic Match Card */}
        <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-sky-500 relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-all duration-300">
            <svg className="w-28 h-28 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Semantic Match</p>
            <p className="text-4xl font-extrabold text-white mt-2 font-sans">{Math.round(semantic.semantic_score)}%</p>
          </div>
          <span className="text-xs text-sky-400 mt-4 font-medium flex items-center gap-1">
            Concept-level alignment
          </span>
        </div>

        {/* Keyword Coverage Card */}
        <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-teal-500 relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-all duration-300">
            <svg className="w-28 h-28 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 20l4-16m2 16l4-16" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Keyword Coverage</p>
            <p className="text-4xl font-extrabold text-white mt-2 font-sans">{Math.round(keywords.coverage_percentage)}%</p>
          </div>
          <span className="text-xs text-teal-400 mt-4 font-medium flex items-center gap-1">
            Vocabulary density match
          </span>
        </div>

        {/* Formatting Score Card */}
        <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-amber-500 relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-all duration-300">
            <svg className="w-28 h-28 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Formatting Rating</p>
            <p className="text-4xl font-extrabold text-white mt-2 font-sans">{formattingPercentage}%</p>
          </div>
          <span className="text-xs text-amber-400 mt-4 font-medium flex items-center gap-1">
            ATS readability checks
          </span>
        </div>
      </div>

      {/* Score Transparency Panel */}
      <div className="glass-panel p-6">
        <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
          Score Calculation Transparency
        </h3>

        <div className="flex flex-col gap-4">
          {activeWeights.map((item) => {
            const actualContribution = (item.score * item.weight).toFixed(1);
            return (
              <div key={item.name} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-gray-400">{item.name}</span>
                  <span className="text-gray-200">
                    {item.score} / 100 &times; {item.weight} = <strong className="text-white">{actualContribution}</strong> pts
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-violet-500 rounded-full transition-all duration-1000"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            );
          })}

          {/* Dynamic math visualizer */}
          <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2">
            <h4 className="text-xs font-bold text-gray-300">Arithmetic Calculation:</h4>
            <div className="text-xs text-gray-400 font-mono leading-relaxed">
              Sum contribution = {activeWeights.map(w => (w.score * w.weight).toFixed(1)).join(' + ')} ={' '}
              {activeWeights.reduce((sum, w) => sum + w.score * w.weight, 0).toFixed(1)}
              <br />
              Total weight denominator = {sumWeights.toFixed(1)}{' '}
              {sumWeights < 1.0 && <span className="text-amber-400">(normalized for missing sections)</span>}
              <br />
              <div className="mt-2 text-sm text-gray-200 font-semibold border-t border-white/10 pt-2 flex justify-between">
                <span>Final Normalized Score:</span>
                <span className="text-sky-400">
                  {Math.round(activeWeights.reduce((sum, w) => sum + w.score * w.weight, 0) / sumWeights)} / 100
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

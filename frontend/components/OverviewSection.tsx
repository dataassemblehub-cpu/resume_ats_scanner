'use client';

import React from 'react';
import { ScoreResult, SemanticResult, KeywordResult, FormattingResult, SectionResult } from '@/lib/api';

interface OverviewSectionProps {
  score: ScoreResult;
  semantic: SemanticResult;
  keywords: KeywordResult;
  formatting: FormattingResult;
  sections: SectionResult;
  recommendations?: any;
  onGenerateAI: () => void;
  isGenerating: boolean;
  prevScore?: {
    overall: number;
    skills: number;
    experience: number;
    projects: number;
    education: number;
    formatting: number;
    semantic: number;
    keywords: number;
  } | null;
}

const renderDelta = (current: number, prev: number | undefined | null) => {
  if (prev === undefined || prev === null) return null;
  const delta = current - prev;
  const isPositive = delta > 0;
  const isNegative = delta < 0;
  
  return (
    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded font-mono ml-1.5 inline-flex items-center ${
      isPositive 
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
        : isNegative 
          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
          : 'bg-white/5 text-gray-500 border border-white/5'
    }`}>
      {isPositive ? `+${delta}` : delta === 0 ? '0' : `${delta}`}
    </span>
  );
};

const getATSGrade = (score: number) => {
  if (score >= 85) return 'Excellent Match';
  if (score >= 70) return 'Good Match';
  if (score >= 50) return 'Partial Match';
  return 'Unresolved Gaps';
};

const getSemanticGrade = (score: number) => {
  if (score >= 80) return 'High conceptual fit';
  if (score >= 60) return 'Moderate conceptual fit';
  return 'Unrelated experience';
};

const getKeywordGrade = (score: number) => {
  if (score >= 75) return 'Dense keyword match';
  if (score >= 50) return 'Partial vocabulary';
  return 'Low vocabulary match';
};

const getFormattingGrade = (score: number) => {
  if (score >= 90) return 'ATS-Friendly Structure';
  if (score >= 75) return 'Minor Warnings';
  return 'Critically Blocked';
};

const ProgressGauge = ({ value, size = 70, strokeWidth = 6, colorClass = "text-sky-500", glowColor = "rgba(14, 165, 233, 0.2)" }: { value: number; size?: number; strokeWidth?: number; colorClass?: string; glowColor?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <div 
        className="absolute inset-0 rounded-full blur-[8px] opacity-20 transition-all duration-300"
        style={{ backgroundColor: glowColor }}
      />
      <svg className="w-full h-full transform -rotate-90 relative z-10">
        <circle
          className="text-white/5"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${colorClass} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="absolute text-sm font-extrabold text-white font-mono z-10">{value}%</span>
    </div>
  );
};

export default function OverviewSection({ 
  score, 
  semantic, 
  keywords, 
  formatting, 
  sections, 
  recommendations, 
  onGenerateAI, 
  isGenerating,
  prevScore
}: OverviewSectionProps) {
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
        <div className="glass-panel p-5 flex items-center justify-between gap-4 border-l-4 border-l-violet-500 glow-card-violet group">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overall ATS Score</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-violet-400 font-semibold">{getATSGrade(score.overall)}</span>
              {prevScore && renderDelta(score.overall, prevScore.overall)}
            </div>
            <p className="text-[10px] text-gray-500 mt-1 max-w-[145px] leading-relaxed">Weighted match score across key sections</p>
          </div>
          <ProgressGauge value={score.overall} colorClass="text-violet-500" glowColor="rgba(139, 92, 246, 0.3)" />
        </div>

        {/* Semantic Match Card */}
        <div className="glass-panel p-5 flex items-center justify-between gap-4 border-l-4 border-l-sky-500 glow-card-sky group">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Semantic Match</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-sky-400 font-semibold">{getSemanticGrade(semantic.semantic_score)}</span>
              {prevScore && renderDelta(Math.round(semantic.semantic_score), prevScore.semantic)}
            </div>
            <p className="text-[10px] text-gray-500 mt-1 max-w-[145px] leading-relaxed">NLP conceptual profile similarity</p>
          </div>
          <ProgressGauge value={Math.round(semantic.semantic_score)} colorClass="text-sky-500" glowColor="rgba(14, 165, 233, 0.3)" />
        </div>

        {/* Keyword Coverage Card */}
        <div className="glass-panel p-5 flex items-center justify-between gap-4 border-l-4 border-l-teal-500 glow-card-teal group">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Keyword Coverage</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-teal-400 font-semibold">{getKeywordGrade(keywords.coverage_percentage)}</span>
              {prevScore && renderDelta(Math.round(keywords.coverage_percentage), prevScore.keywords)}
            </div>
            <p className="text-[10px] text-gray-500 mt-1 max-w-[145px] leading-relaxed">Target vocabulary density matched</p>
          </div>
          <ProgressGauge value={Math.round(keywords.coverage_percentage)} colorClass="text-teal-500" glowColor="rgba(20, 184, 166, 0.3)" />
        </div>

        {/* Formatting Score Card */}
        <div className="glass-panel p-5 flex items-center justify-between gap-4 border-l-4 border-l-amber-500 glow-card-amber group">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Formatting Rating</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-amber-400 font-semibold">{getFormattingGrade(formattingPercentage)}</span>
              {prevScore && renderDelta(formattingPercentage, prevScore.formatting)}
            </div>
            <p className="text-[10px] text-gray-500 mt-1 max-w-[145px] leading-relaxed">Document layout & readability check</p>
          </div>
          <ProgressGauge value={formattingPercentage} colorClass="text-amber-500" glowColor="rgba(245, 158, 11, 0.3)" />
        </div>
      </div>

      {/* AI Recommendations CTA Panel */}
      {!recommendations && (
        <div className="glass-panel p-6 bg-gradient-to-r from-violet-500/10 via-sky-500/5 to-transparent border border-violet-500/20 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col gap-1 relative z-10 max-w-lg">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              ✨ AI-Powered Recommendations Available
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed mt-1">
              Google Gemini can analyze your profile gaps against this job description, prioritize missing technical skills, and write custom ATS-friendly experience bullet points.
            </p>
          </div>
          <button
            onClick={onGenerateAI}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-sky-600 hover:from-violet-500 hover:to-sky-500 disabled:from-violet-500/50 disabled:to-sky-500/50 text-white text-xs font-bold rounded-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 whitespace-nowrap self-start sm:self-auto relative z-10"
          >
            {isGenerating ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </span>
            ) : (
              "✨ Generate AI Recommendations"
            )}
          </button>
        </div>
      )}

      {/* Category Match Breakdown */}
      <div className="glass-panel p-6">
        <div className="flex flex-col gap-1 mb-4 border-b border-white/5 pb-2">
          <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center justify-between">
            <span className="text-gradient">Match Category Score Breakdown</span>
            <span className="text-[10px] text-gray-400 normal-case font-normal">Actionable breakdown of ATS scoring criteria</span>
          </h3>
        </div>

        <div className="flex flex-col gap-4">
          {[
            { name: 'Skills Match', score: score.skills, key: 'skills', weight: '40%', color: 'from-teal-500 to-emerald-500' },
            { name: 'Experience Match', score: score.experience, key: 'experience', weight: '40%', color: 'from-violet-500 to-purple-500' },
            { name: 'Projects Match', score: score.projects, key: 'projects', weight: '10%', color: 'from-sky-500 to-blue-500' },
            { name: 'Education Match', score: score.education, key: 'education', weight: '10%', color: 'from-green-500 to-teal-500' },
          ].map((cat) => (
            <div key={cat.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-gray-300 w-36 shrink-0">{cat.name}</span>
              
              <div className="flex-1 flex items-center gap-3">
                <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                  <div
                    className={`h-full bg-gradient-to-r ${cat.color} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
                <div className="flex items-center justify-end min-w-[75px] gap-0.5 shrink-0">
                  <span className="font-mono font-bold text-white text-right">{cat.score}%</span>
                  {prevScore && renderDelta(cat.score, prevScore[cat.key as keyof typeof prevScore])}
                </div>
              </div>

              <span className="text-[9px] font-bold text-gray-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded w-16 text-center select-none shrink-0 ml-2">
                Weight: {cat.weight}
              </span>
            </div>
          ))}
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
              {sumWeights < 1.0 && (
                <>
                  Total weight denominator = {sumWeights.toFixed(1)}{' '}
                  <span className="text-amber-400">(normalized for missing sections)</span>
                  <br />
                </>
              )}
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

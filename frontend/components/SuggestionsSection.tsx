'use client';

import React, { useState } from 'react';
import { AIRecommendationsResult, KeywordResult } from '@/lib/api';
import { useEntitlements } from '@/lib/auth';
import { toast } from 'react-hot-toast';

interface SuggestionsSectionProps {
  recommendations?: AIRecommendationsResult;
  onRecalculate: (newResumeText: string) => void;
  resumeText: string;
  keywords: KeywordResult;
  onRegenerateSuggestions: (newResumeText: string) => Promise<void>;
  isGenerating: boolean;
}

export default function SuggestionsSection({
  recommendations,
  onRecalculate,
  resumeText,
  keywords,
  onRegenerateSuggestions,
  isGenerating
}: SuggestionsSectionProps) {
  const { canCopySuggestions, canGenerateAI } = useEntitlements();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedSkills, setCopiedSkills] = useState<string | null>(null);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Graceful Handling of Offline State
  if (!recommendations || recommendations.status === 'unavailable') {
    return (
      <div className="glass-panel p-10 flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden min-h-[400px] border-l-4 border-l-amber-500">
        <div className="absolute w-[200px] h-[200px] bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-full blur-[45px] pointer-events-none" />
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex flex-col gap-2 max-w-md">
          <h3 className="text-lg font-bold text-white">AI Suggestions Offline</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            {recommendations?.message || "AI Recommendations are temporarily unavailable. Verify your API key is correctly configured in the backend environment variables."}
          </p>
        </div>
      </div>
    );
  }

  const {
    resume_summary,
    strengths = [],
    weaknesses = [],
    missing_skills = [],
    ats_improvements = [],
    recruiter_improvements = [],
    suggested_bullet_points = [],
    resume_improvements = [],
    ats_recommendations = []
  } = recommendations;

  // Bullet Point parser helper
  const parseBulletPoint = (bullet: string): { before: string | null; after: string } => {
    const beforeAfterRegex = /(?:before|original|old):\s*(.*?)\s*(?:after|suggested|suggestion|optimized|new):\s*(.*)/i;
    const match = bullet.match(beforeAfterRegex);
    if (match) {
      return {
        before: match[1].trim(),
        after: match[2].trim()
      };
    }

    const arrowRegex = /^(.*?)\s*(?:->|=>|→)\s*(.*)$/;
    const arrowMatch = bullet.match(arrowRegex);
    if (arrowMatch) {
      return {
        before: arrowMatch[1].trim(),
        after: arrowMatch[2].trim()
      };
    }

    return {
      before: null,
      after: bullet.trim()
    };
  };

  // 1. Group items into priority levels & compute counts
  const highImpactItems: string[] = [];
  const mediumImpactItems: string[] = [];
  const lowImpactItems: string[] = [];

  // Categorize missing skills as High Impact
  missing_skills.forEach(skill => {
    highImpactItems.push(`Include keyword "${skill}": Required in job description but not detected in resume.`);
  });

  // Categorize weaknesses/gaps as High/Medium Impact
  weaknesses.forEach(gap => {
    if (gap.toLowerCase().includes('missing') || gap.toLowerCase().includes('no ') || gap.toLowerCase().includes('lack of')) {
      highImpactItems.push(gap);
    } else {
      mediumImpactItems.push(gap);
    }
  });

  // Suggested bullets represent Medium Impact updates
  suggested_bullet_points.forEach(bullet => {
    const parsed = parseBulletPoint(bullet);
    mediumImpactItems.push(`Optimize bullet point: Rephrase generic line to "${parsed.after}"`);
  });

  // Strengths represent high value positive indicators (for reference, but we focus on recommendations for impact counts)
  // General layout advice maps to low impact / nice-to-have items
  const allAdvice = [
    ...ats_improvements,
    ...ats_recommendations,
    ...recruiter_improvements,
    ...resume_improvements
  ];
  allAdvice.forEach(advice => {
    if (advice.toLowerCase().includes('critical') || advice.toLowerCase().includes('remove')) {
      mediumImpactItems.push(advice);
    } else {
      lowImpactItems.push(advice);
    }
  });

  // Counts for summary tags
  const highCount = highImpactItems.length;
  const mediumCount = mediumImpactItems.length;
  const lowCount = lowImpactItems.length;
  const totalRecommendations = highCount + mediumCount + lowCount;

  // Clipboard export builder (Consistently structured in clean Markdown)
  const handleCopyAllSuggestions = () => {
    let md = `# AI Resume Optimization Recommendations\n\n`;
    md += `> *Disclaimer: Please review and verify all AI-generated suggestions for factual accuracy before updating your professional resume.*\n\n`;
    
    if (resume_summary) {
      md += `## Executive Profile Summary\n${resume_summary}\n\n`;
    }

    if (missing_skills.length > 0) {
      md += `## 🔴 High Impact: Missing Core Keywords\n`;
      missing_skills.forEach(skill => {
        md += `- **${skill}**: Required skill mentioned in the job description but not found in your resume.\n`;
      });
      md += `\n`;
    }

    if (weaknesses.length > 0) {
      md += `## Identified Gaps & Weaknesses\n`;
      weaknesses.forEach(gap => {
        md += `- ${gap}\n`;
      });
      md += `\n`;
    }

    if (suggested_bullet_points.length > 0) {
      md += `## 🟡 Medium Impact: Bullet Point Optimizations\n`;
      suggested_bullet_points.forEach((bullet, idx) => {
        const parsed = parseBulletPoint(bullet);
        md += `### Suggestion #${idx + 1}\n`;
        if (parsed.before) {
          md += `- **Original**: ${parsed.before}\n`;
        }
        md += `- **Optimized**: ${parsed.after}\n\n`;
      });
    }

    if (allAdvice.length > 0) {
      md += `## 🟢 Nice to Have: Formatting & Readability Advice\n`;
      allAdvice.forEach(advice => {
        md += `- ${advice}\n`;
      });
    }

    navigator.clipboard.writeText(md);
    showToast('Copied all recommendations in Markdown format!');
  };

  return (
    <div className="flex flex-col gap-6 relative">
      
      {/* Toast Alert overlay */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-teal-600/95 text-white font-bold text-xs px-4 py-2.5 rounded-xl backdrop-blur-md border border-teal-500/20 shadow-xl shadow-teal-500/10 animate-fade-in z-50 flex items-center gap-2 select-none">
          <svg className="w-4 h-4 text-emerald-300 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* RENDER ACTIVE LOADING SKELETON SCREEN WHILE REGENERATING */}
      {isGenerating ? (
        <div className="glass-panel p-12 flex flex-col items-center justify-center text-center gap-6 min-h-[500px] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-sky-500/5 shimmer-bg opacity-30" />
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
            <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center">
              <span className="w-2.5 h-2.5 bg-violet-400 rounded-full animate-ping" />
            </div>
          </div>
          <div className="flex flex-col gap-2 max-w-sm relative z-10">
            <h3 className="text-md font-bold text-white tracking-wide animate-pulse">
              Regenerating AI Recommendations
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Google Gemini is re-evaluating keyword indices, semantic matching alignments, and writing optimized bullets...
            </p>
          </div>
        </div>
      ) : totalRecommendations === 0 ? (
        /* POLISHED EMPTY STATE FOR PERFECT MATCHES */
        <div className="glass-panel p-12 flex flex-col items-center justify-center text-center gap-6 min-h-[450px] border-l-4 border-l-emerald-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl pointer-events-none" />
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex flex-col gap-2 max-w-md relative z-10">
            <h3 className="text-lg font-extrabold text-white tracking-tight">Outstanding Profile Match!</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              No core technical skill gaps, formatting layout warnings, or bullet optimization warnings were detected. Your resume is extremely well-tailored for this job description requirement list.
            </p>
          </div>
          <button
            onClick={() => onRegenerateSuggestions(resumeText)}
            className="px-4 py-2 border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-lg transition-all"
          >
            Run Diagnostic Scan Again
          </button>
        </div>
      ) : (
        /* MAIN DASHBOARD RENDER */
        <div className="flex flex-col gap-6">
          
          {/* Executive Profile Summary */}
          {resume_summary && (
            <div className="glass-panel p-6 relative overflow-hidden glow-card-violet shrink-0 flex flex-col gap-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent blur-2xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded tracking-widest uppercase">
                    ✨ AI-Generated Summary
                  </span>
                </div>
                
                {/* Export/Copy All button */}
                <button
                  onClick={() => {
                    if (!canCopySuggestions) {
                      toast.error('Copying suggestions is coming soon.');
                      return;
                    }
                    handleCopyAllSuggestions();
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 hover:border-white/10 transition-all flex items-center gap-1.5 self-start sm:self-center"
                >
                  {!canCopySuggestions ? (
                    <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  )}
                  Copy All Suggestions
                </button>
              </div>

              {/* Disclaimer reminder */}
              <div className="text-[10px] text-gray-500 italic bg-white/[0.01] border border-white/5 rounded-lg px-3 py-2 leading-relaxed">
                ⚠️ Disclaimer: Please review and verify all AI-generated suggestions for factual accuracy before updating your professional resume.
              </div>

              <p className="text-xs text-gray-300 leading-relaxed font-sans italic border-l-2 border-violet-500/35 pl-4 py-0.5">
                &ldquo;{resume_summary}&rdquo;
              </p>
            </div>
          )}

          {/* PRIORITY SUMMARY ROW */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-panel p-4 flex flex-col items-center justify-center text-center gap-1 bg-rose-500/[0.02] border-rose-500/10">
              <span className="text-[9px] font-extrabold text-rose-400 uppercase tracking-widest">🔴 High Impact</span>
              <span className="text-xl font-bold text-white font-mono">{highCount}</span>
              <span className="text-[8px] text-gray-500">Critical gaps to resolve</span>
            </div>
            
            <div className="glass-panel p-4 flex flex-col items-center justify-center text-center gap-1 bg-amber-500/[0.02] border-amber-500/10">
              <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-widest">🟡 Medium Impact</span>
              <span className="text-xl font-bold text-white font-mono">{mediumCount}</span>
              <span className="text-[8px] text-gray-500">Optimizations to apply</span>
            </div>

            <div className="glass-panel p-4 flex flex-col items-center justify-center text-center gap-1 bg-emerald-500/[0.02] border-emerald-500/10">
              <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest">🟢 Nice to Have</span>
              <span className="text-xl font-bold text-white font-mono">{lowCount}</span>
              <span className="text-[8px] text-gray-500">Style tips to review</span>
            </div>
          </div>

          {/* STRENGTHS AND GAPS SIDE-BY-SIDE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths Card */}
            <div className="glass-panel p-5 border-l-4 border-l-teal-500/80 relative glow-card-teal bg-[#0a0d16]/30">
              <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Core Match Strengths</span>
                <span className="text-[8px] text-gray-500">Positive indicators</span>
              </h3>
              {strengths.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {strengths.map((strength, index) => (
                    <li key={index} className="text-xs text-gray-300 flex items-start gap-2.5 leading-relaxed">
                      <svg className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 italic">No significant strengths reported.</p>
              )}
            </div>

            {/* Gaps / Weaknesses Card */}
            <div className="glass-panel p-5 border-l-4 border-l-rose-500/80 relative hover:shadow-[0_0_30px_rgba(244,63,94,0.1)] transition-all bg-[#0a0d16]/30">
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>🔴 Critical Match Gaps</span>
                <span className="text-[8px] text-rose-500/70 font-semibold font-mono">High Impact ({highCount})</span>
              </h3>
              {weaknesses.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {weaknesses.map((weakness, index) => (
                    <li key={index} className="text-xs text-gray-300 flex items-start gap-2.5 leading-relaxed">
                      <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 italic">No critical gaps identified.</p>
              )}
            </div>
          </div>

          {/* EXPLAINABLE MISSING KEYWORDS */}
          {missing_skills.length > 0 && (
            <div className="glass-panel p-5 border border-white/5 relative bg-black/15 glow-card-sky">
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Missing Keywords (Click to Copy)
              </h3>
              <p className="text-[9px] text-gray-500 mb-3.5 leading-relaxed">
                Evidence: These required keywords were mentioned multiple times in the job description but not detected in your resume. Click any chip to copy it.
              </p>

              <div className="flex flex-wrap gap-2.5">
                {missing_skills.map((skill, index) => {
                  const isCopied = copiedSkills === skill;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        navigator.clipboard.writeText(skill);
                        setCopiedSkills(skill);
                        setTimeout(() => setCopiedSkills(null), 2000);
                        showToast(`Copied keyword "${skill}" to clipboard!`);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 select-none ${
                        isCopied
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-sky-500/5 hover:bg-sky-500/15 border-sky-500/20 hover:border-sky-400/40 text-sky-300 cursor-pointer active:scale-95'
                      }`}
                    >
                      <span>{skill}</span>
                      {isCopied ? (
                        <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-sky-400/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* BEFORE / AFTER EXPERIENCE BULLET REWRITES */}
          {suggested_bullet_points.length > 0 && (
            <div className="glass-panel p-5 relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-teal-500/5 to-transparent blur-3xl pointer-events-none" />
              
              <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Experience Bullet Point Optimizations
                </span>
                <span className="text-[8px] text-amber-400 font-semibold font-mono">🟡 Medium Impact ({suggested_bullet_points.length})</span>
              </h3>
              <p className="text-[9px] text-gray-500 mb-4 leading-relaxed">
                Evidence: Google Gemini rewrote descriptions to incorporate missing keywords naturally while preserving your raw metrics.
              </p>

              <div className="flex flex-col gap-4">
                {suggested_bullet_points.map((rawBullet, index) => {
                  const parsed = parseBulletPoint(rawBullet);
                  const isCopied = copiedIndex === index;

                  return (
                    <div key={index} className="flex flex-col border border-white/5 bg-black/20 rounded-xl overflow-hidden">
                      {/* Header bar */}
                      <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/5 bg-white/5 text-[9px] font-bold">
                        <span className="text-teal-400">Optimization Bullet #{index + 1}</span>
                        
                        <button
                          onClick={() => {
                            if (!canCopySuggestions) {
                              toast.error('Copying bullet suggestions is coming soon.');
                              return;
                            }
                            navigator.clipboard.writeText(parsed.after);
                            setCopiedIndex(index);
                            setTimeout(() => setCopiedIndex(null), 2000);
                            showToast(`Copied bullet suggestion #${index + 1}!`);
                          }}
                          className="text-sky-400 hover:text-sky-300 uppercase tracking-wider flex items-center gap-1 transition-colors"
                        >
                          {isCopied ? (
                            <>
                              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              {!canCopySuggestions ? (
                                <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                              )}
                              <span>Copy Suggestion</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Before / After slots */}
                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5 text-xs">
                        {parsed.before ? (
                          <div className="p-3.5 bg-rose-500/[0.01]">
                            <span className="text-[8px] font-bold text-rose-400 uppercase tracking-wider block mb-1">Before (Original):</span>
                            <p className="line-through decoration-rose-500/25 leading-relaxed text-gray-400 font-sans">{parsed.before}</p>
                          </div>
                        ) : (
                          <div className="p-3.5 bg-black/10">
                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Base Context:</span>
                            <p className="italic leading-relaxed text-gray-400 font-sans">Reference experience context parsed from original resume.</p>
                          </div>
                        )}
                        <div className="p-3.5 bg-teal-500/[0.02]">
                          <span className="text-[8px] font-bold text-teal-400 uppercase tracking-wider block mb-1">After (Suggested):</span>
                          <p className="text-teal-300 font-mono leading-relaxed">{parsed.after}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ATS COMPATIBILITY VS RECRUITER READABILITY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ATS Advice */}
            <div className="glass-panel p-5 glow-card-violet bg-[#0a0d16]/30">
              <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>ATS Parser Advice</span>
                <span className="text-[8px] text-gray-500">Machine compatibility</span>
              </h3>
              <ul className="flex flex-col gap-3">
                {[...ats_improvements, ...ats_recommendations].slice(0, 5).map((item, index) => (
                  <li key={index} className="text-xs text-gray-300 flex items-start gap-2.5 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
                {ats_improvements.length === 0 && ats_recommendations.length === 0 && (
                  <li className="text-xs text-gray-500 italic">No structural compatibility items needed.</li>
                )}
              </ul>
            </div>

            {/* Recruiter Advice */}
            <div className="glass-panel p-5 glow-card-sky bg-[#0a0d16]/30">
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Human Recruiter Advice</span>
                <span className="text-[8px] text-gray-500">Readability & impact</span>
              </h3>
              <ul className="flex flex-col gap-3">
                {[...recruiter_improvements, ...resume_improvements].slice(0, 5).map((item, index) => (
                  <li key={index} className="text-xs text-gray-300 flex items-start gap-2.5 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
                {recruiter_improvements.length === 0 && resume_improvements.length === 0 && (
                  <li className="text-xs text-gray-500 italic">No layout or readability recommendations.</li>
                )}
              </ul>
            </div>

          </div>

          {/* Regenerate AI Suggestions block */}
          <div className="glass-panel p-6 border border-white/5 bg-gradient-to-r from-violet-500/5 to-sky-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-2">
            <div className="flex flex-col gap-1 max-w-lg">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Regenerate AI Recommendations
              </h4>
              <p className="text-[10px] text-gray-400 leading-relaxed mt-1">
                Google Gemini will re-scan the job description requirements and rewrite optimizations based on any changes you make to your files.
              </p>
            </div>
            <button
              onClick={() => {
                if (canGenerateAI) {
                  onRegenerateSuggestions(resumeText);
                }
              }}
              disabled={isGenerating || !canGenerateAI}
              title={!canGenerateAI ? "Available in future release" : "Regenerate recommendations"}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto ${
                !canGenerateAI 
                  ? 'bg-neutral-800/40 border border-neutral-700/30 text-gray-500 cursor-not-allowed opacity-50' 
                  : 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 cursor-pointer active:scale-95'
              }`}
            >
              {!canGenerateAI ? (
                <span>🔒 Regenerate Suggestions</span>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  <span>Regenerate Suggestions</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

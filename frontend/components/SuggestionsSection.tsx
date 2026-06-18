'use client';

import React from 'react';
import { AIRecommendationsResult } from '@/lib/api';

interface SuggestionsSectionProps {
  recommendations?: AIRecommendationsResult;
}

export default function SuggestionsSection({ recommendations }: SuggestionsSectionProps) {
  // Graceful handling of missing or unavailable state
  if (!recommendations || recommendations.status === 'unavailable') {
    return (
      <div className="glass-panel p-10 flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden min-h-[400px] border-l-4 border-l-amber-500">
        <div className="absolute w-[200px] h-[200px] bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-full blur-[45px] pointer-events-none" />
        
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative">
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

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Resume AI Summary */}
      {resume_summary && (
        <div className="glass-panel p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent blur-2xl pointer-events-none" />
          <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Recruiter Executive Summary
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed italic">
            &ldquo;{resume_summary}&rdquo;
          </p>
        </div>
      )}

      {/* 2. Priority Missing Skills */}
      {missing_skills.length > 0 && (
        <div className="glass-panel p-6">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Priority Skills to Add (JD Concept Gaps)
          </h3>
          <div className="flex flex-wrap gap-2">
            {missing_skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500/10 border border-sky-500/25 text-sky-300 shadow-sm shadow-sky-500/5 hover:bg-sky-500/15 transition-all cursor-default"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. Strengths and Weaknesses Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths Card */}
        <div className="glass-panel p-6 border-l-4 border-l-emerald-500/70 relative">
          <div className="absolute top-4 right-4 w-12 h-12 bg-emerald-500/5 rounded-full flex items-center justify-center pointer-events-none">
            <svg className="w-6 h-6 text-emerald-400/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4">
            Core Match Strengths
          </h3>
          {strengths.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {strengths.map((strength, index) => (
                <li key={index} className="text-xs text-gray-300 flex items-start gap-2.5 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  {strength}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 italic">No significant strengths reported.</p>
          )}
        </div>

        {/* Weaknesses Card */}
        <div className="glass-panel p-6 border-l-4 border-l-rose-500/70 relative">
          <div className="absolute top-4 right-4 w-12 h-12 bg-rose-500/5 rounded-full flex items-center justify-center pointer-events-none">
            <svg className="w-6 h-6 text-rose-400/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-4">
            Identified Resume Gaps
          </h3>
          {weaknesses.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {weaknesses.map((weakness, index) => (
                <li key={index} className="text-xs text-gray-300 flex items-start gap-2.5 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  {weakness}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 italic">No critical gaps identified.</p>
          )}
        </div>
      </div>

      {/* 4. Actionable Bullet Point Suggestions */}
      {suggested_bullet_points.length > 0 && (
        <div className="glass-panel p-6 relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-teal-500/5 to-transparent blur-3xl pointer-events-none" />
          <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Factual Experience Bullet Optimizations (Quantified & Actionable)
          </h3>
          <div className="flex flex-col gap-4">
            {suggested_bullet_points.map((bullet, index) => (
              <div key={index} className="flex gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="text-xs font-bold text-teal-400 bg-teal-500/10 w-6 h-6 rounded flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <p className="text-xs text-gray-200 leading-relaxed font-mono">
                  {bullet}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-teal-500/5 border border-teal-500/10 rounded-lg text-[10px] text-gray-400 leading-relaxed flex items-start gap-2">
            <svg className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            These suggestions optimize for ATS parser keyword detection while preserving your raw metrics. You can copy-paste these drop-in replacements directly into your resume sections.
          </div>
        </div>
      )}

      {/* 5. ATS & Recruiter Recommendations Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ATS Improvement Suggestions */}
        <div className="glass-panel p-6">
          <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            ATS System Compatibility Optimizations
          </h3>
          <ul className="flex flex-col gap-3">
            {[...ats_improvements, ...ats_recommendations].slice(0, 6).map((item, index) => (
              <li key={index} className="text-xs text-gray-300 flex items-start gap-2.5 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
            {ats_improvements.length === 0 && ats_recommendations.length === 0 && (
              <li className="text-xs text-gray-500 italic">No structural compatibility items needed.</li>
            )}
          </ul>
        </div>

        {/* Recruiter-Centric Improvements */}
        <div className="glass-panel p-6">
          <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Human Recruiter Readability Advice
          </h3>
          <ul className="flex flex-col gap-3">
            {[...recruiter_improvements, ...resume_improvements].slice(0, 6).map((item, index) => (
              <li key={index} className="text-xs text-gray-300 flex items-start gap-2.5 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
            {recruiter_improvements.length === 0 && resume_improvements.length === 0 && (
              <li className="text-xs text-gray-500 italic">No human layout adjustments recommended.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

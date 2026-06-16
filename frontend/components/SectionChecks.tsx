'use client';

import React from 'react';
import { SectionResult, ResumeUploadResult } from '@/lib/api';

interface SectionChecksProps {
  sections: SectionResult;
  resumeDetails: ResumeUploadResult;
}

export default function SectionChecks({ sections, resumeDetails }: SectionChecksProps) {
  const contactExists = !!(resumeDetails.email || resumeDetails.phone || resumeDetails.name);
  
  // List of standard sections to check
  const sectionList = [
    { key: 'contact', label: 'Contact Information', detected: contactExists, critical: true },
    { key: 'summary', label: 'Professional Summary', detected: !!sections.sections_detected.summary, critical: false },
    { key: 'experience', label: 'Work Experience', detected: !!sections.sections_detected.experience, critical: true },
    { key: 'skills', label: 'Skills Section', detected: !!sections.sections_detected.skills, critical: true },
    { key: 'projects', label: 'Projects Section', detected: !!sections.sections_detected.projects, critical: false },
    { key: 'education', label: 'Education Section', detected: !!sections.sections_detected.education, critical: true },
    { key: 'certificates', label: 'Certifications', detected: !!sections.sections_detected.certificates, critical: false },
    { key: 'achievements', label: 'Achievements / Honors', detected: !!sections.sections_detected.achievements, critical: false },
  ];

  return (
    <div className="glass-panel p-6">
      <div className="flex flex-col gap-1 mb-4 border-b border-white/5 pb-2">
        <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider">
          Parsed Resume Sections
        </h3>
        <p className="text-xs text-gray-400">
          ATS parsers look for standard headings to categorize resume content.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sectionList.map((sec) => {
          return (
            <div
              key={sec.key}
              className={`flex items-center justify-between p-3.5 rounded-xl border ${
                sec.detected
                  ? 'bg-teal-500/5 border-teal-500/10 text-teal-400'
                  : sec.critical
                    ? 'bg-rose-500/5 border-rose-500/10 text-rose-400'
                    : 'bg-amber-500/5 border-amber-500/10 text-amber-400'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Indicator Circle */}
                <div className="flex-shrink-0">
                  {sec.detected ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : sec.critical ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-100">{sec.label}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">
                    {sec.detected 
                      ? 'Detected successfully' 
                      : sec.critical 
                        ? 'Missing (Critical impact)' 
                        : 'Missing (Optional section)'}
                  </span>
                </div>
              </div>

              <div className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-black/10 border border-white/5">
                {sec.detected ? 'Found' : sec.critical ? 'Missing' : 'Optional'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

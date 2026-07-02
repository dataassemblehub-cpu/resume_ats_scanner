'use client';

import React, { useState } from 'react';
import { SectionResult, ResumeUploadResult } from '@/lib/api';

interface SectionChecksProps {
  sections: SectionResult;
  resumeDetails: ResumeUploadResult;
}

export default function SectionChecks({ sections, resumeDetails }: SectionChecksProps) {
  const [openPreviews, setOpenPreviews] = useState<Record<string, boolean>>({});

  const togglePreview = (key: string) => {
    setOpenPreviews((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const contactExists = !!(resumeDetails.email || resumeDetails.phone || resumeDetails.name);

  // List of standard sections with corresponding icons, themes, and tip texts
  const sectionList = [
    {
      key: 'contact',
      label: 'Contact Information',
      detected: contactExists,
      critical: true,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      glowClass: 'glow-card-sky',
      colorText: 'text-sky-400',
      bgColor: 'bg-sky-500/5',
      borderColor: 'border-sky-500/10',
      tip: 'Ensure your resume includes your Name, Email, and Phone number clearly at the top.',
      getText: () => {
        const parts = [];
        if (resumeDetails.name) parts.push(`Name: ${resumeDetails.name}`);
        if (resumeDetails.email) parts.push(`Email: ${resumeDetails.email}`);
        if (resumeDetails.phone) parts.push(`Phone: ${resumeDetails.phone}`);
        return parts.join('\n') || 'No contact details parsed.';
      }
    },
    {
      key: 'summary',
      label: 'Professional Summary',
      detected: !!sections.sections_detected.summary,
      critical: false,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      glowClass: 'glow-card-violet',
      colorText: 'text-violet-400',
      bgColor: 'bg-violet-500/5',
      borderColor: 'border-violet-500/10',
      tip: 'A short summary helps ATS and recruiters immediately understand your core value proposition.',
      getText: () => sections.section_text?.summary || ''
    },
    {
      key: 'experience',
      label: 'Work Experience',
      detected: !!sections.sections_detected.experience,
      critical: true,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      glowClass: 'glow-card-teal',
      colorText: 'text-teal-400',
      bgColor: 'bg-teal-500/5',
      borderColor: 'border-teal-500/10',
      tip: 'Critical. Make sure you use a standard heading like "Work Experience" or "Professional Experience".',
      getText: () => sections.section_text?.experience || ''
    },
    {
      key: 'skills',
      label: 'Skills Section',
      detected: !!sections.sections_detected.skills,
      critical: true,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      glowClass: 'glow-card-sky',
      colorText: 'text-sky-400',
      bgColor: 'bg-sky-500/5',
      borderColor: 'border-sky-500/10',
      tip: 'Critical. Having a dedicated skills list helps ATS matching algorithms find keywords.',
      getText: () => sections.section_text?.skills || ''
    },
    {
      key: 'projects',
      label: 'Projects Section',
      detected: !!sections.sections_detected.projects,
      critical: false,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      glowClass: 'glow-card-violet',
      colorText: 'text-violet-400',
      bgColor: 'bg-violet-500/5',
      borderColor: 'border-violet-500/10',
      tip: 'Highly recommended for technical profiles to showcase hands-on experience and code portfolios.',
      getText: () => sections.section_text?.projects || ''
    },
    {
      key: 'education',
      label: 'Education Section',
      detected: !!sections.sections_detected.education,
      critical: true,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
        </svg>
      ),
      glowClass: 'glow-card-teal',
      colorText: 'text-teal-400',
      bgColor: 'bg-teal-500/5',
      borderColor: 'border-teal-500/10',
      tip: 'Critical. Ensure your degrees, universities, and graduation dates are parsed correctly.',
      getText: () => sections.section_text?.education || ''
    },
    {
      key: 'certificates',
      label: 'Certifications',
      detected: !!sections.sections_detected.certificates,
      critical: false,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806a3.42 3.42 0 014.438 0a3.42 3.42 0 001.946.806a3.42 3.42 0 013.138 3.138a3.42 3.42 0 00.806 1.946a3.42 3.42 0 010 4.438a3.42 3.42 0 00-.806 1.946a3.42 3.42 0 01-3.138 3.138a3.42 3.42 0 00-1.946.806a3.42 3.42 0 01-4.438 0a3.42 3.42 0 00-1.946-.806a3.42 3.42 0 01-3.138-3.138a3.42 3.42 0 00-.806-1.946a3.42 3.42 0 010-4.438a3.42 3.42 0 00.806-1.946a3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      glowClass: 'glow-card-amber',
      colorText: 'text-amber-400',
      bgColor: 'bg-amber-500/5',
      borderColor: 'border-amber-500/10',
      tip: 'Adding professional credentials highlights continuous learning and specialized expertise.',
      getText: () => sections.section_text?.certificates || ''
    },
    {
      key: 'achievements',
      label: 'Achievements & Awards',
      detected: !!sections.sections_detected.achievements,
      critical: false,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm-2 4h4M8 12h8m-8 4h8" />
        </svg>
      ),
      glowClass: 'glow-card-amber',
      colorText: 'text-amber-400',
      bgColor: 'bg-amber-500/5',
      borderColor: 'border-amber-500/10',
      tip: 'Highlights scholarship, contests, or exceptional business contributions.',
      getText: () => sections.section_text?.achievements || ''
    },
  ];

  return (
    <div className="glass-panel p-6">
      <div className="flex flex-col gap-1 mb-6 border-b border-white/5 pb-3">
        <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
          <span className="text-gradient">Parsed Resume Sections</span>
        </h3>
        <p className="text-xs text-gray-400">
          ATS parsers look for standard headings to categorize resume content. Review what was successfully parsed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sectionList.map((sec) => {
          const sectionText = sec.getText();
          const wordCount = sectionText ? sectionText.split(/\s+/).filter(Boolean).length : 0;
          const charCount = sectionText ? sectionText.length : 0;
          const isOpen = !!openPreviews[sec.key];

          return (
            <div
              key={sec.key}
              className={`flex flex-col p-4 rounded-xl border transition-all duration-300 ${
                sec.detected
                  ? `${sec.bgColor} ${sec.borderColor} ${sec.glowClass}`
                  : sec.critical
                    ? 'bg-rose-500/5 border-rose-500/10 hover:shadow-[0_0_30px_rgba(244,63,94,0.15)] hover:border-rose-500/30'
                    : 'bg-amber-500/5 border-amber-500/10 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] hover:border-amber-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg bg-black/20 ${sec.colorText}`}>
                    {sec.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-100">{sec.label}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      {sec.detected
                        ? `Detected • ${wordCount} words (${charCount} chars)`
                        : sec.critical
                          ? '❌ Missing (Critical impact)'
                          : '⚠️ Missing (Optional section)'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    sec.detected 
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                      : sec.critical 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {sec.detected ? '✅ Found' : sec.critical ? 'Missing' : 'Optional'}
                  </span>
                </div>
              </div>

              {/* Show details / Preview */}
              {sec.detected && sectionText ? (
                <div className="mt-3 border-t border-white/5 pt-3">
                  <button
                    onClick={() => togglePreview(sec.key)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    <svg
                      className={`w-3.5 h-3.5 transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    {isOpen ? 'Hide Parsed Text' : 'Preview Parsed Text'}
                  </button>

                  {isOpen && (
                    <div className="mt-2 text-xs text-gray-300 bg-black/40 border border-white/5 rounded-lg p-3 max-h-40 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed scrollbar-thin">
                      {sectionText}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3 border-t border-white/5 pt-2">
                  <p className="text-[11px] text-gray-400 italic">
                    {sec.tip}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


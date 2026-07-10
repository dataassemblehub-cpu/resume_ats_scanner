'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useEntitlements } from '@/lib/auth';
import { getHistoryDetail, runComprehensiveAnalysis, ComprehensiveAnalysisResult } from '@/lib/api';
import { toast } from 'react-hot-toast';

// Formatting helpers replicated from FormattingDetails for print view
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

export default function ExportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { loading: authLoading, token } = useAuth();
  const { canExportReport, plan } = useEntitlements();

  const [result, setResult] = useState<ComprehensiveAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Print settings
  const [hideContact, setHideContact] = useState<boolean>(false);
  const [autoPrint, setAutoPrint] = useState<boolean>(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  // 1. Restore autoPrint setting on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ats_export_autoprint') === 'true';
      setAutoPrint(stored);
    }
  }, []);

  const handleToggleAutoPrint = (val: boolean) => {
    setAutoPrint(val);
    localStorage.setItem('ats_export_autoprint', String(val));
  };

  const handlePrint = () => {
    toast.success('Opening print dialog...', { id: 'print-dialog', duration: 2500 });
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // 2. Load data from local storage (fast path) or API (fallback/direct URL share)
  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        toast.loading('Preparing report preview...', { id: 'export-load' });

        // Check cache first
        const cachedStr = localStorage.getItem('ats_export_data');
        if (cachedStr) {
          try {
            const cached = JSON.parse(cachedStr) as any;
            if (cached && cached.resumeDetails && cached.resumeDetails.id === id) {
              setResult(cached);
              setCreatedAt(cached.created_at || cached.createdAt || new Date().toISOString());
              setLoading(false);
              toast.success('Report preview ready!', { id: 'export-load' });
              return;
            }
          } catch (e) {
            console.error('Failed to parse cached export data', e);
          }
        }

        // Fetch from backend if cache is missing or mismatched
        const detail = await getHistoryDetail(id);
        const analysis = await runComprehensiveAnalysis(
          detail.resumeDetails,
          detail.jd_text || ''
        );
        const finalResult: ComprehensiveAnalysisResult = {
          ...analysis,
          jdText: detail.jd_text,
          recommendations: detail.recommendations || undefined
        };

        setResult(finalResult);
        setCreatedAt(detail.created_at || new Date().toISOString());
        toast.success('Report preview ready!', { id: 'export-load' });
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load scan report.');
        toast.error(err.message || 'Failed to load scan report.', { id: 'export-load' });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, token, authLoading]);

  // 3. Trigger printing if autoprint is enabled and data has loaded
  useEffect(() => {
    if (!loading && result && autoPrint) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, result, autoPrint]);

  // Loading Screens
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-gray-200">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-t-sky-500 border-r-sky-500/30 border-b-sky-500/10 border-l-sky-500/50 animate-spin" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-sky-400">Loading PDF Export Preview...</p>
        <p className="text-xs text-gray-500 mt-1">Retrieving scan metrics and recommendations</p>
      </div>
    );
  }

  // Not Logged In
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-100 mb-2">Authentication Required</h2>
        <p className="text-sm text-gray-400 max-w-md mb-6">
          Please log in to your account to view and export resume reports.
        </p>
        <button
          onClick={() => router.push('/scanner')}
          className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white rounded-xl transition-all"
        >
          Return to Login
        </button>
      </div>
    );
  }

  // Premium Lock verification (Backend Source of Truth Gated)
  if (!canExportReport) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-100 mb-2">Premium Subscription Required</h2>
        <p className="text-sm text-gray-400 max-w-md mb-6">
          PDF report exporting is a premium feature. Please upgrade to a premium plan to unlock downloadable reports.
        </p>
        <button
          onClick={() => router.push('/scanner')}
          className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white rounded-xl transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // General Loading/Query Error
  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-100 mb-2">Error Loading Scan Report</h2>
        <p className="text-sm text-gray-400 max-w-md mb-6">{error || 'An unexpected error occurred.'}</p>
        <button
          onClick={() => router.push('/scanner')}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-gray-200 rounded-xl transition-all border border-white/5"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { score, keywords, formatting, sections, recommendations, resumeDetails } = result;

  // Process Formatting List
  const formattedIssues = [
    ...formatting.issues.map((text) => ({ text, type: 'Error', ...getImpact(text), category: getCategory(text), fix: getFixGuide(text) })),
    ...formatting.warnings.map((text) => ({ text, type: 'Warning', ...getImpact(text), category: getCategory(text), fix: getFixGuide(text) })),
    ...formatting.recommendations.map((text) => ({ text, type: 'Tip', points: 'Suggestion', pointsNum: 0, severity: 'info', category: getCategory(text), fix: getFixGuide(text) }))
  ];

  // AI recommendations validation
  const hasAIRecommendations = recommendations && recommendations.status === 'success';

  return (
    <div className="min-h-screen bg-slate-900 text-gray-900 font-sans leading-normal">
      {/* 1. PRINT HEADERS OVERRIDES & STYLINGS */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        
        .font-outfit {
          font-family: 'Outfit', sans-serif;
        }

        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          
          /* Force standard background graphics */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-hidden {
            display: none !important;
          }

          .print-container {
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }

          @page {
            size: A4;
            margin: 15mm 15mm 15mm 15mm;
          }

          .page-break-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .page-break-before {
            page-break-before: always !important;
            break-before: always !important;
          }
        }
      `}</style>

      {/* 2. PRINT-HIDDEN TOP CONTROL BAR */}
      <nav className="print-hidden w-full bg-slate-950 border-b border-white/10 px-6 py-4 flex flex-wrap items-center justify-between text-gray-200 shadow-md sticky top-0 z-50 gap-4 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-black text-white font-outfit shadow-md shadow-sky-500/25">
            ATS
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider uppercase font-outfit">Report PDF Preview</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">Pre-visualization grid before downloading</p>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={hideContact}
              onChange={(e) => setHideContact(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900 cursor-pointer"
            />
            🕵️ Hide Personal Details (Privacy)
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={autoPrint}
              onChange={(e) => handleToggleAutoPrint(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900 cursor-pointer"
            />
            ⚙️ Auto-trigger Print Dialog
          </label>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-xs font-black text-white rounded-lg shadow-lg hover:shadow-sky-500/10 active:scale-95 transition-all"
          >
            🖨️ Print / Save to PDF
          </button>

          <button
            onClick={() => router.push('/scanner')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/5 text-xs font-bold text-gray-300 rounded-lg transition-all"
          >
            Return
          </button>
        </div>
      </nav>

      {/* Info notice for local browser settings */}
      <div className="print-hidden max-w-4xl mx-auto mt-4 px-4">
        <div className="p-3.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400 text-[11px] leading-relaxed flex items-start gap-2.5">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong className="font-bold">Printing Suggestion:</strong> In the browser print pop-up, set <strong className="font-bold">Layout</strong> to <strong className="font-bold">Portrait</strong>, <strong className="font-bold">Margins</strong> to <strong className="font-bold">Default/None</strong>, and check the option for <strong className="font-bold">"Background graphics"</strong> to capture the scorecard background elements properly.
          </div>
        </div>
      </div>

      {/* 3. A4 PRINT DOCUMENT BOX */}
      <main className="print-container bg-white max-w-4xl mx-auto my-8 p-12 border border-slate-200 shadow-xl rounded-none md:rounded-xl">
        {/* Document Header Block */}
        <header className="flex items-start justify-between border-b-2 border-slate-200 pb-6 mb-8 gap-4">
          <div className="flex flex-col">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 font-outfit">
              {hideContact ? 'Candidate (Profile Masked)' : (resumeDetails.name || 'Candidate Profile')}
            </h2>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-semibold mt-2.5">
              {!hideContact && resumeDetails.email && (
                <span className="flex items-center gap-1">✉️ {resumeDetails.email}</span>
              )}
              {!hideContact && resumeDetails.phone && (
                <span className="flex items-center gap-1">📞 {resumeDetails.phone}</span>
              )}
              <span className="flex items-center gap-1">📅 Scan Date: {new Date(createdAt || Date.now()).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
            </div>
            
            <span className="inline-block mt-3 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 self-start">
              ATS Analysis Report
            </span>
          </div>

          {/* Large Overall Score Stamp */}
          <div className="flex flex-col items-center justify-center px-6 py-4 bg-slate-900 text-white rounded-2xl border border-slate-800 text-center flex-shrink-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ATS Score</span>
            <span className="text-3xl font-black text-sky-400 mt-1 font-outfit">{score.overall}/100</span>
          </div>
        </header>

        {/* Section 1: Scores and Competence Grid */}
        <section className="mb-8 page-break-avoid">
          <h3 className="text-base font-bold text-slate-900 font-outfit border-b border-slate-200 pb-2 mb-4 uppercase tracking-wider">
            1. Evaluation Scoring Breakdown
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {/* Row-by-Row Metrics */}
            <div className="flex flex-col gap-3.5">
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700">Skills Core Match</span>
                  <span className="text-slate-950 font-outfit">{score.skills}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-50 h-full rounded-full" style={{ width: `${score.skills}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700">Experience Evaluation</span>
                  <span className="text-slate-950 font-outfit">{score.experience}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-50 h-full rounded-full" style={{ width: `${score.experience}%` }} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700">Project Contributions</span>
                  <span className="text-slate-950 font-outfit">{score.projects}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-50 h-full rounded-full" style={{ width: `${score.projects}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700">Education Details</span>
                  <span className="text-slate-950 font-outfit">{score.education}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-50 h-full rounded-full" style={{ width: `${score.education}%` }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Keywords Breakdown */}
        <section className="mb-8 page-break-avoid">
          <h3 className="text-base font-bold text-slate-900 font-outfit border-b border-slate-200 pb-2 mb-4 uppercase tracking-wider">
            2. Keyword Analytics
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Matched Keywords */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-black uppercase text-emerald-600 tracking-wider flex items-center gap-1.5 mb-3">
                ✔️ Matched Keywords ({keywords.matched.length})
              </span>
              {keywords.matched.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {keywords.matched.map((keyword, index) => (
                    <span key={index} className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No matching keywords detected.</p>
              )}
            </div>

            {/* Missing Keywords */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-black uppercase text-rose-600 tracking-wider flex items-center gap-1.5 mb-3">
                ❌ Missing Keywords ({keywords.missing.length})
              </span>
              {keywords.missing.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {keywords.missing.map((keyword, index) => (
                    <span key={index} className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No missing keywords detected. Great coverage!</p>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Formatting Diagnostics */}
        <section className="mb-8 page-break-avoid">
          <h3 className="text-base font-bold text-slate-900 font-outfit border-b border-slate-200 pb-2 mb-4 uppercase tracking-wider">
            3. Formatting & Structural Audits
          </h3>
          
          {formattedIssues.length > 0 ? (
            <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
              {formattedIssues.map((issue, index) => (
                <div key={index} className="p-4 bg-white hover:bg-slate-50 flex items-start gap-4">
                  {/* Status Indicator */}
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex-shrink-0 border ${
                    issue.type === 'Error'
                      ? 'bg-rose-550 text-rose-700 border-rose-200'
                      : issue.type === 'Warning'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-sky-50 text-sky-700 border-sky-200'
                  }`}>
                    {issue.type}
                  </span>

                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">{issue.text}</span>
                    <span className="text-[10px] text-slate-500 font-semibold mt-0.5">Category: {issue.category}</span>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
                      <strong className="font-bold text-slate-800">Recommendation:</strong> {issue.fix}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No formatting issues detected.</p>
          )}
        </section>

        {/* Section 4: Section Detections */}
        <section className="mb-8 page-break-avoid">
          <h3 className="text-base font-bold text-slate-900 font-outfit border-b border-slate-200 pb-2 mb-4 uppercase tracking-wider">
            4. Parsing Section Checks
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(sections.sections_detected).map(([secName, detected]) => (
              <div key={secName} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 capitalize">{secName.replace('_', ' ')}</span>
                {detected ? (
                  <span className="text-xs font-black text-emerald-600">✔️ Detected</span>
                ) : (
                  <span className="text-xs font-black text-rose-600">❌ Missing</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: AI Recommendations (Force Page Break if it fits on page 2) */}
        <section className="page-break-before">
          <h3 className="text-base font-bold text-slate-900 font-outfit border-b border-slate-200 pb-2 mb-4 uppercase tracking-wider">
            5. AI-Assisted Bullet Point & Content Suggestions
          </h3>

          {/* Gracefully handle missing AI Recommendations */}
          {!hasAIRecommendations ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-xs font-bold text-slate-800 mb-1">AI Recommendations Not Generated</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                AI recommendations were not triggered during this scan. To generate them, return to the main dashboard, select the <strong className="font-bold">AI Suggestions</strong> tab, and click "Generate Recommendations".
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Summary Block */}
              {recommendations.resume_summary && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-xs font-black uppercase text-sky-700 tracking-wider">Analysis Summary Overview</span>
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed font-semibold">
                    {recommendations.resume_summary}
                  </p>
                </div>
              )}

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl page-break-avoid">
                  <span className="text-xs font-black uppercase text-emerald-600 tracking-wider mb-2 block">
                    🌟 Key Strengths Detected
                  </span>
                  {recommendations.strengths && recommendations.strengths.length > 0 ? (
                    <ul className="list-disc list-inside text-xs text-slate-700 space-y-1.5">
                      {recommendations.strengths.map((str, idx) => (
                        <li key={idx} className="leading-relaxed">{str}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No key strengths reported.</p>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl page-break-avoid">
                  <span className="text-xs font-black uppercase text-amber-600 tracking-wider mb-2 block">
                    ⚠️ Areas For Improvement
                  </span>
                  {recommendations.weaknesses && recommendations.weaknesses.length > 0 ? (
                    <ul className="list-disc list-inside text-xs text-slate-700 space-y-1.5">
                      {recommendations.weaknesses.map((weak, idx) => (
                        <li key={idx} className="leading-relaxed">{weak}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No warnings reported.</p>
                  )}
                </div>
              </div>

              {/* Experience Bullet point Optimization Comparison */}
              {recommendations.suggested_bullet_points && recommendations.suggested_bullet_points.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Experience Description Optimizations
                  </h4>
                  
                  <div className="flex flex-col gap-4">
                    {recommendations.suggested_bullet_points.map((rawBullet, idx) => {
                      const parsed = parseBulletPoint(rawBullet);
                      
                      return (
                        <div key={idx} className="flex flex-col border border-slate-200 rounded-xl overflow-hidden page-break-avoid">
                          <div className="px-3.5 py-2 border-b border-slate-200 bg-slate-50 text-[10px] font-black text-sky-700">
                            OPTIMIZATION RECOMMENDATION #{idx + 1}
                          </div>
                          
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white text-xs leading-relaxed">
                            {parsed.before && (
                              <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Original Text</span>
                                <p className="text-slate-600 italic bg-slate-50 p-2.5 rounded border border-slate-100">{parsed.before}</p>
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-sky-500 uppercase tracking-widest mb-1">Optimized Rewrite</span>
                              <p className="text-slate-900 font-bold bg-sky-550/20 p-2.5 rounded border border-sky-100">{parsed.after}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Missing Skills & ATS Improvements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 page-break-avoid">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-xs font-black uppercase text-rose-600 tracking-wider mb-2 block">
                    🔧 Missing Actionable Skills
                  </span>
                  {recommendations.missing_skills && recommendations.missing_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {recommendations.missing_skills.map((skill, idx) => (
                        <span key={idx} className="text-[9px] font-bold px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No missing skills flagged.</p>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-xs font-black uppercase text-sky-600 tracking-wider mb-2 block">
                    ⚙️ ATS Optimizations
                  </span>
                  {recommendations.ats_improvements && recommendations.ats_improvements.length > 0 ? (
                    <ul className="list-disc list-inside text-xs text-slate-700 space-y-1.5">
                      {recommendations.ats_improvements.map((imp, idx) => (
                        <li key={idx} className="leading-relaxed">{imp}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No general recommendations reported.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      
      {/* Tiny printable page footer */}
      <footer className="w-full text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest py-8 border-t border-slate-100 bg-white">
        ATS Scorecard Report Generated by AI Resume ATS Scanner. All rights reserved.
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { ComprehensiveAnalysisResult, getAIRecommendations, AIRecommendationsResult } from '@/lib/api';
import OverviewSection from './OverviewSection';
import SectionChecks from './SectionChecks';
import KeywordDetails from './KeywordDetails';
import FormattingDetails from './FormattingDetails';
import SuggestionsSection from './SuggestionsSection';
import HistorySection from './HistorySection';
import AuthModal from './AuthModal';
import { useAuth, useEntitlements } from '@/lib/auth';
import { TabType } from '../app/page';

interface DashboardProps {
  result: ComprehensiveAnalysisResult;
  onReset: () => void;
  onRecalculate: (newResumeText: string) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  prevScore: {
    overall: number;
    skills: number;
    experience: number;
    projects: number;
    education: number;
    formatting: number;
    semantic: number;
    keywords: number;
  } | null;
  onRegenerateSuggestions: (newResumeText: string) => Promise<void>;
  onLoadScan: (result: ComprehensiveAnalysisResult) => void;
}

export default function Dashboard({ 
  result, 
  onReset, 
  onRecalculate, 
  activeTab, 
  setActiveTab, 
  prevScore, 
  onRegenerateSuggestions,
  onLoadScan
}: DashboardProps) {
  const { user, logout, upgradeAccount } = useAuth();
  const { canGenerateAI, canExportReport, isPremium, plan } = useEntitlements();
  const [recommendations, setRecommendations] = useState<AIRecommendationsResult | undefined>(result.recommendations);
  const [isGenerating, setIsGenerating] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Sync recommendations state when result changes
  useEffect(() => {
    setRecommendations(result.recommendations);
  }, [result.recommendations]);

  const handleGenerateAI = async () => {
    setActiveTab('ai-suggestions');
    setIsGenerating(true);
    try {
      const atsResults = {
        overall: result.score.overall,
        skills: result.score.skills,
        experience: result.score.experience,
        projects: result.score.projects,
        education: result.score.education,
        keywords: {
          matched: result.keywords.matched,
          missing: result.keywords.missing,
        },
        formatting: {
          issues: result.formatting.issues,
          warnings: result.formatting.warnings,
        }
      };

      const recs = await getAIRecommendations(
        result.resumeDetails.parsed_text,
        result.jdText || '',
        atsResults,
        result.resumeDetails.id
      );
      setRecommendations(recs);

      const saved = localStorage.getItem('ats_analysis_result');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          parsed.recommendations = recs;
          localStorage.setItem('ats_analysis_result', JSON.stringify(parsed));
        } catch (e) {
          console.error('Failed to update localStorage with recommendations', e);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { 
      key: 'overview', 
      label: 'Overview',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      )
    },
    { 
      key: 'keywords', 
      label: 'Keywords Match',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      )
    },
    { 
      key: 'formatting', 
      label: 'Formatting Check',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      key: 'ai-suggestions', 
      label: 'AI Suggestions',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    },
    { 
      key: 'history', 
      label: 'Scan History',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      key: 'exports', 
      label: 'Export Options',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )
    },
  ];

  return (
    <div className="flex-1 flex flex-col lg:flex-row w-full min-h-screen relative z-10">
      
      {/* 1. LEFT SIDEBAR (Desktop only) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-black/20 backdrop-blur-md p-6 shrink-0 justify-between sticky top-0 h-screen">
        <div className="flex flex-col gap-8">
          {/* Logo Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 flex items-center justify-center font-black text-white shadow-md shadow-sky-500/20 text-sm">
              ATS
            </div>
            <div>
              <h1 className="text-xs font-extrabold text-white tracking-tight uppercase">
                AI Resume Scanner
              </h1>
              <p className="text-[8px] text-gray-500 font-bold uppercase tracking-wide mt-0.5">
                ATS scoring & optimization engine
              </p>
            </div>
          </div>

          {/* Candidate Profile Widget */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
            <div>
              <h3 className="text-xs font-bold text-gray-100 truncate">
                {result.resumeDetails.name || 'Anonymous Candidate'}
              </h3>
              <p className="text-[10px] text-gray-400 truncate mt-0.5">
                {result.resumeDetails.email || 'No email parsed'}
              </p>
            </div>

            <div className="border-t border-white/5 pt-2 flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Overall Score</span>
              <span className="text-xs font-extrabold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded font-mono">
                {result.score.overall}%
              </span>
            </div>
          </div>

          {/* User Account Portal Widget */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
            {user ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Account</span>
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    isPremium ? 'text-teal-400 bg-teal-500/10 border border-teal-500/20' : 'text-gray-400 bg-white/5 border border-white/5'
                  }`}>
                    {plan}
                  </span>
                </div>
                <div className="text-[10px] text-gray-300 truncate font-mono" title={user.email}>{user.email}</div>
                
                {!isPremium && (
                  <button
                    onClick={async () => {
                      try {
                        await upgradeAccount();
                        alert('Upgrade successful! You are now Premium.');
                      } catch (err: any) {
                        alert(err.message || 'Upgrade failed.');
                      }
                    }}
                    className="mt-1 w-full py-1.5 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-400 hover:to-sky-400 text-white font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer text-center active:scale-95"
                  >
                    ✨ Upgrade to Premium
                  </button>
                )}
                
                <button
                  onClick={logout}
                  className="mt-1 w-full py-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[9px] font-bold uppercase rounded border border-white/5 transition-all cursor-pointer active:scale-95"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Account</span>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="w-full py-2 bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-400 hover:to-violet-400 text-white font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer active:scale-95 shadow-md shadow-sky-500/10"
                >
                  Sign In / Register
                </button>
              </div>
            )}
          </div>

          {/* Sidebar Nav items */}
          <nav className="flex flex-col gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`sidebar-button ${activeTab === tab.key ? 'active' : ''}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Scan Another Button (Sidebar Bottom) */}
        <button
          onClick={onReset}
          className="sidebar-button border border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-[11px] py-2.5 flex items-center justify-center gap-1.5 rounded-xl transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Scan Another
        </button>
      </aside>

      {/* 2. TOP NAVBAR HEADER (Mobile only) */}
      <header className="lg:hidden flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md px-4 py-3 sticky top-0 z-30 w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-sky-500 to-violet-500 flex items-center justify-center font-bold text-white text-xs">
            ATS
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white truncate max-w-[100px]">
              {result.resumeDetails.name || 'ATS Report'}
            </span>
            <span className="text-[8px] text-gray-400 font-bold">Score: {result.score.overall}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={logout}
              className="text-[9px] font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-white/5 border border-white/5 px-2 py-1.5 rounded-lg"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="text-[9px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-sky-500 to-violet-500 px-2.5 py-1.5 rounded-lg shadow"
            >
              Sign In
            </button>
          )}
          <button
            onClick={onReset}
            className="text-[9px] font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-lg transition-all"
          >
            Reset
          </button>
        </div>
      </header>

      {/* 3. DYNAMIC CONTENT MAIN AREA */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 lg:p-10 h-screen max-w-5xl mx-auto w-full pb-24 lg:pb-8">
        <div className="flex flex-col gap-6">
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6">
              <OverviewSection
                score={result.score}
                semantic={result.semantic}
                keywords={result.keywords}
                formatting={result.formatting}
                sections={result.sections}
                recommendations={recommendations}
                onGenerateAI={handleGenerateAI}
                isGenerating={isGenerating}
                prevScore={prevScore}
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
            !user ? (
              <div className="glass-panel p-12 flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden min-h-[400px]">
                <div className="absolute w-[300px] h-[300px] bg-gradient-to-r from-violet-500/10 to-sky-500/10 rounded-full blur-[60px] -top-12 -right-12 pointer-events-none" />
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/5 text-gray-500">
                  <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-2 max-w-sm relative z-10">
                  <h3 className="text-lg font-bold text-white tracking-tight">AI Suggestions Locked</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    AI suggestions, gap analysis, and tailored bullet point optimizations require authentication. Create a free account or sign in to continue.
                  </p>
                </div>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-400 hover:to-violet-400 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-sky-500/10 active:scale-95 transition-all relative z-10"
                >
                  Sign In / Create Account
                </button>
              </div>
            ) : recommendations ? (
              <SuggestionsSection 
                recommendations={recommendations} 
                onRecalculate={onRecalculate}
                resumeText={result.resumeDetails.parsed_text}
                keywords={result.keywords}
                onRegenerateSuggestions={onRegenerateSuggestions}
                isGenerating={isGenerating}
              />
            ) : (
              <div className="glass-panel p-12 flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden min-h-[400px]">
                <div className="absolute w-[300px] h-[300px] bg-gradient-to-r from-violet-500/15 to-sky-500/15 rounded-full blur-[60px] -top-12 -right-12 pointer-events-none" />
                <div className="absolute w-[200px] h-[200px] bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-full blur-[40px] -bottom-12 -left-12 pointer-events-none" />
 
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                    <div className="flex flex-col gap-1 max-w-sm">
                      <h3 className="text-md font-bold text-white tracking-tight">Generating AI Suggestions</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Google Gemini is analyzing profile gaps and rewriting experience bullet points...
                      </p>
                    </div>
                  </div>
                ) : !canGenerateAI ? (
                  <div className="flex flex-col items-center gap-6 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="flex flex-col gap-2 max-w-md">
                      <h3 className="text-xl font-extrabold text-white tracking-tight">Free Tier Limit Reached</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        You have utilized your 1 free AI recommendations scan. Upgrade to Premium to unlock unlimited scans, professional CV re-writing, and PDF exports.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await upgradeAccount();
                          alert('Upgrade successful! You are now Premium.');
                        } catch (err: any) {
                          alert(err.message || 'Upgrade failed.');
                        }
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    >
                      ✨ Upgrade to Premium
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                      <svg className="w-8 h-8 text-sky-400 group-hover:scale-110 transition-transform duration-300 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096L9 21zm0 0h1m-1 0H8m6.813-5.096L15 21m0 0l-.813-5.096L15 21zm0 0h.5m-.5 0h-.5M8 6h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
                      </svg>
                    </div>
 
                    <div className="flex flex-col gap-2 max-w-md relative z-10">
                      <h3 className="text-xl font-extrabold text-white tracking-tight">
                        Generate AI Recommendations
                      </h3>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        Leverage Google Gemini to analyze gaps, prioritize missing technical skills, and generate tailor-made experience bullet optimizations tailored to your job description.
                      </p>
                    </div>
 
                    <button
                      onClick={handleGenerateAI}
                      className="px-6 py-3 bg-gradient-to-r from-violet-600 to-sky-600 hover:from-violet-500 hover:to-sky-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-violet-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 relative z-10"
                    >
                      ✨ Generate AI Recommendations
                    </button>
                  </>
                )}
              </div>
            )
          )}

          {activeTab === 'history' && (
            !user ? (
              <div className="glass-panel p-12 flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden min-h-[400px]">
                <div className="absolute w-[300px] h-[300px] bg-gradient-to-r from-violet-500/10 to-sky-500/10 rounded-full blur-[60px] -top-12 -right-12 pointer-events-none" />
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/5 text-gray-500">
                  <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-2 max-w-sm relative z-10">
                  <h3 className="text-lg font-bold text-white tracking-tight">Scan History Locked</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Browser persistence and server-side scan history tracking require account authentication. Create a free account or sign in to load past scans.
                  </p>
                </div>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-400 hover:to-violet-400 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-sky-500/10 active:scale-95 transition-all relative z-10"
                >
                  Sign In / Create Account
                </button>
              </div>
            ) : (
              <HistorySection onLoadScan={onLoadScan} onSetTab={setActiveTab} />
            )
          )}

          {activeTab === 'exports' && (
            <div className="glass-panel p-8 min-h-[300px] flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Export Analytics</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Download your scan results report in various formats for review or sharing.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    if (!canExportReport) {
                      alert('PDF Report exporting requires a Premium subscription. Please upgrade to unlock.');
                      return;
                    }
                    // Save the current analysis result in cache for fast preview load
                    localStorage.setItem('ats_export_data', JSON.stringify(result));
                    window.open(`/export/${result.resumeDetails.id}`, '_blank');
                  }}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-200 relative group"
                >
                  {!canExportReport && (
                    <div className="absolute top-2 right-2 text-amber-500" title="Premium Feature">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  )}
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
      </main>

      {/* 4. MOBILE BOTTOM NAVIGATION BAR (Mobile only) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/60 backdrop-blur-lg border-t border-white/5 flex items-center justify-around py-1.5 pb-safe shadow-2xl">
        {tabs.slice(0, 4).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`mobile-nav-button ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.icon}
            <span className="text-[8px] mt-0.5">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
        {/* Exports mobile button */}
        <button
          onClick={() => setActiveTab('exports')}
          className={`mobile-nav-button ${activeTab === 'exports' ? 'active' : ''}`}
        >
          {tabs.find(t => t.key === 'exports')?.icon}
          <span className="text-[8px] mt-0.5">Export</span>
        </button>
      </nav>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}


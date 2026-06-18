'use client';

import React, { useState, useEffect } from 'react';
import FileUpload from '@/components/FileUpload';
import LoadingStages, { StageItem } from '@/components/LoadingStages';
import Dashboard from '@/components/Dashboard';
import { runComprehensiveAnalysis, ComprehensiveAnalysisResult, getAIRecommendations } from '@/lib/api';

type AppState = 'idle' | 'scanning' | 'success' | 'error';

export default function Home() {
  const [state, setState] = useState<AppState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<ComprehensiveAnalysisResult | null>(null);

  // Load saved analysis result on mount
  useEffect(() => {
    const saved = localStorage.getItem('ats_analysis_result');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnalysisResult(parsed);
        setState('success');
      } catch (e) {
        console.error('Failed to parse saved analysis result', e);
      }
    }
  }, []);
  
  const [stages, setStages] = useState<StageItem[]>([
    { id: 1, label: 'Uploading Resume & Job Description', status: 'pending' },
    { id: 2, label: 'Segmenting Resume Sections', status: 'pending' },
    { id: 3, label: 'Extracting Key Job Description Requirements', status: 'pending' },
    { id: 4, label: 'Performing Semantic Match & Keyword Coverage', status: 'pending' },
    { id: 5, label: 'Analyzing Layout & Document Formatting', status: 'pending' },
  ]);

  const updateStageStatus = (id: number, status: StageItem['status']) => {
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleScanStart = () => {
    setState('scanning');
    setErrorMessage('');
    setStages([
      { id: 1, label: 'Uploading Resume & Job Description', status: 'active' },
      { id: 2, label: 'Segmenting Resume Sections', status: 'pending' },
      { id: 3, label: 'Extracting Key Job Description Requirements', status: 'pending' },
      { id: 4, label: 'Performing Semantic Match & Keyword Coverage', status: 'pending' },
      { id: 5, label: 'Analyzing Layout & Document Formatting', status: 'pending' },
    ]);
  };

  const handleScanComplete = async (resumeText: string, resumeDetails: any, jdText: string) => {
    try {
      // Stage 1 is complete
      updateStageStatus(1, 'done');
      updateStageStatus(2, 'active');
      await delay(800);

      // Stage 2 is complete
      updateStageStatus(2, 'done');
      updateStageStatus(3, 'active');
      await delay(900);

      // Start the actual comparative backend calls
      updateStageStatus(3, 'done');
      updateStageStatus(4, 'active');
      
      const apiPromise = runComprehensiveAnalysis(resumeDetails, jdText);
      
      // Let the semantic/keyword check run, then transition to stage 5
      await delay(1200);
      updateStageStatus(4, 'done');
      updateStageStatus(5, 'active');

      const result = await apiPromise;

      // Finish formatting check (Stage 5)
      await delay(600);
      updateStageStatus(5, 'done');
      await delay(400);

      const finalResult = {
        ...result,
        jdText: jdText,
      };
      setAnalysisResult(finalResult);
      localStorage.setItem('ats_analysis_result', JSON.stringify(finalResult));
      setState('success');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Analysis calculations failed.');
      setState('error');
      // Mark active stages as error
      setStages((prev) =>
        prev.map((s) => (s.status === 'active' ? { ...s, status: 'error' } : s))
      );
    }
  };

  const handleScanError = (err: string) => {
    setErrorMessage(err);
    setState('error');
  };

  const handleReset = () => {
    setState('idle');
    setAnalysisResult(null);
    setErrorMessage('');
    localStorage.removeItem('ats_analysis_result');
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full gap-8">
      {/* Navbar / Header */}
      <header className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">
            ATS
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-tight">
              AI Resume Scanner
            </h1>
            <p className="text-[10px] text-gray-500">
              ATS scoring & optimization engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-400 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">
            Version 1.0.0
          </span>
        </div>
      </header>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Control Panel / Input Form */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-panel p-6">
            <h2 className="text-md font-bold text-gray-100 uppercase tracking-wider mb-2">
              Scanner Dashboard
            </h2>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Upload your technical resume and target job description. The engine will match keywords, run semantic checks, inspect layout compatibility, and provide a normalized ATS score.
            </p>
            <FileUpload
              onScanStart={handleScanStart}
              onScanComplete={handleScanComplete}
              onScanError={handleScanError}
            />
          </div>

          <div className="glass-panel p-6 bg-gradient-to-r from-sky-500/5 to-violet-500/5 border border-sky-500/10">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">How it works</h4>
            <ul className="text-[11px] text-gray-400 flex flex-col gap-2 list-disc pl-4 leading-relaxed">
              <li>Resumes are parsed and segmented into standard section blocks.</li>
              <li>Top keywords are extracted from the Job Description using a TF-IDF algorithm.</li>
              <li>Semantic matching maps conceptual fit using sentence-level transformer embeddings.</li>
              <li>Formatting checking identifies tables, long paragraphs, list icons, and ordering errors.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Dynamic Analysis Panels */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {state === 'idle' && (
            <div className="glass-panel p-12 flex flex-col items-center justify-center text-center gap-6 min-h-[450px]">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-violet-500/10 blur rounded-2xl" />
                <svg className="w-8 h-8 text-sky-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex flex-col gap-2 max-w-sm">
                <h3 className="text-lg font-bold text-white">Awaiting Analysis</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Ready to calculate your ATS match. Select a file on the left and enter a Job Description requirements text to begin.
                </p>
              </div>
            </div>
          )}

          {state === 'scanning' && (
            <LoadingStages stages={stages} />
          )}

          {state === 'success' && analysisResult && (
            <Dashboard result={analysisResult} onReset={handleReset} />
          )}

          {state === 'error' && (
            <div className="glass-panel p-10 flex flex-col items-center justify-center text-center gap-5 border-l-4 border-l-rose-500 min-h-[400px]">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex flex-col gap-2 max-w-md">
                <h3 className="text-md font-bold text-rose-400">Analysis calculation error</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{errorMessage}</p>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-lg transition-all"
              >
                Go Back & Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

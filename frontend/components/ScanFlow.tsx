import React, { useState } from 'react';
import FileUpload from './FileUpload';
import LoadingStages from './LoadingStages';
import { useRouter } from 'next/navigation';

export interface StageItem {
  id: number;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

type AppState = 'idle' | 'scanning' | 'error';

interface ScanFlowProps {
  onScanCompleteAction?: (result: any) => void;
}

export default function ScanFlow({ onScanCompleteAction }: ScanFlowProps) {
  const router = useRouter();
  const [state, setState] = useState<AppState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
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

  const handleScanStart = async () => {
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
      updateStageStatus(1, 'done');
      updateStageStatus(2, 'active');
      await delay(150); 

      updateStageStatus(2, 'done');
      updateStageStatus(3, 'active');
      await delay(150);

      const { runComprehensiveAnalysis } = await import('@/lib/api');

      updateStageStatus(3, 'done');
      updateStageStatus(4, 'active');
      
      const apiPromise = runComprehensiveAnalysis(resumeDetails, jdText);

      await delay(250);
      updateStageStatus(4, 'done');
      updateStageStatus(5, 'active');

      const result = await apiPromise;

      await delay(100);
      updateStageStatus(5, 'done');
      await delay(100);

      const finalResult = {
        ...result,
        jdText: jdText,
      };

      if (onScanCompleteAction) {
        onScanCompleteAction(finalResult);
      } else {
        localStorage.setItem('ats_analysis_result', JSON.stringify(finalResult));
        router.push('/dashboard?tab=overview&scan=' + finalResult.resumeDetails.id);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Analysis calculations failed.');
      setState('error');
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
    setErrorMessage('');
  };

  return (
    <div className="w-full flex-1">
      {state === 'idle' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
          <div className="lg:col-span-3 glass-panel p-8 relative flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight mb-2">
                Resume & Job Description Analysis
              </h2>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                Upload your resume file and paste or upload the target job description requirements. Our engine will calculate key matching scores instantly.
              </p>
            </div>
            <FileUpload
              onScanStart={handleScanStart}
              onScanComplete={handleScanComplete}
              onScanError={handleScanError}
            />
          </div>
          
          <div className="lg:col-span-2 glass-panel p-8 bg-gradient-to-br from-[#121826]/75 to-[#0b0e17]/75 border border-white/5 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How it works
              </h3>
              
              <div className="flex flex-col gap-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-xs font-bold text-sky-400 shrink-0">1</div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-200">Segment Sections</h4>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Resumes are parsed and segmented into standard sections (experience, skills, projects, and education).</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400 shrink-0">2</div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-200">TF-IDF Keyword Extraction</h4>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Top technical and soft keywords are programmatically extracted from the Job Description requirements.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">3</div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-200">Semantic Conceptual Fit</h4>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Sentence-level transformer embeddings map how well your experience aligns conceptually with the JD.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">4</div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-200">Format Compliance Checks</h4>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Scans for parsing barriers like multi-column tables, complex margins, non-standard bullet characters, and font sizes.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
              <span>ATS Match Engine v1.0.0</span>
              <span className="flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online & Ready
              </span>
            </div>
          </div>
        </div>
      )}

      {state === 'scanning' && (
        <div className="max-w-3xl mx-auto w-full py-12">
          <LoadingStages stages={stages} />
        </div>
      )}

      {state === 'error' && (
        <div className="max-w-xl mx-auto w-full py-12">
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
              className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-lg transition-all cursor-pointer active:scale-95"
            >
              Go Back & Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

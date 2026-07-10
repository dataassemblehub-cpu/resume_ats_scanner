'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Dashboard, { TabType } from '@/components/Dashboard';
import { getHistoryDetail, runComprehensiveAnalysis, ComprehensiveAnalysisResult } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface DashboardPageProps {
  params: Promise<{
    id: string;
  }>;
}

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const [result, setResult] = useState<ComprehensiveAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevScore, setPrevScore] = useState<any>(null);

  // Tab parameter validation and mapping
  const getValidatedTab = (tabParam: string | null): TabType => {
    if (tabParam === 'keywords') return 'keywords';
    if (tabParam === 'formatting') return 'formatting';
    if (tabParam === 'suggestions') return 'ai-suggestions';
    if (tabParam === 'exports') return 'exports';
    if (tabParam === 'history') return 'history';
    if (tabParam === 'new-scan') return 'new-scan';
    return 'overview';
  };

  const activeTab = getValidatedTab(searchParams.get('tab'));
  const scanId = searchParams.get('scan');

  const handleSetActiveTab = (tab: TabType) => {
    let tabParam = 'overview';
    if (tab === 'keywords') tabParam = 'keywords';
    if (tab === 'formatting') tabParam = 'formatting';
    if (tab === 'ai-suggestions') tabParam = 'suggestions';
    if (tab === 'exports') tabParam = 'exports';
    if (tab === 'history') tabParam = 'history';
    if (tab === 'new-scan') tabParam = 'new-scan';
    
    const currentScan = searchParams.get('scan');
    const scanQuery = currentScan ? `&scan=${currentScan}` : '';
    const historicalQuery = searchParams.get('historical') === 'true' ? '&historical=true' : '';
    router.push(`/dashboard?tab=${tabParam}${scanQuery}${historicalQuery}`);
  };

  useEffect(() => {
    if (authLoading) return;

    async function loadScanData() {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Read from client-side cache
        const saved = localStorage.getItem('ats_analysis_result');
        let parsed = null;
        if (saved) {
          try {
            parsed = JSON.parse(saved);
          } catch (e) {
            console.error("Failed to parse local scan cache", e);
          }
        }
        
        // 2. If URL has scan ID, verify if it matches cache. If not, fetch from backend.
        if (scanId) {
          if (parsed && parsed.resumeDetails?.id === scanId) {
            setResult(parsed);
            setLoading(false);
            return;
          }

          // Fetch from backend
          const { getHistoryDetail, runComprehensiveAnalysis } = await import('@/lib/api');
          try {
            const detail = await getHistoryDetail(scanId);
            const analysis = await runComprehensiveAnalysis(
              detail.resumeDetails,
              detail.jdText || detail.jd_text || ''
            );

            let recs = detail.recommendations || undefined;
            if (recs && !recs.status) {
              recs.status = 'success';
            }

            const finalResult: ComprehensiveAnalysisResult = {
              ...analysis,
              jdText: detail.jdText || detail.jd_text,
              recommendations: recs
            };

            setResult(finalResult);
            localStorage.setItem('ats_analysis_result', JSON.stringify(finalResult));
            setLoading(false);
            return;
          } catch (fetchErr: any) {
            console.error("Failed to fetch historical scan:", fetchErr);
            setError(fetchErr.message || "Failed to load the requested scan.");
            setLoading(false);
            return;
          }
        }

        // 3. If no scan ID in URL, but we have a valid cache, use it
        if (parsed && parsed.resumeDetails) {
          setResult(parsed);
          window.history.replaceState(null, '', `/dashboard?tab=${activeTab}&scan=${parsed.resumeDetails.id}`);
          setLoading(false);
          return;
        }
        
        // 4. No scan active. If tab is not 'new-scan' or 'history', redirect to 'new-scan' (if logged in)
        if (activeTab !== 'new-scan' && activeTab !== 'history') {
          router.push(user ? '/dashboard?tab=new-scan' : '/');
        } else {
          setResult(null);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load scan results.");
      } finally {
        setLoading(false);
      }
    }

    loadScanData();
  }, [authLoading, router, scanId]);

  const handleReset = () => {
    router.push('/dashboard?tab=new-scan');
  };

  const handleRecalculate = async (newResumeText: string) => {
    // Navigate back to upload landing page to run recalculation from scratch
    router.push('/');
  };

  const handleRegenerateRecommendations = async (newResumeText: string) => {
    // Recommendations regeneration is handled internally in suggestions tab,
    // but if needed we can re-fetch results here.
    if (!result) return;
    const { getHistoryDetail } = await import('@/lib/api');
    const scan = await getHistoryDetail(result.resumeDetails.id);
    setResult({
      ...result,
      recommendations: scan.recommendations || undefined
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen text-gray-400 bg-page">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-wider uppercase">Loading scan report...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen p-6 bg-page">
        <div className="glass-panel max-w-md p-8 flex flex-col items-center text-center gap-5 border-l-4 border-l-rose-500">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-md font-bold text-rose-400">Failed to load report</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-surface border-border hover:bg-card text-muted text-xs font-semibold rounded-lg transition-all cursor-pointer active:scale-95"
          >
            Go to Landing Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen relative z-10 bg-page">
      {result ? (
        <Dashboard
          result={result}
          onReset={handleReset}
          onRecalculate={handleRecalculate}
          activeTab={activeTab}
          setActiveTab={handleSetActiveTab}
          prevScore={prevScore}
          onRegenerateSuggestions={handleRegenerateRecommendations}
          onLoadScan={(r, isHistorical) => {
            setResult(r);
            if (isHistorical) {
              router.push(`/dashboard?tab=overview&scan=${r.resumeDetails?.id}&historical=true`);
            } else {
              router.push(`/dashboard?tab=overview&scan=${r.resumeDetails?.id}&restored=true`);
            }
          }}
        />
      ) : (
        activeTab === 'new-scan' && (
          <Dashboard
            result={null as any}
            onReset={handleReset}
            onRecalculate={handleRecalculate}
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            prevScore={prevScore}
            onRegenerateSuggestions={handleRegenerateRecommendations}
            onLoadScan={(r, isHistorical) => {
              setResult(r);
              if (isHistorical) {
                router.push(`/dashboard?tab=overview&scan=${r.resumeDetails?.id}&historical=true`);
              } else {
                router.push(`/dashboard?tab=overview&scan=${r.resumeDetails?.id}&restored=true`);
              }
            }}
          />
        )
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <React.Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen text-gray-400 bg-page">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    }>
      <DashboardPageContent />
    </React.Suspense>
  );
}

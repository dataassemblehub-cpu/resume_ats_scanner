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

export default function DashboardPage({ params }: DashboardPageProps) {
  const { id } = React.use(params);
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
    return 'overview';
  };

  const activeTab = getValidatedTab(searchParams.get('tab'));

  const handleSetActiveTab = (tab: TabType) => {
    let tabParam = 'overview';
    if (tab === 'keywords') tabParam = 'keywords';
    if (tab === 'formatting') tabParam = 'formatting';
    if (tab === 'ai-suggestions') tabParam = 'suggestions';
    
    router.push(`/dashboard/${id}?tab=${tabParam}`);
  };

  useEffect(() => {
    if (authLoading) return;
    
    // If user is not authenticated, redirect them to sign-in / landing page
    if (!user) {
      router.push('/');
      return;
    }

    async function loadScanData() {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Fetch scan base details
        const scan = await getHistoryDetail(id);
        if (!scan || !scan.resumeDetails) {
          setError("Scan record not found.");
          setLoading(false);
          return;
        }

        // 2. Perform on-the-fly comparative calculations if jdText exists
        if (scan.jdText) {
          const analysis = await runComprehensiveAnalysis(
            {
              id: scan.resumeDetails.id,
              name: scan.resumeDetails.name,
              email: scan.resumeDetails.email,
              phone: scan.resumeDetails.phone,
              parsed_text: scan.resumeDetails.parsed_text
            },
            scan.jdText
          );

          const finalResult: ComprehensiveAnalysisResult = {
            ...analysis,
            jdText: scan.jdText,
            recommendations: scan.recommendations || undefined
          };

          setResult(finalResult);
        } else {
          setError("Job description text is missing for this scan.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load scan results.");
      } finally {
        setLoading(false);
      }
    }

    loadScanData();
  }, [id, user, authLoading, router]);

  const handleReset = () => {
    router.push('/');
  };

  const handleRecalculate = async (newResumeText: string) => {
    // Navigate back to upload landing page to run recalculation from scratch
    router.push('/');
  };

  const handleRegenerateRecommendations = async (newResumeText: string) => {
    // Recommendations regeneration is handled internally in suggestions tab,
    // but if needed we can re-fetch results here.
    if (!result) return;
    const scan = await getHistoryDetail(id);
    setResult({
      ...result,
      recommendations: scan.recommendations || undefined
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen text-gray-400 bg-[#0d111d]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-wider uppercase">Loading scan report...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen p-6 bg-[#0d111d]">
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
            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-lg transition-all cursor-pointer active:scale-95"
          >
            Go to Landing Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen relative z-10 bg-[#0d111d]">
      {result && (
        <Dashboard
          result={result}
          onReset={handleReset}
          onRecalculate={handleRecalculate}
          activeTab={activeTab}
          setActiveTab={handleSetActiveTab}
          prevScore={prevScore}
          onRegenerateSuggestions={handleRegenerateRecommendations}
          onLoadScan={(r) => router.push(`/dashboard/${r.resumeDetails.id}`)}
        />
      )}
    </div>
  );
}

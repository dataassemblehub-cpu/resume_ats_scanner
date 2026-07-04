'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  getUserHistory, 
  getHistoryDetail, 
  deleteHistoryItem, 
  runComprehensiveAnalysis, 
  ComprehensiveAnalysisResult 
} from '@/lib/api';
import { toast } from 'react-hot-toast';

interface HistorySectionProps {
  onLoadScan: (result: ComprehensiveAnalysisResult) => void;
  onSetTab: (tab: 'overview') => void;
}

export default function HistorySection({ onLoadScan, onSetTab }: HistorySectionProps) {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUserHistory(pageNum, limit);
      if (res.items.length === 0 && pageNum > 1) {
        const fallbackRes = await getUserHistory(1, limit);
        setItems(fallbackRes.items);
        setTotal(fallbackRes.total);
        setPage(fallbackRes.page);
        setPages(fallbackRes.pages);
      } else {
        setItems(res.items);
        setTotal(res.total);
        setPage(res.page);
        setPages(res.pages);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to retrieve scan history.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handleLoadItem = async (itemId: string) => {
    setLoadingItemId(itemId);
    setError(null);
    try {
      // 1. Fetch details of historical scan (parsed text, jd text, cached recommendations)
      const detail = await getHistoryDetail(itemId);
      
      // 2. Perform fast local score analysis
      const analysis = await runComprehensiveAnalysis(
        detail.resumeDetails,
        detail.jd_text || ''
      );

      // 3. Re-inject stored AI recommendations
      const finalResult: ComprehensiveAnalysisResult = {
        ...analysis,
        jdText: detail.jdText || detail.jd_text,
        recommendations: detail.recommendations || undefined
      };

      // 4. Update parent state
      onLoadScan(finalResult);
      localStorage.setItem('ats_analysis_result', JSON.stringify(finalResult));
      onSetTab('overview');
      toast.success('Scan report successfully loaded!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to reconstruct report calculations.');
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this scan from your history?')) return;
    try {
      await deleteHistoryItem(itemId);
      toast.success('Scan deleted successfully.');
      
      // Re-fetch current page (or previous page if current page becomes empty)
      const nextPage = items.length === 1 && page > 1 ? page - 1 : page;
      fetchHistory(nextPage);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to delete historical scan.');
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div className="glass-panel p-6 flex flex-col gap-6 relative overflow-hidden min-h-[400px]">
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-violet-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
            Recent Analyses
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Access past ATS scores, compatibility reviews, and AI-optimized bullet recommendations.
          </p>
        </div>
        <button
          onClick={async () => {
            await fetchHistory(page);
            toast.success('Scan history successfully refreshed!');
          }}
          disabled={loading}
          className={`p-2 rounded-lg bg-white/5 border border-white/5 transition-all hover:scale-105 active:scale-95 ${
            loading ? 'text-violet-400 opacity-55 cursor-not-allowed' : 'text-gray-400 hover:text-white'
          }`}
          title="Refresh History"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
          {error}
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
          <span className="text-xs text-gray-400">Loading scan history...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16 gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-300">No Scan History Found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Your uploaded resumes and matches will appear here once you perform a scan while authenticated.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between gap-6">
          {/* Table List */}
          <div className="overflow-x-auto border border-white/5 rounded-xl bg-black/10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Resume Document</th>
                  <th className="px-4 py-3">Candidate Details</th>
                  <th className="px-4 py-3">Uploaded Date</th>
                  <th className="px-4 py-3 text-center">AI Suggestions</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                {items.map((item) => {
                  const isItemLoading = loadingItemId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="px-4 py-3.5 font-semibold text-gray-200">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="truncate max-w-[180px]" title={item.file_name}>
                            {item.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-200">{item.name || 'Anonymous'}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{item.email || 'No email parsed'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 font-mono text-[11px]">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {item.has_ai_recommendations ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 uppercase tracking-wider">
                            ✨ Cached
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase tracking-wider">
                            Not Run
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleLoadItem(item.id)}
                            disabled={isItemLoading}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1 ${
                              isItemLoading
                                ? 'bg-violet-500/20 border-violet-500/30 text-violet-300'
                                : 'bg-violet-500/5 hover:bg-violet-500/15 border-violet-500/20 hover:border-violet-400/40 text-violet-300 hover:text-white cursor-pointer active:scale-95'
                            }`}
                          >
                            {isItemLoading ? (
                              <>
                                <div className="w-3 h-3 border border-violet-400/20 border-t-violet-400 rounded-full animate-spin" />
                                <span>Restoring...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>Load Report</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={isItemLoading}
                            className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 text-gray-400 hover:text-rose-400 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
                            title="Delete scan"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer - Removed since history is pruned to 10 max items */}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUserHistory, deleteHistoryItem } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { toast } from 'react-hot-toast';

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
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
      setError(err.message || 'Failed to retrieve scans history.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (authLoading) return;
    
    // Redirect to landing page if not authenticated
    if (!user) {
      router.push('/');
      return;
    }
    
    fetchHistory(1);
  }, [fetchHistory, user, authLoading, router]);

  const handleDeleteItem = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation(); // Prevent routing to dashboard
    if (!confirm('Are you sure you want to delete this scan from your history?')) return;
    
    try {
      await deleteHistoryItem(itemId);
      toast.success('Scan deleted successfully.');
      const nextPage = items.length === 1 && page > 1 ? page - 1 : page;
      fetchHistory(nextPage);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to delete historical scan.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen text-gray-400 bg-[#0d111d]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-wider uppercase">Loading scan history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen relative z-10 bg-[#0d111d] p-4 md:p-8">
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 relative z-10">
        
        {/* Header navigation bar */}
        <header className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-tight">Your Scan History</h1>
              <p className="text-[10px] text-gray-500">Access and manage your past resume matching scans ({total} total)</p>
            </div>
          </div>
          <button
            onClick={() => fetchHistory(page)}
            className="px-3.5 py-1.5 border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 active:scale-95"
          >
            Refresh List
          </button>
        </header>

        {/* Scan Table List */}
        {error ? (
          <div className="glass-panel p-8 text-center text-rose-400 text-xs font-semibold border-l-4 border-l-rose-500">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="glass-panel p-16 flex flex-col items-center justify-center text-center gap-4 border-l-4 border-l-amber-500">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">No scans found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
                You haven't scanned any resumes yet. Go back to the dashboard and upload your first resume!
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="mt-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-md shadow-sky-500/10"
            >
              Upload & Scan Now
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="glass-panel overflow-hidden border border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">File Name</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Candidate Name</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Created At</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">AI Recommendations</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => router.push(`/dashboard/${item.id}`)}
                        className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 text-xs font-bold text-sky-400 truncate max-w-[180px]" title={item.file_name}>
                          {item.file_name}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-300 font-semibold truncate max-w-[120px]">
                          {item.name || <span className="text-gray-600 italic">Not extracted</span>}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-400 truncate max-w-[150px]">
                          {item.email || <span className="text-gray-600 italic">Not extracted</span>}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-400">
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.has_ai_recommendations ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 rounded-full">
                              <span className="w-1 h-1 rounded-full bg-emerald-400" />
                              Generated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                              None
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => handleDeleteItem(e, item.id)}
                            className="p-1.5 rounded-lg border border-white/5 hover:border-rose-500/20 bg-white/5 hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 transition-all active:scale-95"
                            title="Delete scan"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {pages > 1 && (
              <div className="flex items-center justify-between border border-white/5 bg-white/[0.01] rounded-xl px-4 py-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  Page {page} of {pages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchHistory(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1.5 border border-white/5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-gray-300 disabled:text-gray-500 text-xs font-bold rounded-lg transition-all active:scale-95"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchHistory(page + 1)}
                    disabled={page === pages}
                    className="px-3 py-1.5 border border-white/5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-gray-300 disabled:text-gray-500 text-xs font-bold rounded-lg transition-all active:scale-95"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

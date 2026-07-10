import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How Our ATS Score & Keyword Matching Works',
  description: 'A transparent deep-dive into our ATS scoring algorithm, resume parsing pipelines, and AI rewrite generation.',
  openGraph: {
    title: 'How Our ATS Score & Keyword Matching Works',
    description: 'A transparent deep-dive into our ATS scoring algorithm, resume parsing pipelines, and AI rewrite generation.',
    type: 'article',
  }
};

export default function DocsPage() {
  return (
    <div className="flex-1 flex flex-col w-full min-h-screen relative z-10 bg-page text-primary overflow-x-hidden">
      
      {/* Navbar */}
      <header className="flex items-center justify-between border-b border-border p-4 md:px-8 max-w-7xl mx-auto w-full relative z-20">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-sm">
            ATS
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-primary tracking-tight">
              AI Resume Scanner
            </h1>
            <p className="text-[10px] text-muted hidden sm:block">
              Back to Home
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/scanner"
            className="btn-primary text-xs font-bold px-5 py-2 rounded-full transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
          >
            Launch Scanner
          </Link>
        </div>
      </header>

      {/* Docs Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 mt-8 mb-20">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-primary">
            Methodology & Calculations
          </h1>
          <p className="text-lg text-muted leading-relaxed">
            We believe in total transparency. Our engine is designed to emulate the exact pipelines used by enterprise Applicant Tracking Systems (Workday, Greenhouse, Lever). Here is exactly how we score and optimize your resume.
          </p>
        </div>

        <div className="space-y-12">
          {/* Section 1 */}
          <section className="glass-panel p-8 glow-card-sky">
            <h2 className="text-2xl font-bold mb-4 text-primary flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center text-sm font-black">1</span>
              Resume Parsing (PyMuPDF & python-docx)
            </h2>
            <p className="text-sm text-muted leading-relaxed mb-4">
              When you upload a file, we don't just extract raw text. We use industry-standard libraries (PyMuPDF for PDFs and python-docx for Word documents) to extract text while maintaining spatial layout and formatting blocks. If the ATS can't read a multi-column layout, neither will we—giving you an accurate representation of your parsing success.
            </p>
          </section>

          {/* Section 2 */}
          <section className="glass-panel p-8 glow-card-violet">
            <h2 className="text-2xl font-bold mb-4 text-primary flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center text-sm font-black">2</span>
              Keyword Extraction (TF-IDF + Normalization)
            </h2>
            <p className="text-sm text-muted leading-relaxed mb-4">
              We process the Job Description using NLP (Natural Language Processing) to remove stop words and normalize text (lemmatization). We then apply a <strong>TF-IDF (Term Frequency - Inverse Document Frequency)</strong> algorithm to identify the most statistically significant keywords in the job posting, separating them into Hard Skills, Soft Skills, and Tools.
            </p>
          </section>

          {/* Section 3 */}
          <section className="glass-panel p-8 glow-card-teal">
            <h2 className="text-2xl font-bold mb-4 text-primary flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center text-sm font-black">3</span>
              Semantic Similarity & ATS Score Formula
            </h2>
            <p className="text-sm text-muted leading-relaxed mb-4">
              We don't just look for exact matches. We use embeddings and <strong>Cosine Similarity</strong> to detect when you've used variations of a skill.
            </p>
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-border">
              <h4 className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">Scoring Weights</h4>
              <ul className="text-sm text-muted space-y-2 list-disc list-inside">
                <li><strong>Keyword Match (60%):</strong> Presence of high-value TF-IDF terms.</li>
                <li><strong>Formatting/Readability (20%):</strong> Clean extraction without garbled characters.</li>
                <li><strong>Experience Depth (20%):</strong> Action verbs and quantifiable metrics detected in bullet points.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="glass-panel p-8 glow-card-amber">
            <h2 className="text-2xl font-bold mb-4 text-primary flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-sm font-black">4</span>
              AI Rewrite Generation (LLM)
            </h2>
            <p className="text-sm text-muted leading-relaxed mb-4">
              When we suggest a rewrite for a bullet point, we feed the underlying Large Language Model a strict prompt containing:
              <br/>1. Your original bullet point context.
              <br/>2. The specific missing keyword.
              <br/>3. A strict constraint to <strong>never fabricate experience</strong> or metrics.
            </p>
            <p className="text-sm text-muted leading-relaxed">
              This guarantees that the suggestions are highly ethical, simply reframing your existing experience using the vocabulary the ATS is programmed to catch.
            </p>
          </section>

          {/* Section 5 */}
          <section className="glass-panel p-8 border-l-4 border-l-rose-500/80">
            <h2 className="text-2xl font-bold mb-4 text-primary flex items-center gap-3">
              <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Privacy & Data Handling
            </h2>
            <p className="text-sm text-muted leading-relaxed mb-4">
              Your resume data is highly sensitive. We do not use your resume to train our models. If you are an anonymous user, your resume is processed entirely in-memory and discarded immediately after the HTTP request finishes. If you create an account to save history, your data is securely stored in Supabase with Row Level Security (RLS) ensuring that only you can access your documents.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

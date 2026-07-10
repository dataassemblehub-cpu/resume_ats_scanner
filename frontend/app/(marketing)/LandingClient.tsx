'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';

export default function LandingClient() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="flex flex-col items-center pt-20 pb-16 px-4">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center max-w-3xl mb-20 relative"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-primary via-primary to-muted">
          Beat the ATS with AI.
        </h1>
        <p className="text-lg md:text-xl text-muted mb-10 max-w-2xl mx-auto leading-relaxed relative z-10">
          Upload your resume and the job description. Our advanced AI scanner reveals your ATS score, extracts missing keywords, and automatically rewrites your bullet points to match exactly what recruiters are searching for.
        </p>
        
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative z-10 inline-block"
        >
          <Link
            href="/scanner"
            className="btn-primary text-base font-bold px-10 py-4 rounded-xl shadow-lg flex items-center gap-2 group"
          >
            Try It Out For Free
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </motion.div>
      </motion.div>

      {/* Animated Feature Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"
      >
        <motion.div variants={itemVariants} className="glass-panel p-8 glow-card-sky flex flex-col gap-4 group hover:-translate-y-2 transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 mb-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-primary">Precise ATS Scoring</h3>
          <p className="text-sm text-muted leading-relaxed">
            Our engine uses TF-IDF and semantic similarity to accurately calculate how well your resume matches the job description, just like top-tier Applicant Tracking Systems.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel p-8 glow-card-violet flex flex-col gap-4 group hover:-translate-y-2 transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 mb-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-primary">Keyword Gap Analysis</h3>
          <p className="text-sm text-muted leading-relaxed">
            Instantly discover the exact hard skills, soft skills, and tools you are missing. We highlight the exact phrasing recruiters set up in their ATS filters.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel p-8 glow-card-teal flex flex-col gap-4 group hover:-translate-y-2 transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500 mb-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-primary">AI Bullet Rewrites</h3>
          <p className="text-sm text-muted leading-relaxed">
            We don't hallucinate experience. Our Gemini-powered AI takes your existing bullet points and rewrites them to seamlessly integrate the missing keywords.
          </p>
        </motion.div>
      </motion.div>

      {/* How it Works / Trust Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mt-24 max-w-4xl w-full text-center"
      >
        <h2 className="text-3xl font-bold mb-6 text-primary">How Does Our Engine Work?</h2>
        <p className="text-muted leading-relaxed mb-8">
          Unlike generic tools, we emulate the exact parsing pipelines (PyMuPDF, Docx) and ranking algorithms (Cosine Similarity, TF-IDF) used by Workday, Greenhouse, and Lever. We value total transparency.
        </p>
        <Link
          href="/docs"
          className="text-sky-500 hover:text-sky-400 font-bold flex items-center gap-2 justify-center transition-colors"
        >
          Read the Full Methodology
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </motion.div>
    </div>
  );
}

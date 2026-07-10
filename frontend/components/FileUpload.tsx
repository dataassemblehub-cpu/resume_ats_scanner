'use client';

import React, { useState, useRef } from 'react';
import { uploadResume } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface FileUploadProps {
  onScanStart: () => void;
  onScanComplete: (resumeText: string, resumeDetails: any, jdText: string) => void;
  onScanError: (error: string) => void;
}

export default function FileUpload({ onScanStart, onScanComplete, onScanError }: FileUploadProps) {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdMode, setJdMode] = useState<'text' | 'file'>('text');
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);

  const handleResumeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setResumeFile(file);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    const isDocx = file.name.endsWith('.docx');
    if (validTypes.includes(file.type) || isDocx) {
      return true;
    }
    toast.error('Please upload a PDF or DOCX file.');
    return false;
  };

  const handleScan = async () => {
    if (!resumeFile) {
      toast.error('Please upload a resume first.');
      return;
    }

    let finalJdText = '';
    setIsProcessing(true);
    onScanStart();

    try {
      // 1. Process Job Description Text
      if (jdMode === 'text') {
        if (!jdText.trim()) {
          throw new Error('Please enter a job description.');
        }
        finalJdText = jdText;
      } else {
        if (!jdFile) {
          throw new Error('Please upload a job description file.');
        }
        
        if (jdFile.type === 'text/plain' || jdFile.name.endsWith('.txt')) {
          finalJdText = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve((e.target?.result as string) || '');
            reader.onerror = () => reject(new Error('Failed to read text file.'));
            reader.readAsText(jdFile);
          });
        } else {
          // Re-use resume upload endpoint to extract text from PDF/DOCX job description
          const jdResult = await uploadResume(jdFile);
          finalJdText = jdResult.parsed_text;
        }
      }

      if (!finalJdText.trim()) {
        throw new Error('Parsed Job Description text is empty.');
      }

      // 2. Upload and Parse Resume
      const resumeResult = await uploadResume(resumeFile, finalJdText);

      if (resumeResult.parsed_text.trim() === finalJdText.trim()) {
        throw new Error('Resume and Job Description cannot be identical.');
      }

      // 3. Complete stage and trigger comparative analysis
      onScanComplete(resumeResult.parsed_text, resumeResult, finalJdText);
    } catch (err: any) {
      console.error(err);
      onScanError(err.message || 'An error occurred during scanning.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Resume Upload Box (Made larger and taller) */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-muted uppercase tracking-wider">
          Resume Upload (.pdf, .docx)
        </label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleResumeDrop}
          onClick={() => resumeInputRef.current?.click()}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-14 px-8 cursor-pointer transition-all duration-300 relative overflow-hidden group ${
            resumeFile 
              ? 'border-sky-500/50 bg-sky-500/5' 
              : 'border-border bg-gradient-to-b from-white/[0.04] to-white/[0.01] hover:border-sky-500/30'
          }`}
        >
          <input
            type="file"
            ref={resumeInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setResumeFile(e.target.files[0]);
              }
            }}
            accept=".pdf,.docx"
            className="hidden"
          />
          
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
            resumeFile ? 'bg-sky-500/10 text-sky-400 scale-110' : 'bg-surface text-muted group-hover:text-primary'
          }`}>
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.75"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          
          {resumeFile ? (
            <div className="text-center z-10">
              <p className="font-semibold text-sky-400 text-sm truncate max-w-xs">{resumeFile.name}</p>
              <p className="text-[10px] text-muted mt-1 font-mono">{(resumeFile.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="text-center z-10">
              <p className="text-sm font-semibold text-primary">Drag & drop your resume, or <span className="text-sky-400 group-hover:text-sky-300 transition-colors">browse</span></p>
              <p className="text-xs text-muted mt-1.5">Supports PDF & DOCX formats up to 10MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Job Description Input (Made larger and taller) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-muted uppercase tracking-wider">
            Job Description (JD)
          </label>
          <div className="flex rounded-xl bg-surface p-1 border border-border">
            <button
              type="button"
              onClick={() => setJdMode('text')}
              className={`text-xs px-3.5 py-1.5 rounded-lg transition-all font-semibold cursor-pointer ${
                jdMode === 'text' ? 'bg-sky-500/20 text-sky-400 shadow-sm' : 'text-muted hover:text-primary'
              }`}
            >
              Paste Text
            </button>
            <button
              type="button"
              onClick={() => setJdMode('file')}
              className={`text-xs px-3.5 py-1.5 rounded-lg transition-all font-semibold cursor-pointer ${
                jdMode === 'file' ? 'bg-sky-500/20 text-sky-400 shadow-sm' : 'text-muted hover:text-primary'
              }`}
            >
              Upload File
            </button>
          </div>
        </div>

        {jdMode === 'text' ? (
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste the target job description requirements here to calculate keywords and semantic relevance scores..."
            className="w-full h-48 bg-surface border border-border rounded-2xl p-4 text-sm text-primary placeholder-gray-500 focus:outline-none focus:border-sky-500/30 focus:ring-1 focus:ring-sky-500/20 resize-none font-sans transition-all"
          />
        ) : (
          <div
            onClick={() => jdInputRef.current?.click()}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-10 px-8 cursor-pointer transition-all duration-300 relative overflow-hidden group ${
              jdFile 
                ? 'border-violet-500/50 bg-violet-500/5' 
                : 'border-border bg-gradient-to-b from-white/[0.04] to-white/[0.01] hover:border-violet-500/30'
            }`}
          >
            <input
              type="file"
              ref={jdInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setJdFile(e.target.files[0]);
                }
              }}
              accept=".pdf,.docx,.txt"
              className="hidden"
            />
            
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ${
              jdFile ? 'bg-violet-500/10 text-violet-400 scale-110' : 'bg-surface text-muted group-hover:text-primary'
            }`}>
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="1.75"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            
            {jdFile ? (
              <div className="text-center z-10">
                <p className="font-semibold text-violet-400 text-sm truncate max-w-xs">{jdFile.name}</p>
                <p className="text-[10px] text-muted mt-1 font-mono">{(jdFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="text-center z-10">
                <p className="text-sm font-semibold text-primary">Upload JD file (.txt, .pdf, .docx)</p>
                <p className="text-xs text-muted mt-1.5">Supports text/plain or office documents</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Button (Polished visual states) */}
      <button
        onClick={handleScan}
        disabled={isProcessing || !resumeFile || (jdMode === 'text' ? !jdText.trim() : !jdFile)}
        className="w-full mt-2 py-4 bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-400 hover:to-violet-400 disabled:from-gray-800 disabled:to-gray-800 disabled:text-muted text-primary text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-95 duration-150"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Analyzing Resume...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <span>Analyze Resume & Match</span>
          </>
        )}
      </button>
    </div>
  );
}

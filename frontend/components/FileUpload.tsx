'use client';

import React, { useState, useRef } from 'react';
import { uploadResume } from '@/lib/api';

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
    alert('Please upload a PDF or DOCX file.');
    return false;
  };

  const handleScan = async () => {
    if (!resumeFile) {
      alert('Please upload a resume first.');
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
      const resumeResult = await uploadResume(resumeFile);

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
      {/* Resume Upload Box */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-300">Resume Upload (.pdf, .docx)</label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleResumeDrop}
          onClick={() => resumeInputRef.current?.click()}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-200 ${
            resumeFile 
              ? 'border-teal-500/50 bg-teal-500/5' 
              : 'border-white/10 bg-white/5 hover:border-white/20'
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
          <svg
            className={`w-12 h-12 mb-3 ${resumeFile ? 'text-teal-400' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          {resumeFile ? (
            <div className="text-center">
              <p className="font-semibold text-teal-400 text-sm truncate max-w-xs">{resumeFile.name}</p>
              <p className="text-xs text-gray-400 mt-1">{(resumeFile.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-medium text-gray-300">Drag & drop your resume, or browse</p>
              <p className="text-xs text-gray-500 mt-1">Supports PDF & DOCX formats</p>
            </div>
          )}
        </div>
      </div>

      {/* Job Description Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-300 font-sans">Job Description (JD)</label>
          <div className="flex rounded-lg bg-white/5 p-1 border border-white/5">
            <button
              type="button"
              onClick={() => setJdMode('text')}
              className={`text-xs px-3 py-1 rounded-md transition-all ${
                jdMode === 'text' ? 'bg-sky-500/20 text-sky-400 font-medium' : 'text-gray-400'
              }`}
            >
              Paste Text
            </button>
            <button
              type="button"
              onClick={() => setJdMode('file')}
              className={`text-xs px-3 py-1 rounded-md transition-all ${
                jdMode === 'file' ? 'bg-sky-500/20 text-sky-400 font-medium' : 'text-gray-400'
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
            placeholder="Paste the target job description requirements here..."
            className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 resize-none font-sans"
          />
        ) : (
          <div
            onClick={() => jdInputRef.current?.click()}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-200 ${
              jdFile 
                ? 'border-sky-500/50 bg-sky-500/5' 
                : 'border-white/10 bg-white/5 hover:border-white/20'
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
            <svg
              className={`w-10 h-10 mb-2 ${jdFile ? 'text-sky-400' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {jdFile ? (
              <div className="text-center">
                <p className="font-semibold text-sky-400 text-sm truncate max-w-xs">{jdFile.name}</p>
                <p className="text-xs text-gray-400 mt-1">{(jdFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-medium text-gray-300">Upload JD file (.txt, .pdf, .docx)</p>
                <p className="text-xs text-gray-500 mt-1">Supports plain text or office documents</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={handleScan}
        disabled={isProcessing || !resumeFile || (jdMode === 'text' ? !jdText.trim() : !jdFile)}
        className="btn-primary flex items-center justify-center gap-2 mt-2 py-3.5"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing Scan...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            Scan Resume & Calculate Match
          </>
        )}
      </button>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { submitContactForm } from '@/lib/api';

export interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourcePage?: string;
}

export default function ContactModal({ isOpen, onClose, sourcePage = '/' }: ContactModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('General Question');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus and Escape key logic
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Auto-focus name field
      setTimeout(() => nameInputRef.current?.focus(), 100);
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'auto';
      };
    }
  }, [isOpen, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (name.length < 2 || name.length > 100) return setError("Name must be between 2 and 100 characters.");
    if (subject.length < 5 || subject.length > 150) return setError("Subject must be between 5 and 150 characters.");
    if (message.length < 20 || message.length > 3000) return setError("Message must be between 20 and 3000 characters.");
    if (!consent) return setError("You must agree to the privacy policy.");

    setLoading(true);
    try {
      await submitContactForm({
        name,
        email,
        category,
        subject,
        message,
        source_page: sourcePage
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-5 border-b border-border bg-page">
          <h2 className="text-lg font-bold text-primary">Contact Us</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface hover:bg-card border border-border text-muted hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {success ? (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Message Sent!</h3>
              <p className="text-sm text-muted">Thank you for reaching out. Our team will get back to you shortly.</p>
              <button 
                onClick={onClose}
                className="mt-6 btn-primary px-6 py-2 rounded-lg text-sm font-bold"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-secondary">Name</label>
                  <input 
                    ref={nameInputRef}
                    type="text" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-page border border-border rounded-lg px-3 py-2 text-sm text-primary focus:border-sky-500 outline-none transition-colors"
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-secondary">Email</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-page border border-border rounded-lg px-3 py-2 text-sm text-primary focus:border-sky-500 outline-none transition-colors"
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-secondary">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-page border border-border rounded-lg px-3 py-2 text-sm text-primary focus:border-sky-500 outline-none transition-colors appearance-none"
                >
                  <option value="General Question">General Question</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Business Inquiry">Business Inquiry</option>
                  <option value="Feedback">Feedback</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-secondary">Subject</label>
                <input 
                  type="text" 
                  required 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-page border border-border rounded-lg px-3 py-2 text-sm text-primary focus:border-sky-500 outline-none transition-colors"
                  placeholder="How does ATS scoring work?"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-secondary">Message</label>
                  <span className={`text-[10px] ${message.length > 3000 ? 'text-rose-500' : 'text-muted'}`}>
                    {message.length} / 3000
                  </span>
                </div>
                <textarea 
                  required 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full h-32 bg-page border border-border rounded-lg px-3 py-2 text-sm text-primary focus:border-sky-500 outline-none transition-colors resize-none"
                  placeholder="Please describe your inquiry in detail..."
                />
              </div>

              <div className="flex items-start gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="consent" 
                  required 
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 accent-sky-500"
                />
                <label htmlFor="consent" className="text-xs text-muted leading-relaxed cursor-pointer select-none">
                  I agree that my message and contact details will be securely stored so the team can respond to my inquiry.
                </label>
              </div>

              <button 
                type="submit" 
                disabled={loading || !consent}
                className={`w-full py-3 mt-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                  ${loading || !consent ? 'bg-surface text-muted cursor-not-allowed border border-border' : 'btn-primary'}
                `}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

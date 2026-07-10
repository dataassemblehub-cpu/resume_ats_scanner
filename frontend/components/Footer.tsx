'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ContactModal from './ContactModal';

export default function Footer() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <footer className="border-t border-border mt-20 p-8 text-center bg-surface relative z-10">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
        <h2 className="text-lg font-bold text-primary">Ready to beat the ATS?</h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <Link
            href="/scanner"
            className="btn-primary text-sm font-bold px-8 py-3 rounded-xl transition-all cursor-pointer hover:scale-105 shadow-md"
          >
            Scan Your Resume Now
          </Link>
          <button
            onClick={() => setIsContactOpen(true)}
            className="bg-transparent border border-border text-primary hover:bg-card hover:border-accent text-sm font-bold px-8 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            Contact Us
          </button>
        </div>
        <p className="text-xs text-muted max-w-md mx-auto leading-relaxed mt-4">
          No resume stored without your consent. AI suggestions generated on demand in memory.
          <br />
          © {new Date().getFullYear()} DataAssembleHub. All rights reserved.
        </p>
      </div>

      <ContactModal 
        isOpen={isContactOpen} 
        onClose={() => setIsContactOpen(false)} 
        sourcePage="/"
      />
    </footer>
  );
}

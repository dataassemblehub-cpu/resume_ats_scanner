import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scan Resume Against Job Description | ATS Scanner',
  description: 'Upload your resume and job description to get instant ATS scoring, keyword gap analysis, and AI-optimized bullet points.',
};

export default function ScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ResumeUploadResult {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  parsed_text: string;
}

export interface ScoreResult {
  skills: number;
  experience: number;
  projects: number;
  education: number;
  overall: number;
}

export interface KeywordFrequencyDetails {
  resume: number;
  jd: number;
}

export interface KeywordResult {
  matched: string[];
  missing: string[];
  coverage_percentage: number;
  keyword_frequency: Record<string, KeywordFrequencyDetails>;
}

export interface SemanticResult {
  similarity: number;
  semantic_score: number;
}

export interface FormattingResult {
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

export interface SectionResult {
  sections_detected: Record<string, boolean>;
  section_offsets: Record<string, [number, number]>;
  section_text: Record<string, string>;
}

export interface AIRecommendationsResult {
  status: 'success' | 'unavailable';
  message: string | null;
  resume_summary: string | null;
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  ats_improvements: string[];
  recruiter_improvements: string[];
  suggested_bullet_points: string[];
  resume_improvements: string[];
  ats_recommendations: string[];
}

export interface ComprehensiveAnalysisResult {
  resumeDetails: ResumeUploadResult;
  score: ScoreResult;
  keywords: KeywordResult;
  semantic: SemanticResult;
  formatting: FormattingResult;
  sections: SectionResult;
  recommendations?: AIRecommendationsResult;
  jdText?: string;
}

export interface Entitlements {
  can_generate_ai: boolean;
  can_export_report: boolean;
  can_copy_suggestions: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  subscription_plan: 'free' | 'premium';
  ai_generation_count: number;
  last_ai_generation_at: string | null;
  entitlements: Entitlements;
}

export interface HistoryItem {
  id: string;
  file_name: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  has_ai_recommendations: boolean;
}

export interface HistoryListResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Helpers for Auth Header injection
function getAuthHeaders(): Record<string, string> {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ats_auth_token');
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
  }
  return {};
}

/**
 * Uploads a resume file to the backend.
 */
export async function uploadResume(file: File, jdText?: string): Promise<ResumeUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  if (jdText) {
    formData.append('jdText', jdText);
    formData.append('jd_text', jdText);
  }

  const response = await fetch(`${API_BASE}/resume/upload`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders()
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to upload and parse resume.');
  }

  return response.json();
}

/**
 * Executes a single analysis API call.
 */
async function postJSON<T>(endpoint: string, payload: Record<string, any>): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed request to ${endpoint}`);
  }

  return response.json();
}

async function getJSON<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed request to ${endpoint}`);
  }

  return response.json();
}

async function deleteJSON<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed request to ${endpoint}`);
  }

  return response.json();
}

/**
 * Performs all comparative analysis tasks in parallel.
 */
export async function runComprehensiveAnalysis(
  resumeDetails: ResumeUploadResult,
  jdText: string
): Promise<ComprehensiveAnalysisResult> {
  const resumeText = resumeDetails.parsed_text;

  let score: ScoreResult;
  let keywords: KeywordResult;
  let semantic: SemanticResult;

  if (jdText && jdText.trim().length > 0) {
    [score, keywords, semantic] = await Promise.all([
      postJSON<ScoreResult>('/analyze/score', { resume_text: resumeText, jd_text: jdText, scan_id: resumeDetails.id }),
      postJSON<KeywordResult>('/analyze/keywords', { resume_text: resumeText, jd_text: jdText, scan_id: resumeDetails.id }),
      postJSON<SemanticResult>('/analyze/semantic', { resume_text: resumeText, jd_text: jdText, scan_id: resumeDetails.id }),
    ]);
  } else {
    // Provide empty/fallback objects if no JD is provided
    score = { overall: 0, skills: 0, experience: 0, projects: 0, education: 0 };
    keywords = {
      matched: [],
      missing: [],
      coverage_percentage: 0,
      keyword_frequency: {}
    };
    semantic = {
      similarity: 0,
      semantic_score: 0
    };
  }

  const [formatting, sections] = await Promise.all([
    postJSON<FormattingResult>('/analyze/formatting', { resume_text: resumeText, scan_id: resumeDetails.id }),
    postJSON<SectionResult>('/resume/sections', { text: resumeText, scan_id: resumeDetails.id }),
  ]);

  return {
    resumeDetails,
    score,
    keywords,
    semantic,
    formatting,
    sections,
  };
}

/**
 * Fetches AI recommendations from the backend.
 */
export async function getAIRecommendations(
  resumeText: string,
  jdText: string,
  atsResults: Record<string, any>,
  resumeId?: string
): Promise<AIRecommendationsResult> {
  try {
    return await postJSON<AIRecommendationsResult>('/analyze/recommendation', {
      resume_text: resumeText,
      jd_text: jdText,
      ats_results: atsResults,
      resume_id: resumeId,
    });
  } catch (error: any) {
    console.error('Failed to fetch AI recommendations:', error);
    return {
      status: 'unavailable',
      message: error.message || 'AI recommendations are temporarily offline.',
      resume_summary: null,
      strengths: [],
      weaknesses: [],
      missing_skills: [],
      ats_improvements: [],
      recruiter_improvements: [],
      suggested_bullet_points: [],
      resume_improvements: [],
      ats_recommendations: [],
    };
  }
}

// ==========================================
// AUTHENTICATION SERVICES
// ==========================================
export async function registerUser(email: string, password: string): Promise<any> {
  return postJSON('/auth/register', { email, password });
}

export async function loginUser(email: string, password: string): Promise<{ access_token: string, token_type: string, user: any }> {
  return postJSON('/auth/login', { email, password });
}

export async function getUserProfile(): Promise<UserProfile> {
  return getJSON('/user/profile');
}

export async function upgradeUserProfile(): Promise<any> {
  return postJSON('/user/upgrade', {});
}

export async function getUserUsage(): Promise<{ plan: string, ai_generation_count: number, limit: number, quota_exhausted: boolean }> {
  return getJSON('/user/usage');
}

// ==========================================
// HISTORY SERVICES
// ==========================================
export async function getUserHistory(page: number = 1, limit: number = 10): Promise<HistoryListResponse> {
  return getJSON(`/scans?page=${page}&limit=${limit}`);
}

export async function getHistoryDetail(resumeId: string): Promise<any> {
  return getJSON(`/scans/${resumeId}`);
}

export async function deleteHistoryItem(resumeId: string): Promise<{ status: string, message: string }> {
  return deleteJSON(`/scans/${resumeId}`);
}

export async function claimScan(resumeId: string): Promise<{ success: boolean }> {
  return postJSON(`/resume/${resumeId}/claim`, {});
}
export async function submitContactForm(data: any) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const response = await fetch(`${API_URL}/api/contact/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to submit form');
  }
  return response.json();
}
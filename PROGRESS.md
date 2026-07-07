# Development Progress Log - Resume ATS Scanner

This document summarizes the development activities performed phase-wise for the Resume ATS Scanner project.

---

### Phase 1: Resume Upload & Parsing
* **Document Parsing**: Implemented extraction of raw text from PDF files using `PyMuPDF` (`fitz`) and Word documents (`.docx`) using `python-docx`.
* **Contact Information Extraction**: Integrated regex pattern matching to extract candidate `email` and `phone` numbers.
* **Basic Layout Parsing**: Implemented layout-aware name extraction heuristic from the resume header.
* **API Endpoint**: Exposed `POST /resume/upload` returning structured candidate contact details and parsed text.
* **Database Schema**: Created PostgreSQL schema in SQLAlchemy (`User`, `Resume` models) with auto-creation of tables on startup and UUID-based server-side defaults.

### Phase 2: Job Description (JD) Parsing
* **NLP Pipeline**: Configured spaCy (`en_core_web_sm`) to process unstructured Job Description text.
* **Fields Isolation**: Structured the parser to extract Job Title, Technical Skills & Tools, Experience requirements (e.g. "5+ years"), Education requirements, and bulleted responsibilities.
* **Taxonomy Matcher**: Built skill and tool lists matching rules using pre-defined technical term matchers.
* **API Endpoint**: Exposed `POST /jd/parse` for extracting structured JD specifications.

### Phase 3: Resume Section Detector
* **Header Segmentation**: Built a heuristic parser matching standard resume sections (`summary`, `experience`, `projects`, `skills`, `education`, `certificates`, `achievements`).
* **Fallback Mechanisms**: Implemented fallback NLP/list checks to isolate skills or experience blocks when explicit section headers are missing.
* **API Endpoint**: Exposed `POST /resume/sections` returning segmented section text blocks.

### Phase 4: Keyword Extraction Engine
* **TF-IDF Vectorization**: Integrated `TfidfVectorizer` to extract the top 15 most important technical keywords and bigrams from the Job Description.
* **Occurrence Analysis**: Implemented word-boundary regex matching to search for JD keywords within the Resume.
* **Metrics**: Calculated `coverage_percentage` and detailed frequency match counts.
* **API Endpoint**: Exposed `POST /analyze/keywords`.

### Phase 5: ATS Score Engine & Refinements
* **Section-level Scoring**: Mapped section weights: Skills (40%), Experience (40%), Projects (10%), Education (10%).
* **Dynamic Weight Normalization**: Implemented an arithmetic weight scaler to exclude missing optional sections from penalty, computing scores over active weights only:
  $$\text{overall\_score} = \frac{\sum (\text{active\_section\_score} \times \text{weight})}{\sum (\text{active\_weights})}$$
* **Hybrid Skills Score**: Combined vocabulary keyword coverage (50%) and conceptual semantic similarity (50%) for the skills rating:
  $$\text{skills\_score} = \text{keyword\_coverage} \times 0.5 + \text{skills\_semantic} \times 0.5$$
* **Chronological Degree Comparison**: Compares candidate's parsed education degree ranks against the JD requirement (PhD > Master > Bachelor > Associate).
* **API Endpoint**: Exposed `POST /analyze/score` returning structured scores for skills, experience, projects, education, and overall.

### Phase 6: Semantic Matching
* **Embeddings Model**: Integrated SentenceTransformer `all-MiniLM-L6-v2` locally cached in the backend.
* **Similarity Engine**: Calculates cosine similarity between segmented resume sections and parsed JD requirement text.
* **ATS Scaling**: Clamped cosine similarity values to `0.0 - 1.0` and scaled to `0 - 100`.
* **API Endpoint**: Exposed `POST /analyze/semantic`.

### Phase 7: ATS Formatting Layout Analyzer
* **Contact & Content Checks**: Flags missing contact info (email, phone, LinkedIn) and missing Skills section as critical Issues.
* **Readability Warnings**: Flags very long text paragraphs (>80 words) without bullet points.
* **Layout Parsing**: Detects tables and multi-column layouts via delimiter spacing (vertical pipes, tab characters, and multiple consecutive spaces).
* **Formatting Density**: Detects excessive non-standard list symbols (e.g. ★, ✔, ❖) that break ATS parsers.
* **Flow & Length Checks**: Warns on extreme word counts (<200 or >1000), low bullet points count (<5), or incorrect chronological section ordering (Education before Professional Experience).
* **API Endpoint**: Exposed `POST /analyze/formatting` returning Issues, Warnings, and Recommendations.

### Phase 8: Premium Next.js Frontend Dashboard
* **Framework Bootstrapping**: Boostrapped a Next.js (TypeScript, App Router) web application with ESLint and npm packages configured for developer efficiency.
* **Modern Design System**: Rebuilt `globals.css` with a sleek dark-mode glassmorphism visual theme (blurs, glow accents, Outfit typography, SVG stroke animations).
* **Split-Screen Layout**: Designed a responsive interface with an input control panel on the left and dynamic dashboard reports on the right, which auto-stacks vertically on mobile viewports.
* **Staged Progress Loading**: Implemented a checklist stage tracker animating progress through the ATS backend pipeline steps (upload, segment, extract, match, format checks).
* **Score Transparency**: Computes and displays a breakdown of the ATS score and shows the exact math formula dynamically (normalizing missing section weights).
* **Section parsed indicator**: Displays a grid showing found vs missing resume sections.
* **Formatting analyzer integration**: Displays layout issues and warnings alongside their estimated score impact points (e.g. Missing Skills: -8 pts, Table: -5 pts).
* **Keywords breakdown**: Groups target terms into Matched, Missing, and Frequently Used (including occurrence counts).
* **Future feature placeholders**: Designed placeholders for scan history, AI recommendations, and export endpoints.
* **CORS Patch**: Patched backend CORS middleware configurations by setting `allow_credentials=False` to resolve browser wildcard conflicts.

### Phase 9: Gemini AI Recommendations Integration
* **Gemini LLM Pipeline**: Integrated Google Gemini API to analyze parsed resume text against JD requirements.
* **Resume Summary**: Generates a professional overview of the candidate's fit.
* **Key Strengths & Weaknesses**: Extracts highlights and critical warnings for the profile.
* **Actionable Bullet Rewrites**: Provides optimized experience bullet points with impact categories (High/Medium/Low) and structured explanations.
* **ATS & Recruiter Tips**: Suggests formatting and resume structure improvements.
* **Frontend Suggestions Tab**: Integrated suggestions tab in the dashboard with copy-to-clipboard functionality.

### Phase 10: Auth, History, Premium Gating & PDF Export
* **Unified Authentication**: Integrated Supabase Auth with database-backed session token verification (bearer token verification via custom `verify_jwt` utility and fallback to Supabase GoTrue API).
* **Password Recovery**: Implemented email-based forgot and reset password flows on both backend and frontend (with automated form clearing on transitions).
* **Centralized Entitlements**: Created `EntitlementService` to enforce subscription checks (free users get 1 scan, premium users get unlimited scans, locked export/copy features).
* **Scan History**: Built a paginated scan history dashboard with loading, caching, and record deletion.
* **Print-Optimized PDF Export**: Added `/export/[id]` preview page with A4 margins, print-friendly typography, a privacy toggle (hide personal contact details), and an option to auto-trigger the print utility.
* **Self-Healing Storage**: Added auto-verification and creation of the `"resumes"` storage bucket on backend startup.
* **UX Refinements**: Redesigned the scan history refresh button with loading spinners, page bounds safety (automatic fallback to page 1), and toast notifications.

### Phase 10 Refinements & Production Calibrations
* **Unified Education Matcher**: Refactored the degree matching logic to compare standardized ranks (`Associate's` < `Bachelor's` < `Master's`/`MBA` < `Ph.D.`) with proportional gap scaling (70%/40%/20%) and a `40%` baseline fallback for custom credentials.
* **Regex Collision & Case Guard**: Resolved the `B.E.`/`be` extraction collision by adding strict case-sensitive checks to ignore the common lowercase verb `"be"` while correctly extracting Bachelor of Engineering degrees.
* **Keyword-Prioritized Bullet Truncation**: Restructured the responsibilities parser to prioritize bullet points containing recognized skill or tool keywords, guaranteeing high-signal requirements are not lost when truncating to the 10-bullet display limit.
* **Duplicate Category Bound Repair**: Restructured the boundary parser to treat repeated categories as physical division lines, concatenating their texts rather than letting previous sections swallow subsequent block details.
* **Model Defaults Alignment**: Set default model chain to `"gemini-2.5-flash"` and `"gemini-2.0-flash"` to align with available API keys, resolving 404 endpoint errors.
* **Credential-less Placeholder Claiming**: Updated the registration flow to allow users to register and claim credential-less user placeholder records created during anonymous scans.
* **Friendly Recommendations CTA**: Replaced technical 401 warnings for anonymous recommendation requests with a successful 200 payload containing a user-friendly sign-in call-to-action.
* **Scan History Gating**: Secured scan history to display records only for fully registered and logged-in user accounts.
* **Free Trial Alert Popup**: Added a browser alert prompt when free trial AI suggestions are exhausted on click, preserving previous suggestions on the dashboard screen.

---

*Status: All frontend and backend files compile type-safely, unit test suite is 100% green (37/37 tests passed), and self-healing storage bucket initialization is active on startup.*


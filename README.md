# AI-Powered Resume ATS Scanner

An intelligent Applicant Tracking System (ATS) optimization tool that bridges the gap between job seekers and recruiters. By leveraging cutting-edge Natural Language Processing (NLP) and Large Language Models (LLM), this application provides granular insights into how a resume parses against a target Job Description (JD).

## 🚀 Key Features

*   **Hybrid Matching Engine**: Combines traditional keyword frequency analysis (TF-IDF) with deep semantic understanding (embeddings) to accurately evaluate candidate fit.
*   **Comprehensive Scoring**: Outputs an aggregated ATS Score out of 100 based on Semantic Match, Keyword Match, Document Formatting, and Section Completeness.
*   **Actionable AI Suggestions**: Analyzes gaps in experience and skills to generate concrete, contextual recommendations for improving the resume.
*   **Seamless State Restoration**: Users can effortlessly retrieve historical scans via a robust, URL-based history mechanism mapped directly to backend data.
*   **Unified Application Layout**: A highly-polished, premium dark-mode interface built with Next.js, integrating file upload directly within the analytics dashboard.

## 🛠️ Technology Stack

### Frontend
*   **Framework**: [Next.js](https://nextjs.org/) (App Router, React 18)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (with custom gradients & glassmorphism aesthetics)
*   **State & Theming**: React Hooks, `next-themes` (Dark/Light mode support)

### Backend
*   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
*   **AI/NLP**: Google Gemini Models for Semantic Analysis and Information Extraction.
*   **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL backend)
*   **Validation**: Pydantic for strict schema enforcement.

## 📂 Project Structure

```text
├── backend/                  # Python FastAPI Server
│   ├── app/                  # Main application source
│   │   ├── routes/           # API endpoints (resume, score, semantic, formatting, keyword)
│   │   ├── services/         # Core business logic (resume parsing, Supabase integration)
│   │   ├── schemas/          # Pydantic data models
│   │   └── utils/            # Shared helpers (auth, text processing)
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # Next.js Application
│   ├── app/                  # App Router pages (Dashboard, Landing)
│   │   ├── (marketing)/      # SEO Landing & Docs Pages
│   │   └── (app)/            # Core Scanner Application
│   ├── components/           # Reusable UI components (ScanFlow, FileUpload, ThemeToggle)
│   ├── lib/                  # Shared utilities (api client, auth contexts)
│   └── tailwind.config.ts    # Tailwind styling config
│
├── .agents/                  # Workspace guidelines for AI assistance
└── future_enhancement.md     # Project roadmap and version checklist
```

## ⚡ Getting Started

### Backend Setup
1. Navigate to the `backend/` directory.
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   * Windows: `.\venv\Scripts\activate`
   * Unix: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Configure your environment variables in `.env` (Supabase URLs, API Keys).
6. Run the FastAPI server: `uvicorn app.main:app --reload`

### Frontend Setup
1. Navigate to the `frontend/` directory.
2. Install dependencies: `npm install`
3. Configure your environment variables in `.env.local`.
4. Run the development server: `npm run dev`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🗺️ Roadmap
For details on upcoming features (like the Cover Letter Generator, LinkedIn Optimizer, and Resume Rewriter), please refer to the `future_enhancement.md` file in the root directory.

# Global Coding Practices and Guidelines

To reduce tokens, minimize iterations, and implement changes effectively in this repository, follow these guidelines:

## 1. Do Not Assume
- **Analyze before modifying**: Do not blindly overwrite functions or large files. Always use iew_file to read the specific block you are modifying.
- **Search context**: Use grep_search to find usages of a function or class before altering its signature, ensuring you don't break dependents.

## 2. Minimal & Targeted Edits
- **Use Multi-replace**: When editing a file, use the multi_replace_file_content tool to edit only the specific lines or chunks that need to change. Do NOT try to overwrite the entire file unless it's a new file.
- **Preserve Unrelated Code**: Do not touch existing docstrings, comments, or unrelated logic in files you are modifying. Maintain documentation integrity.

## 3. Strict Typing & Quality
- **TypeScript**: Always resolve TypeScript errors. Ensure proper null-checks (e.g., optional chaining ?.) before accessing nested properties, particularly when dealing with API responses or localStorage.
- **Backend (Python/FastAPI)**: Validate schemas via Pydantic. Do not bypass validations.

## 4. Architectural Patterns
- **Frontend (Next.js)**: Use React.Suspense boundaries for components utilizing useSearchParams. Keep client-side state localized unless it needs to be global.
- **Backend**: Adhere to the existing Route -> Service -> Schema pattern. Do not mix business logic into routing layers.

## 5. UI/UX Consistency
- **Aesthetics**: Match the application's premium, dark-mode styling. Use Tailwind CSS with established gradients (rom-sky-500 to-violet-500), glassmorphism panels (glass-panel), and micro-animations.

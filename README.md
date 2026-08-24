# TalentEdge AI

TalentEdge AI turns unstructured work experience into a polished, ATS-friendly resume. Add your profile, work history, and a target job description, then review and download a tailored resume.

## What it does

- Start from scratch, upload an existing resume, or paste LinkedIn profile content.
- Organize companies, roles, dates, and work accomplishments.
- Tailor resume content to a specific job description with AI.
- Edit the generated resume and LaTeX source before exporting.
- Save resumes and job descriptions in the browser for later use.
- Download resumes as PDF, DOCX, or TXT.
- Use the interface in English, Spanish, or Tagalog.
- Switch between light and dark themes on desktop or mobile.

## Tech stack

- React, TypeScript, and Vite
- Tailwind CSS and shadcn/ui
- React Router for page navigation
- Express for local API routes
- Vercel serverless functions for deployment
- OpenAI for resume generation and tailoring
- `jsPDF` and `docx` for downloads

## Getting started

### Requirements

- Node.js 18 or newer
- npm
- An OpenAI API key

### Install

```bash
npm install
```

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
```

`OPENAI_API_KEY` is required for the current generation and tailoring routes. The Gemini key is supported by the server configuration for Gemini-based generation.

### Run locally

Run the frontend and API server together:

```bash
npm run dev:all
```

Or run them separately:

```bash
npm run dev       # Vite app at http://localhost:8080
npm run server    # Express API at http://localhost:3001
```

The Vite development server proxies `/api` requests to the Express server.

## Main workflow

1. Open **Create**.
2. Start fresh, upload a resume, or paste LinkedIn profile content.
3. Review and complete your profile and work history.
4. Add the job description you are targeting.
5. Let AI generate a tailored resume.
6. Edit the preview, save it, or download it as PDF, DOCX, or TXT.

The landing page is available at `/`. The guided builder is available at `/create`, and the resume-from-story page is available at `/resume-from-your-story`.

## Useful commands

```bash
npm run dev       # Start the Vite development server
npm run server    # Start the local Express API
npm run dev:all   # Start both servers
npm run build     # Create a production build
npm run preview   # Preview the production build
npm run lint      # Run ESLint
npm run test:e2e  # Run Playwright end-to-end tests
```

## Project structure

```text
src/
├── components/       # Shared UI and resume builder components
├── components/wizard # Guided resume creation steps
├── contexts/         # Theme state
├── i18n/             # Language configuration and translations
├── lib/              # API, storage, parsing, and export utilities
└── pages/            # Landing, create, and resume-from-story pages

srv/                  # Shared Express/serverless handlers
api/                  # Vercel API function wrappers
public/               # Static assets
```

## API routes

- `POST /api/generate-resume` — Generate a resume from job information.
- `POST /api/parse-resume` — Parse uploaded or pasted resume content.
- `POST /api/tailor-resume` — Tailor work history to a job description.
- `GET /health` — Check that the local API server is running.

## Deployment

The app can be deployed to Vercel. Add the required API keys under the project’s environment variables, deploy the repository, and verify the API routes in the deployment logs.

Never commit `.env` files or API keys to the repository.

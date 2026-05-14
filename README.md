# PrepAI

AI-powered interview preparation, mock interview practice, and resume analysis built with Next.js.


## Overview

`PrepAI` helps candidates prepare for technical interviews with targeted, role-specific content instead of generic question lists. The app uses Google Gemini to generate interview packs from a job description or role, run interactive mock interviews, and compare resumes against a target job description.

The current app includes a polished dashboard, guided prep flows, PDF/TXT resume upload, and locally persisted history for recent sessions and analyses.

## Features

- `Interview from JD`: paste a job description and generate a tailored interview prep pack.
- `General Prep`: enter a job role, experience level, and tech stack to generate role-based preparation material.
- `Mock Interview`: practice with an AI interviewer that asks follow-up questions and evaluates each answer.
- `Resume Analyzer`: upload or paste a resume, compare it against a job description, and receive an ATS-style score with improvement suggestions.
- `Dashboard`: quickly jump back into recent prep sessions and resume analyses.
- `Responsive UI`: built for desktop and mobile layouts with light/dark theme support.

## What The App Generates

Depending on the workflow, `PrepAI` can generate:

- role summaries
- required skills and important concepts
- technical questions
- coding questions
- system design questions
- HR questions
- scenario-based questions
- rapid-fire revision prompts
- ATS score and keyword gap analysis
- resume summary suggestions
- bullet point improvement recommendations

## Tech Stack

- `Next.js 13` with App Router
- `React 18`
- `TypeScript`
- `Tailwind CSS`
- `shadcn/ui` + Radix UI components
- `Framer Motion` for UI animations
- `Zustand` for locally persisted app state
- `Google Gemini` for AI-generated interview and resume insights

## Getting Started

### Prerequisites

- `Node.js 18+`
- `npm`
- A `Google Gemini API key`

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```bash
GEMINI_API_KEY=your_gemini_api_key
```

The app currently checks both `GEMINI_API_KEY` and `NEXT_PUBLIC_GEMINI_API_KEY`, but using `GEMINI_API_KEY` is the safer default.

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

```bash
npm run dev        # start the development server
npm run build      # create a production build
npm run start      # run the production server
npm run lint       # run lint checks
npm run typecheck  # run TypeScript checks
```

## Usage

### 1. Generate interview prep from a job description

Go to `Interview Prep`, paste the JD, and generate a complete question set tailored to the role.

### 2. Generate prep without a job description

Use `General Prep` when you know the target role and stack but do not have a specific posting.

### 3. Practice with mock interviews

Open `Mock Interview`, choose your role and experience level, add your tech stack, and answer questions in a chat-style interview flow.

### 4. Analyze your resume

In `Resume Analyzer`, upload a `PDF` or `TXT` resume, or paste resume text manually, then compare it against a target job description.

## Project Structure

```text
app/
  (app)/
    dashboard/
    general-prep/
    interview-prep/
    mock-interview/
    resume-analyzer/
  api/
    interview/
    mock-interview/
    resume-analyze/
components/
  interview/
  layout/
  resume/
  ui/
lib/
  gemini.ts
  types.ts
store/
  appStore.ts
```

## How It Works

- The UI collects interview or resume input from the user.
- API routes under `app/api` call helpers in `lib/gemini.ts`.
- Gemini returns structured JSON for interview content, evaluation feedback, and resume analysis.
- Recent sessions and analyses are stored locally using Zustand persistence.

## Deployment

This project includes a `netlify.toml` file and `@netlify/plugin-nextjs`, so it is already set up for Netlify-based deployment.

For production, make sure the Gemini API key is configured in your hosting environment.

## Notes

- Resume upload currently supports `PDF` and `TXT` files.
- Recent sessions are stored locally in the browser, not in a database.
- The root route redirects to `/dashboard`.

## License

Created by Chetan 

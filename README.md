# LegalEase

An agentic consumer-rights enforcement platform that helps users automatically create, manage, and resolve legal complaints. Initially focused on flight delay compensation under EU261/UK261 and similar frameworks.

The system acts as an intelligent agent that understands a user's situation, determines legal eligibility, generates structured complaints, creates action plans, tracks progress, and adapts strategy based on outcomes.

## Status

**Early prototype.** The current implementation is a React SPA with mock auth and localStorage persistence. The spec calls for a full backend, secure auth, a case lifecycle engine, and an intelligence database — none of which are built yet.

### What exists

- Landing page with branding
- Mock authentication (localStorage)
- Case intake with AI-powered categorisation (Gemini)
- Dynamic form generation based on incident type
- Formal legal correspondence generation
- Basic case management and post-filing dashboard

### What's needed

- Backend infrastructure (API server, database, proper auth)
- Full case lifecycle engine with state machine and time-based triggers
- Enhanced multi-step agent reasoning (eligibility, compensation estimation, strategy)
- Document management (generation, storage, versioning, editing, uploads)
- Intelligence layer (anonymised data collection, outcome tracking, pattern analysis)
- Security hardening (row-level isolation, encrypted storage, audit logging)

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7 |
| AI | Google Generative AI (Gemini 2.5 Flash Lite) |
| Styling | Custom CSS, Inter + Source Serif Pro |
| Storage | localStorage (temporary — backend TBD) |

## Project structure

```
src/
├── components/
│   ├── LandingPage.jsx       # Hero, features, CTA
│   ├── LoginSignup.jsx       # Auth form
│   ├── CaseIntake.jsx        # Incident intake + AI categorisation
│   ├── CaseDossier.jsx       # Generated dossier + correspondence
│   ├── CaseDashboard.jsx     # Post-filing management
│   └── CaseList.jsx          # All cases overview
├── utils/
│   ├── AuthContext.jsx        # Auth state (mock)
│   └── AgentService.js       # Gemini API integration
├── config/
│   └── landingContent.js     # Landing page copy
├── App.jsx                   # Main router + case management
├── App.css                   # Component styles
├── index.css                 # Global styles + design tokens
└── main.jsx                  # Entry point
```

## Getting started

### Prerequisites

- Node.js 18+
- A Google Generative AI API key ([get one here](https://aistudio.google.com/))

### Setup

```bash
git clone <repo-url>
cd Legal-ease
npm install
cp .env.example .env
# Add your VITE_GEMINI_API_KEY to .env
npm run dev
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Core user flow

1. **Sign up / Log in** — create an account (currently mock auth)
2. **Create a case** — describe the incident (airline, flight, route, delay, etc.)
3. **AI analysis** — agent determines legal framework, eligibility, and compensation estimate
4. **Action plan** — agent generates a step-by-step enforcement strategy
5. **Complaint generation** — formal letters, escalation documents, regulator submissions
6. **Track & manage** — monitor case lifecycle, upload responses, follow next actions
7. **Resolution** — case reaches outcome, data feeds intelligence layer

## Case lifecycle

```
created → complaint_submitted → awaiting_response → escalated → resolved → closed
```

## Architecture vision

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  React SPA  │────▶│   API Layer  │────▶│    Database      │
│  (Frontend) │◀────│   (TBD)      │◀────│    (TBD)        │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
                    ┌──────▼───────┐     ┌─────────────────┐
                    │ Agent System │────▶│  Intelligence DB │
                    │  (Gemini)    │◀────│  (anonymised)   │
                    └──────────────┘     └─────────────────┘
```

## Security requirements

- Strict per-user data isolation
- Authenticated access to all case data
- No cross-user visibility
- Secure storage of all sensitive information
- Legal-grade confidentiality

## Licence

Private. All rights reserved.

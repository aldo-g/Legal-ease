# CLAUDE.md — LegalEase

## What is this project?

LegalEase is an agentic consumer-rights enforcement platform. Users describe a complaint (starting with flight delays under EU261/UK261), and the system determines eligibility, generates formal legal documents, creates action plans, and tracks case progress.

See `README.md` for full details and the project spec.

## Current state

Early prototype — React SPA with mock auth and localStorage. No backend yet.

## Tech stack

- **React 19** with JSX (not TypeScript)
- **Vite 7** for dev/build
- **Google Generative AI** (Gemini 2.5 Flash Lite) via `@google/generative-ai`
- **CSS** — custom properties, no CSS-in-JS, no Tailwind
- **ESLint 9** — flat config, React hooks plugin, React Refresh plugin
- **No router** — view state managed manually via `useState` + localStorage

## Project structure

```
src/
├── components/       # React UI components (one per file)
├── utils/            # Services and context providers
├── config/           # Static content and configuration
├── App.jsx           # Main app — routing, case state management
├── App.css           # Component-level styles
├── index.css         # Global styles, design tokens, CSS variables
└── main.jsx          # React entry point
```

## Conventions

### Code style
- **JavaScript only** — no TypeScript (yet)
- **JSX** for components, `.js` for utilities
- **Functional components** with hooks — no class components
- **Named exports** for utilities, **default exports** for components
- **camelCase** for variables/functions, **PascalCase** for components
- **Single quotes** for strings in JS
- **ES modules** (`import`/`export`) throughout

### State management
- React Context for auth (`useAuth()`)
- `useState` / `useEffect` / `useMemo` for local + derived state
- localStorage for persistence (keyed per user: `le_cases_v2_{userId}`)

### Styling
- Plain CSS with CSS custom properties (defined in `index.css`)
- Typography: Inter (body), Source Serif Pro (headings/legal text)
- Colour palette: navy/slate primary, burgundy accent, off-white backgrounds
- No utility-class frameworks

### AI integration
- All AI calls go through `src/utils/AgentService.js`
- Two main functions: `researchComplaint()` and `generatePressurePlan()`
- API key via `VITE_GEMINI_API_KEY` env var
- Responses are structured JSON parsed from Gemini output

### Naming conventions
- localStorage keys prefixed with `le_`
- Case IDs format: `LE-xxxx-yyyy`
- Case statuses: `DRAFT`, `SUBMITTED` (to be expanded)

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

## Environment variables

```
VITE_GEMINI_API_KEY=   # Required — Google Generative AI API key
```

## Important notes

- **Security is critical.** This handles legal case data. All case data must be strictly isolated per user. Never expose one user's data to another.
- **No backend exists yet.** localStorage is a temporary measure. All persistence patterns should be designed with future backend migration in mind.
- **Keep the agent service centralised.** All AI/LLM calls must go through `AgentService.js` — never call Gemini directly from components.
- **Legal-grade confidentiality.** Treat all case data as sensitive. No PII in logs, analytics, or error reports.
- **Don't over-engineer.** Build what's needed for the current step. The spec is ambitious — implement incrementally.

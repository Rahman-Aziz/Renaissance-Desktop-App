# Renaissance-Desktop-App

# Renaissance — Build Walkthrough

## What Was Built

**Renaissance** is a cross-platform desktop app (Electron + React + Vite) with four AI-powered sub-pages, each with its own dedicated UI, AI system prompt, and history panel.

---

## Screenshots

### Home Dashboard
![Home](file:///C:/Users/USER/.gemini/antigravity/brain/3376cf15-6bb6-443d-b2ee-5725b843cc3b/home_1774880345560.png)

### Model Builder
![Model Builder](file:///C:/Users/USER/.gemini/antigravity/brain/3376cf15-6bb6-443d-b2ee-5725b843cc3b/model_builder_1774880369872.png)

---

## Architecture

| File | Purpose |
|---|---|
| `electron/main.js` | Electron main process — window, IPC, history (JSON), Excel gen |
| `electron/preload.js` | Secure contextBridge IPC bridge |
| `src/App.jsx` | Router + sidebar layout |
| `src/index.css` | Full dark design system (tokens, glassmorphism, animations) |
| `src/pages/Home.jsx` | Welcome dashboard with feature cards |
| `src/pages/ModelBuilder.jsx` | Feature 1 — Math model + Excel download |
| `src/pages/SubjectLearner.jsx` | Feature 2 — Academic learning path |
| `src/pages/SkillLearner.jsx` | Feature 3 — Skill breakdown + sub-skills |
| `src/pages/Researcher.jsx` | Feature 4 — Research compiler |
| `src/services/gemini.js` | Gemini 2.0 Flash streaming + JSON mode |
| `src/utils/markdown.js` | Lightweight markdown→HTML renderer (no deps) |

## How to Run

```powershell
cd C:\Users\USER\.gemini\antigravity\scratch\renaissance
npm run dev
```

## Features Implemented

- **4 dedicated sub-pages** with unique AI system prompts and colour accents
- **Streaming AI responses** word-by-word via Gemini 2.0 Flash SSE
- **Search Grounding** enabled on Subject Learner, Skill Learner, Research (real web links)
- **History** — last 50 entries saved per page via JSON files in Electron userData dir, persists across sessions
- **Excel generation** — Model Builder generates a `.xlsx` workbook with Inputs + Model + Summary sheets, saved to Downloads
- **Custom frameless window** with native-style title bar controls (minimize/maximize/close)
- **Renaissance dark theme** — Cinzel serif logo, gold accents, glassmorphism cards, per-page accent colours
- **Stop generation** button cancels streaming mid-response

## Known Notes
- Electron's DevTools open detached in dev mode (normal)
- The Gemini API key is embedded in `src/services/gemini.js` — move to env file for production

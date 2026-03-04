<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# StateSync AI

**AI-powered state payroll tax registration for small US businesses.**

Hiring in a new state? StateSync uses **Gemini AI** to read state tax requirements, pre-fill official registration forms from your company profile, and walk you through only the missing fields — all in a polished, animated single-page experience.

---

## ✨ Features

- **AI-Driven Form Pre-Fill** — Gemini extracts relevant company data and maps it onto each state's official registration schema automatically.
- **Interactive Compliance Wizard** — A conversational UI guides the user through only the missing fields, one at a time.
- **Readiness Score** — A real-time percentage showing how complete the registration application is.
- **Multi-State Support** — Currently supports **New York**, **California**, and **Washington**, each with unique field requirements.
- **Mock / Live Modes** — Runs fully offline with mock data; connects to **Gemini 3 Flash** when an API key is provided.
- **Modern UI** — Dark theme with glassmorphism, gradient accents, and smooth Framer Motion page transitions.

---

## 🏗️ Architecture

```
statesync/
├── index.html              # SPA entry point
├── server.ts               # Express server (API + Vite dev middleware)
├── vite.config.ts          # Vite + React + Tailwind v4
├── src/
│   ├── main.tsx            # React root
│   ├── App.tsx             # Full app UI (idle → processing → form → submitted)
│   └── index.css           # Global styles
├── server/
│   ├── gemini.ts           # Gemini AI integration (structured output extraction)
│   └── mockData.ts         # Demo company, state requirements, and field metadata
├── .env.example            # Environment variable template
└── package.json
```

### How It Works

1. **User selects a state** (NY / CA / WA) on the landing page.
2. The frontend `POST`s to `/api/companies/demo-company/compliance-sessions` with the target state.
3. The server sends the state's tax-registration text + the company profile to **Gemini**, which returns a structured JSON payload matching the canonical schema.
4. A **readiness score** and list of **missing fields** are computed and returned.
5. The UI renders a split view: a conversational assistant on the left asking for missing data, and a live-updating registration form on the right.
6. Each answer `PUT`s to `/api/compliance-sessions/:id`, and the score + form update in real time.
7. Once 100 % ready, the user submits the registration.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- A **Gemini API key** (optional — the app works with mock data without one)

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and add your Gemini key (optional)
cp .env.example .env.local
# → Edit .env.local and set GEMINI_API_KEY

# 3. Start the dev server
npm run dev
```

The app will be available at **http://localhost:3000**.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Express + Vite dev server with HMR |
| `npm run build` | Production build via Vite |
| `npm run preview` | Preview the production build |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm run clean` | Remove the `dist/` folder |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/companies/demo-company` | Get demo company profile |
| `GET` | `/api/companies/demo-company/locations` | Get company locations |
| `GET` | `/api/companies/demo-company/employees` | Get company employees |
| `POST` | `/api/companies/:id/compliance-sessions` | Create a new compliance session for a target state |
| `GET` | `/api/compliance-sessions/:id` | Get session details |
| `PUT` | `/api/compliance-sessions/:id` | Update a field value in the session |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Framer Motion, Lucide Icons |
| Styling | Tailwind CSS v4 |
| Backend | Express, Node.js |
| AI | Google Gemini (`@google/genai`) |
| Build | Vite, TypeScript |

---

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No | Gemini API key. Falls back to mock data if missing. |
| `APP_URL` | No | Hosting URL (auto-injected in AI Studio). |

---

## 📄 License

This project is unlicensed — feel free to use it however you'd like.

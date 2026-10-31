# 📰 THE WORLD DAILY — Global News Briefing

[![Vercel Deploy](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rajulbusiness007-star/the-world-daily-newsletter)
[![React 19](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff.svg)](https://vitejs.dev/)

**THE WORLD DAILY** is a verified global news platform and automated morning briefing engine built with an India-first editorial policy (60% India / 40% World). It features multi-source corroboration, editorial bias transparency, article reader mode, text-to-speech audio, and AI-synthesized executive briefs.

---

## ✨ Features

- **India-First Global Briefing**: Curates top verified stories across national governance, economy, legal/courts, defence, and world affairs.
- **Verification Engine**: Strict corroboration pipeline classifying stories by factual confirmation status (`VERIFIED`, `Official`, `DEVELOPING`).
- **Automated Morning Edition**: Daily 06:30 AM IST editorial digest with "The Bigger Picture" explainer and "Five Things to Remember Today".
- **Zero-Downtime Architecture**: Dual-layer architecture designed for both local Node/Express hosting and static CDN serverless hosting on Vercel.
- **Audio Reading**: Integrated Web Speech API text-to-speech player with dynamic progress tracking.
- **Editorial Transparency**: Complete sources directory mapping ownership, bias ratings, and factual accuracy history.

---

## 🚀 1-Click Deployment to Vercel

### Method 1: Via Vercel Web Dashboard (Easiest)
1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and import `rajulbusiness007-star/the-world-daily-newsletter`.
3. In **Build and Output Settings**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**! Your site will be live across Vercel's global edge network in seconds.

### Method 2: Via Vercel CLI
```bash
npm install -g vercel
vercel
```

---

## 💻 Running Locally

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Run
```bash
# 1. Clone repository
git clone https://github.com/rajulbusiness007-star/the-world-daily-news.git
cd the-world-daily-news

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Start development server
npm run dev

# 4. Open in browser
http://localhost:3000  # or http://127.0.0.1:3000
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Motion, Recharts, Lucide React
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Build System**: Vite 8
- **Server**: Express 4.21
- **AI Synthesis**: Google Gemini 3.8 Flash (`@google/genai`)
- **Ingestion**: Fast XML Parser for high-throughput multi-feed RSS parsing

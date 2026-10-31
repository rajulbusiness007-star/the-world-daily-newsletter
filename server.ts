import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase, saveDatabase } from './server/db.js';
import { SOURCES_REGISTRY, TRUSTED_CORE_OUTLET_IDS, getTrustedCoreOutlets } from './server/sourcesRegistry.js';
import { buildDailyEdition, getTodayISTDateString } from './server/newsletterEngine.js';
import { runIngestionCycle } from './server/rssIngestion.js';
import { generateArticleQuickSummary } from './server/geminiService.js';

dotenv.config();

// Process crash prevention guards
process.on('uncaughtException', (err) => {
  console.error('[Safety Guard] Uncaught Exception caught (process preserved):', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Safety Guard] Unhandled Rejection (process preserved):', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Today's Edition on startup if not already generated
async function initializeTodayEdition() {
  const db = getDatabase();
  const todayKey = getTodayISTDateString();
  if (!db.editions[todayKey]) {
    console.log(`Generating initial Daily Edition for ${todayKey}...`);
    const edition = await buildDailyEdition(db.articles, Object.keys(db.editions).length);
    db.editions[todayKey] = edition;
    saveDatabase(db);
  }
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// 1. Filtered News Articles Feed
app.get('/api/news', (req, res) => {
  try {
    const db = getDatabase();
    let articles = [...db.articles];

    const { category, country, status, search, limit, offset } = req.query;

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      articles = articles.filter(a => 
        a.headline.toLowerCase().includes(q) || 
        a.summary.toLowerCase().includes(q) ||
        a.publisher.toLowerCase().includes(q)
      );
    }

    if (category && typeof category === 'string' && category !== 'All') {
      const catLower = category.toLowerCase();
      if (catLower === 'ai' || catLower === 'ai news') {
        const aiRegex = /\b(ai|artificial intelligence|llm|llms|machine learning|deep learning|genai|gpt|neural|semiconductor|blackwell|nvidia|openai|anthropic|deepmind|bhashini)\b/i;
        articles = articles.filter(a => 
          a.category.toLowerCase().includes('technology') ||
          aiRegex.test(a.headline) ||
          aiRegex.test(a.summary) ||
          aiRegex.test(a.subCategory || '')
        );
      } else {
        articles = articles.filter(a => a.category.toLowerCase().includes(catLower));
      }
    }

    if (country && typeof country === 'string' && country !== 'All') {
      if (country === 'India') {
        articles = articles.filter(a => a.country === 'India');
      } else if (country === 'World') {
        articles = articles.filter(a => a.country !== 'India');
      } else {
        articles = articles.filter(a => a.country.toLowerCase().includes(country.toLowerCase()));
      }
    }

    if (status && typeof status === 'string' && status !== 'All') {
      articles = articles.filter(a => a.verificationStatus === status);
    }

    const total = articles.length;
    const start = offset ? parseInt(offset as string, 10) : 0;
    const count = limit ? parseInt(limit as string, 10) : 50;

    const paginated = articles.slice(start, start + count);

    res.json({
      total,
      articles: paginated,
      indiaCount: articles.filter(a => a.country === 'India').length,
      worldCount: articles.filter(a => a.country !== 'India').length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Single Article Detail
app.get('/api/news/:id', (req, res) => {
  try {
    const db = getDatabase();
    const article = db.articles.find(a => a.id === req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(article);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2b. Gemini-powered 3-point Quick Summary (TL;DR)
app.post('/api/article/quick-summary', async (req, res) => {
  try {
    const { id, headline, summary, facts, whyItMatters } = req.body;
    if (!headline || !summary) {
      return res.status(400).json({ error: 'Headline and summary are required' });
    }

    const result = await generateArticleQuickSummary({
      id,
      headline,
      summary,
      facts: Array.isArray(facts) ? facts : [],
      whyItMatters: typeof whyItMatters === 'string' ? whyItMatters : undefined,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate quick summary' });
  }
});

// 3. Today's Daily Briefing Newsletter
app.get('/api/newsletter/today', async (req, res) => {
  try {
    const db = getDatabase();
    const todayKey = getTodayISTDateString();
    let edition = db.editions[todayKey] || Object.values(db.editions)[0];

    if (!edition) {
      edition = await buildDailyEdition(db.articles, Object.keys(db.editions).length);
      db.editions[todayKey] = edition;
      saveDatabase(db);
    }

    res.json(edition);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Historical Edition by Date (YYYY-MM-DD)
app.get('/api/newsletter/edition/:date', (req, res) => {
  try {
    const db = getDatabase();
    const edition = db.editions[req.params.date];
    if (!edition) {
      return res.status(404).json({ error: `No edition found for ${req.params.date}` });
    }
    res.json(edition);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Editions Archive List
app.get('/api/newsletter/archive', (req, res) => {
  try {
    const db = getDatabase();
    const archiveList = Object.entries(db.editions).map(([date, ed]) => ({
      date,
      formattedDate: ed.formattedDate,
      editionNumber: ed.editionNumber,
      totalArticles: ed.totalArticles,
      indiaRatio: ed.indiaRatio,
      worldRatio: ed.worldRatio,
      leadHeadline: ed.sectionA_IndiaTop10[0]?.headline || 'Daily Global Briefing'
    })).sort((a, b) => b.date.localeCompare(a.date));

    res.json(archiveList);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Sources Directory & Transparency
app.get('/api/sources', (req, res) => {
  try {
    res.json({
      total: SOURCES_REGISTRY.length,
      sources: SOURCES_REGISTRY
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6b. Connected Trusted Outlets Directory for Newsletter
app.get('/api/newsletter/connected-outlets', (req, res) => {
  try {
    const db = getDatabase();
    const coreOutlets = getTrustedCoreOutlets();
    const result = coreOutlets.map(src => {
      const count = db.articles.filter(a => a.publisherId === src.id || a.publisher.toLowerCase().includes(src.name.toLowerCase())).length;
      return {
        ...src,
        totalArticlesInArchive: count
      };
    });
    res.json({
      total: result.length,
      outlets: result,
      coreIds: TRUSTED_CORE_OUTLET_IDS
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. System Health Monitor
app.get('/api/system/health', (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.systemHealth);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Manual Trigger Ingestion Cycle
app.post('/api/news/refresh', async (req, res) => {
  try {
    console.log('Manual refresh initiated...');
    const result = await runIngestionCycle();
    res.json({
      success: true,
      message: `Refreshed feeds. Added ${result.addedCount} new articles.`,
      addedCount: result.addedCount,
      errors: result.errors
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// SERVER-SIDE AUTOMATED SCHEDULER (ASIA/KOLKATA IST 6:30 AM + Periodic)
// -------------------------------------------------------------
let isFetching = false;
async function triggerScheduledIngestion() {
  if (isFetching) return;
  isFetching = true;
  try {
    console.log('[Scheduler] Executing periodic RSS collection and verification cycle...');
    await runIngestionCycle();
  } catch (err) {
    console.error('[Scheduler] Ingestion error:', err);
  } finally {
    isFetching = false;
  }
}

// Check every minute for 6:30 AM IST morning daily edition creation
let lastEditionDayChecked = '';
setInterval(async () => {
  const istNow = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date());

  const todayDateStr = getTodayISTDateString();

  if (istNow === '06:30' && lastEditionDayChecked !== todayDateStr) {
    lastEditionDayChecked = todayDateStr;
    console.log(`[Scheduler] 6:30 AM IST reached! Generating official daily morning edition for ${todayDateStr}...`);
    await triggerScheduledIngestion();
  }
}, 60 * 1000);

// Periodic ingestion every 30 minutes
setInterval(() => {
  triggerScheduledIngestion();
}, 30 * 60 * 1000);

// Run initial ingestion check 15 seconds after server start so app starts quickly
setTimeout(() => {
  triggerScheduledIngestion();
}, 15000);

// -------------------------------------------------------------
// VITE DEV SERVER OR STATIC PROD SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`THE WORLD DAILY server running on http://localhost:${PORT} and http://127.0.0.1:${PORT}`);
    // Initialize in background so port 3000 opens immediately
    initializeTodayEdition().catch(err => {
      console.error('Error during initial edition generation:', err);
    });
  });
}

startServer();

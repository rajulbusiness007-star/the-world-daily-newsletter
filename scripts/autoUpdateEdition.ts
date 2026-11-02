import fs from 'fs';
import path from 'path';
import { runIngestionCycle } from '../server/rssIngestion.js';
import { getDatabase, saveDatabase } from '../server/db.js';
import { getTodayISTDateString, buildDailyEdition } from '../server/newsletterEngine.js';

async function main() {
  const startTime = Date.now();
  console.log(`=======================================================`);
  console.log(`THE WORLD DAILY — AUTONOMOUS DAILY NEWSLETTER UPDATER`);
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`=======================================================`);

  const todayIST = getTodayISTDateString();
  console.log(`[AutoUpdate] Target Daily Edition Date (Asia/Kolkata): ${todayIST}`);

  try {
    console.log(`[AutoUpdate] Step 1: Ingesting active RSS feeds from 46 verified sources...`);
    const result = await runIngestionCycle();
    console.log(`[AutoUpdate] ✓ Ingestion cycle finished in ${((Date.now() - startTime) / 1000).toFixed(1)}s.`);
    console.log(`[AutoUpdate] ✓ Newly verified articles added: ${result.addedCount}`);
    if (result.errors.length > 0) {
      console.log(`[AutoUpdate] ℹ Feeds requiring attention: ${result.errors.length}`);
    }

    const db = getDatabase();

    console.log(`[AutoUpdate] Step 2: Verifying today's edition (${todayIST})...`);
    if (!db.editions[todayIST]) {
      console.log(`[AutoUpdate] Compiling new official Daily Edition for ${todayIST}...`);
      const editionNumber = Object.keys(db.editions).length + 1;
      const newEdition = await buildDailyEdition(db.articles, editionNumber);
      db.editions[todayIST] = newEdition;
      saveDatabase(db);
      console.log(`[AutoUpdate] ✓ Edition #${editionNumber} compiled with ${newEdition.totalArticles} verified stories.`);
    } else {
      console.log(`[AutoUpdate] Today's edition already exists; refreshing with newest verified items...`);
      const existingEdNumber = db.editions[todayIST].editionNumber || Object.keys(db.editions).length;
      const updatedEdition = await buildDailyEdition(db.articles, existingEdNumber);
      db.editions[todayIST] = updatedEdition;
      saveDatabase(db);
      console.log(`[AutoUpdate] ✓ Refreshed today's edition (${updatedEdition.totalArticles} stories).`);
    }

    console.log(`[AutoUpdate] Step 3: Synchronizing public static database for Vercel deployment...`);
    const publicDataDir = path.resolve(process.cwd(), 'public', 'data');
    if (!fs.existsSync(publicDataDir)) {
      fs.mkdirSync(publicDataDir, { recursive: true });
    }
    const publicDbFile = path.join(publicDataDir, 'news_db.json');
    fs.writeFileSync(publicDbFile, JSON.stringify(db, null, 2), 'utf-8');
    console.log(`[AutoUpdate] ✓ Successfully updated ${publicDbFile}`);

    console.log(`=======================================================`);
    console.log(`✓ Daily newsletter automated update completed successfully!`);
    console.log(`Total duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    console.log(`=======================================================`);
    process.exit(0);
  } catch (err: any) {
    console.error(`[AutoUpdate] Fatal error in daily auto-update:`, err);
    process.exit(1);
  }
}

main();

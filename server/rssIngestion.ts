import { XMLParser } from 'fast-xml-parser';
import { getActiveRssFeeds, getSourceById } from './sourcesRegistry.js';
import { runVerificationPipeline } from './verificationEngine.js';
import { getDatabase, saveDatabase } from './db.js';
import { buildDailyEdition, getTodayISTDateString } from './newsletterEngine.js';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  trimValues: true,
  parseTagValue: false
});

export interface RawItem {
  title: string;
  link: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  sourceId: string;
  imageUrl?: string;
}

/**
 * Extracts the best candidate image URL from an RSS or Atom XML item object
 */
function extractImageUrl(item: any, description: string, contentEncoded: string = ''): string | undefined {
  // 1. media:content
  if (item['media:content']) {
    const mc = Array.isArray(item['media:content']) ? item['media:content'][0] : item['media:content'];
    const url = mc?.['@_url'] || mc?.['@_href'];
    if (url && typeof url === 'string' && url.startsWith('http')) return url.trim();
  }

  // 2. enclosure tag
  if (item.enclosure) {
    const enc = Array.isArray(item.enclosure) ? item.enclosure[0] : item.enclosure;
    const url = enc?.['@_url'] || enc?.['@_href'];
    const type = enc?.['@_type'] || '';
    if (url && typeof url === 'string' && (type.startsWith('image') || /\.(jpg|jpeg|png|webp|avif)/i.test(url))) {
      return url.trim();
    }
  }

  // 3. media:thumbnail
  if (item['media:thumbnail']) {
    const mt = Array.isArray(item['media:thumbnail']) ? item['media:thumbnail'][0] : item['media:thumbnail'];
    const url = mt?.['@_url'] || mt?.['@_href'];
    if (url && typeof url === 'string' && url.startsWith('http')) return url.trim();
  }

  // 4. image tag inside channel/item
  if (item.image) {
    const url = typeof item.image === 'string' ? item.image : item.image?.url || item.image?.['#text'];
    if (url && typeof url === 'string' && url.startsWith('http')) return url.trim();
  }

  // 5. Embedded <img> in description or content:encoded
  const combinedHtml = `${description} ${contentEncoded}`;
  const imgMatch = combinedHtml.match(/<img[^>]+src=["'](https?:\/\/[^"'>]+)["']/i);
  if (imgMatch && imgMatch[1]) {
    const candidate = imgMatch[1];
    // Exclude tracking pixels and feedburner logos
    if (!candidate.includes('1x1') && !candidate.includes('feedburner.com/~r/')) {
      return candidate.trim();
    }
  }

  return undefined;
}

/**
 * Fetch and parse a single RSS/Atom feed with timeout
 */
async function fetchSourceFeed(sourceId: string, rssUrl: string): Promise<RawItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(rssUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TheWorldDaily-NewsBriefingEngine/1.0 (Editorial Ingestion Bot; info@theworlddaily.org)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const xmlText = await res.text();
    const parsed = xmlParser.parse(xmlText);
    const rawItems: RawItem[] = [];

    // RSS 2.0 format: <rss><channel><item>
    const channelItems = parsed?.rss?.channel?.item || parsed?.['rdf:RDF']?.item;
    if (channelItems) {
      const itemsArray = Array.isArray(channelItems) ? channelItems : [channelItems];
      for (const item of itemsArray) {
        const title = typeof item.title === 'string' ? item.title : item.title?.['#text'] || '';
        let link = typeof item.link === 'string' ? item.link : item.link?.['#text'] || item['@_href'] || '';
        if (Array.isArray(link)) link = link[0];
        const pubDate = item.pubDate || item['dc:date'] || item.updated;
        const description = item.description || item['content:encoded'] || '';
        const snippet = typeof description === 'string' ? description : description?.['#text'] || '';
        const encoded = typeof item['content:encoded'] === 'string' ? item['content:encoded'] : '';

        const imageUrl = extractImageUrl(item, snippet, encoded);

        if (title && link) {
          rawItems.push({
            title: title.trim(),
            link: link.trim(),
            pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            contentSnippet: snippet.replace(/<[^>]*>?/gm, '').trim(),
            sourceId,
            imageUrl
          });
        }
      }
    } 
    // Atom format: <feed><entry>
    else if (parsed?.feed?.entry) {
      const entries = Array.isArray(parsed.feed.entry) ? parsed.feed.entry : [parsed.feed.entry];
      for (const entry of entries) {
        const title = typeof entry.title === 'string' ? entry.title : entry.title?.['#text'] || '';
        let link = entry.link?.['@_href'] || (typeof entry.link === 'string' ? entry.link : '');
        if (Array.isArray(entry.link)) {
          const alternate = entry.link.find((l: any) => l['@_rel'] === 'alternate') || entry.link[0];
          link = alternate?.['@_href'] || '';
        }
        const pubDate = entry.updated || entry.published;
        const summary = entry.summary || entry.content || '';
        const snippet = typeof summary === 'string' ? summary : summary?.['#text'] || '';

        const imageUrl = extractImageUrl(entry, snippet, '');

        if (title && link) {
          rawItems.push({
            title: title.trim(),
            link: link.trim(),
            pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            contentSnippet: snippet.replace(/<[^>]*>?/gm, '').trim(),
            sourceId,
            imageUrl
          });
        }
      }
    }

    return rawItems.slice(0, 15); // Take top 15 most recent items per feed
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw new Error(`Failed fetching ${rssUrl}: ${err.message}`);
  }
}

/**
 * Executes full ingestion across active feeds, verifies content, and updates database
 */
export async function runIngestionCycle(): Promise<{ addedCount: number; errors: string[] }> {
  const db = getDatabase();
  const activeFeeds = getActiveRssFeeds();
  const rawItems: RawItem[] = [];
  const errors: string[] = [];
  const failedFeedsMap: typeof db.systemHealth.failedFeeds = [];

  // Concurrently fetch feeds in batches of 4 to avoid socket congestion
  const batchSize = 4;
  for (let i = 0; i < activeFeeds.length; i += batchSize) {
    const batch = activeFeeds.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(source => fetchSourceFeed(source.id, source.rssUrl!))
    );

    results.forEach((res, index) => {
      const source = batch[index];
      if (res.status === 'fulfilled') {
        rawItems.push(...res.value);
      } else {
        const errMsg = res.reason?.message || 'Unknown network error';
        errors.push(`${source.name}: ${errMsg}`);
        failedFeedsMap.push({
          sourceId: source.id,
          sourceName: source.name,
          error: errMsg,
          lastAttempt: new Date().toISOString()
        });
      }
    });
  }

  // Run the multi-step verification pipeline on all gathered fresh items
  const newlyVerifiedArticles = runVerificationPipeline(rawItems);

  // Merge into database (deduplicate against existing URLs, headlines, and IDs)
  let addedCount = 0;
  const existingUrls = new Set(db.articles.map(a => a.url));
  const existingHeadlines = new Set(db.articles.map(a => (a.headline || '').toLowerCase().trim()));
  const existingIds = new Set(db.articles.map(a => a.id));

  for (const newArt of newlyVerifiedArticles) {
    const normHeadline = (newArt.headline || '').toLowerCase().trim();
    if (!existingUrls.has(newArt.url) && !existingHeadlines.has(normHeadline) && !existingIds.has(newArt.id)) {
      db.articles.unshift(newArt);
      existingUrls.add(newArt.url);
      existingHeadlines.add(normHeadline);
      existingIds.add(newArt.id);
      addedCount++;
    }
  }

  // Keep database bounded to the latest 500 verified articles
  if (db.articles.length > 500) {
    db.articles = db.articles.slice(0, 500);
  }

  // Build or update today's edition
  const todayKey = getTodayISTDateString();
  const existingEditionsCount = Object.keys(db.editions).length;
  const todayEdition = await buildDailyEdition(db.articles, existingEditionsCount);
  db.editions[todayKey] = todayEdition;

  // Update System Health
  db.systemHealth.lastSuccessfulUpdate = new Date().toISOString();
  db.systemHealth.nextScheduledUpdate = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  db.systemHealth.totalArticlesInDatabase = db.articles.length;
  db.systemHealth.activeFeedCount = activeFeeds.length - failedFeedsMap.length;
  db.systemHealth.failedFeeds = failedFeedsMap;
  db.systemHealth.recentIngestionLogs.unshift({
    timestamp: new Date().toISOString(),
    message: `Ingestion completed. Fetched ${rawItems.length} items from ${activeFeeds.length} feeds. Added ${addedCount} newly verified articles.`,
    level: errors.length > 0 ? 'warn' : 'info',
    articlesAdded: addedCount
  });

  if (db.systemHealth.recentIngestionLogs.length > 30) {
    db.systemHealth.recentIngestionLogs = db.systemHealth.recentIngestionLogs.slice(0, 30);
  }

  saveDatabase(db);
  return { addedCount, errors };
}
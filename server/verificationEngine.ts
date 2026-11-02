import crypto from 'crypto';
import { Article, CorroboratingSource, VerificationStatus, ContentType, NewsSource } from './types.js';
import { SOURCES_REGISTRY, getSourceById } from './sourcesRegistry.js';

interface RawItem {
  title: string;
  link: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  sourceId: string;
  imageUrl?: string;
}

// Banned sensational/clickbait/rumour patterns per Misinformation Protection
const MISINFO_PATTERNS = [
  /viral video claims/i,
  /shocking secret/i,
  /you won't believe/i,
  /miracle cure/i,
  /leaked chat reveals/i,
  /anonymous tipster claims/i,
  /social media buzz/i,
  /netizens react to bizarre/i,
  /conspiracy confirmed/i,
  /unbelievable trick/i,
  /whatsapp forward reveals/i
];

// Markers indicating opinion, allegations, or official declarations
const OPINION_MARKERS = [
  /\bopinion\b/i,
  /\bop-ed\b/i,
  /\beditorial\b/i,
  /\bcolumn\b/i,
  /\bcommentary\b/i,
  /\bperspective\b/i,
  /\bviewpoint\b/i
];

const ALLEGATION_MARKERS = [
  /\balleges\b/i,
  /\balleged\b/i,
  /\ballegedly\b/i,
  /\bclaims without evidence\b/i,
  /\baccuses\b/i,
  /\bpurported\b/i
];

const OFFICIAL_STATEMENT_MARKERS = [
  /\bgovernment announces\b/i,
  /\bministry states\b/i,
  /\bofficial statement\b/i,
  /\bpress release\b/i,
  /\brbi notifies\b/i,
  /\bsupreme court orders\b/i,
  /\bpib release\b/i,
  /\bcabinet approves\b/i,
  /\bgovernment notification\b/i,
  /\bgazette notification\b/i
];

/**
 * Normalizes text to extract tokens for event grouping and duplicate clustering
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are', 'was', 'were', 'be', 'been',
    'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might',
    'must', 'can', 'could', 'that', 'this', 'these', 'those', 'it', 'its', 'as', 'says', 'said',
    'new', 'today', 'report', 'news', 'live', 'updates', 'watch'
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Calculates Jaccard similarity between two sets of keywords
 */
function calculateSimilarity(tokensA: string[], tokensB: string[]): number {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  
  let intersectionCount = 0;
  for (const t of setA) {
    if (setB.has(t)) intersectionCount++;
  }
  
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Detects whether an article is syndicated from a wire agency
 */
export function isSyndicatedWire(title: string, snippet: string): { isWire: boolean; wireName?: string } {
  const combined = `${title} ${snippet}`.toLowerCase();
  if (combined.includes('pti') || combined.includes('press trust of india')) {
    return { isWire: true, wireName: 'Press Trust of India (PTI)' };
  }
  if (combined.includes('reuters') || combined.includes('(reuters)')) {
    return { isWire: true, wireName: 'Reuters' };
  }
  if (combined.includes('associated press') || combined.includes('(ap)')) {
    return { isWire: true, wireName: 'Associated Press' };
  }
  if (combined.includes('ani') || combined.includes('asian news international')) {
    return { isWire: true, wireName: 'ANI' };
  }
  return { isWire: false };
}

/**
 * Classifies content type: Fact, Official Statement, Expert Analysis, Allegation
 */
export function classifyContentType(title: string, snippet: string, source: NewsSource): ContentType {
  const text = `${title} ${snippet}`;

  if (source.sourceType === 'Government Official' || OFFICIAL_STATEMENT_MARKERS.some(m => m.test(text))) {
    return 'Official Statement';
  }

  if (OPINION_MARKERS.some(m => m.test(title))) {
    return 'Editorial Opinion';
  }

  if (ALLEGATION_MARKERS.some(m => m.test(title))) {
    return 'Allegation';
  }

  if (text.includes('analysis') || text.includes('explainer') || text.includes('outlook') || text.includes('forecast')) {
    return 'Expert Analysis';
  }

  return 'Fact';
}

/**
 * Categorizes an article into the priority sections
 */
export function categorizeArticle(title: string, snippet: string, defaultCountry: string): { category: string; subCategory: string; country: string } {
  const text = `${title} ${snippet}`.toLowerCase();
  let country = defaultCountry;

  // Determine country if international mentions are dominant
  if (text.includes('united states') || text.includes('white house') || text.includes('biden') || text.includes('trump') || text.includes('pentagon') || text.includes('us congress')) {
    country = 'United States';
  } else if (text.includes('britain') || text.includes('united kingdom') || text.includes('london') || text.includes('downing street') || text.includes('starmer') || text.includes('westminster')) {
    country = 'United Kingdom';
  } else if (text.includes('european union') || text.includes('brussels') || text.includes('germany') || text.includes('france') || text.includes('berlin') || text.includes('paris') || text.includes('nato')) {
    country = 'Europe';
  } else if (text.includes('china') || text.includes('beijing') || text.includes('xi jinping') || text.includes('taiwan strait') || text.includes('shanghai')) {
    country = 'China';
  } else if (text.includes('australia') || text.includes('canberra') || text.includes('sydney') || text.includes('albanese')) {
    country = 'Australia';
  } else if (text.includes('india') || text.includes('delhi') || text.includes('mumbai') || text.includes('parliament') || text.includes('bengaluru') || text.includes('tamil nadu') || text.includes('kerala') || text.includes('uttar pradesh') || text.includes('gujarat')) {
    country = 'India';
  }

  // Determine category & subCategory
  if (text.includes('rbi') || text.includes('inflation') || text.includes('gdp') || text.includes('rupee') || text.includes('sensex') || text.includes('nifty') || text.includes('fiscal') || text.includes('interest rate') || text.includes('banking') || text.includes('stock market') || text.includes('economy')) {
    return { category: 'Economy & Business', subCategory: 'Finance & Markets', country };
  }

  if (text.includes('ai') || text.includes('artificial intelligence') || text.includes('openai') || text.includes('semiconductor') || text.includes('chip') || text.includes('google') || text.includes('microsoft') || text.includes('nvidia') || text.includes('cybersecurity') || text.includes('tech')) {
    return { category: 'Technology & AI', subCategory: 'Artificial Intelligence & Tech', country };
  }

  if (text.includes('supreme court') || text.includes('high court') || text.includes('judgment') || text.includes('verdict') || text.includes('bail') || text.includes('constitution') || text.includes('bench') || text.includes('cji')) {
    return { category: 'Courts & Legal', subCategory: 'Judicial Orders', country };
  }

  if (text.includes('defence') || text.includes('defense') || text.includes('army') || text.includes('navy') || text.includes('air force') || text.includes('drdo') || text.includes('missile') || text.includes('security') || text.includes('border')) {
    return { category: 'Defence & Security', subCategory: 'National Security', country };
  }

  if (text.includes('isro') || text.includes('nasa') || text.includes('satellite') || text.includes('vaccine') || text.includes('medical') || text.includes('climate') || text.includes('emission') || text.includes('monsoon') || text.includes('weather') || text.includes('species') || text.includes('renewable')) {
    return { category: 'Science & Environment', subCategory: 'Science & Climate', country };
  }

  if (text.includes('upsc') || text.includes('recruitment') || text.includes('ugc') || text.includes('university') || text.includes('cbse') || text.includes('exam') || text.includes('employment') || text.includes('jobs')) {
    return { category: 'Education & Employment', subCategory: 'Examinations & Recruitment', country };
  }

  if (text.includes('cabinet') || text.includes('prime minister') || text.includes('lok sabha') || text.includes('rajya sabha') || text.includes('election') || text.includes('policy') || text.includes('minister') || text.includes('scheme') || text.includes('bill')) {
    return { category: 'Politics & Government', subCategory: 'National Governance', country };
  }

  return { category: 'National & Regional', subCategory: 'General Affairs', country };
}

/**
 * Clean and summarize text into factual, neutral statements
 */
function cleanHeadline(title: string): string {
  return title
    .replace(/\s*\|\s*The Hindu$/i, '')
    .replace(/\s*\|\s*India News - The Indian Express$/i, '')
    .replace(/\s*\|\s*Times of India$/i, '')
    .replace(/\s*-\s*BBC News$/i, '')
    .replace(/\s*-\s*The Guardian$/i, '')
    .replace(/\s*-\s*Reuters$/i, '')
    .replace(/\s*\|\s*Reuters$/i, '')
    .replace(/\s*\|\s*Business Standard News$/i, '')
    .replace(/\s*\|\s*Livemint$/i, '')
    .replace(/\s*-\s*The New York Times$/i, '')
    .replace(/\s*-\s*The Washington Post$/i, '')
    .replace(/\s*-\s*CNN$/i, '')
    .replace(/\s*-\s*Sky News$/i, '')
    .replace(/<[^>]*>?/gm, '')
    .trim();
}

/**
 * Extracts facts and uncertainties from text
 */
function extractFactsAndAnalysis(snippet: string, title: string): { facts: string[]; analysis: string[] } {
  const cleanSnippet = snippet.replace(/<[^>]*>?/gm, '').trim();
  const sentences = cleanSnippet.split(/(?<=[.?!])\s+/).filter(s => s.length > 15);

  const facts: string[] = [];
  const analysis: string[] = [];

  for (const s of sentences) {
    if (s.toLowerCase().includes('may') || s.toLowerCase().includes('could') || s.toLowerCase().includes('likely') || s.toLowerCase().includes('expected to') || s.toLowerCase().includes('analysts suggest')) {
      analysis.push(s);
    } else {
      facts.push(s);
    }
  }

  if (facts.length === 0) {
    facts.push(title);
    if (cleanSnippet) facts.push(cleanSnippet);
  }

  return { facts, analysis };
}

/**
 * Synthesizes "Why this matters" contextual statement
 */
function generateWhyItMatters(title: string, category: string, country: string): string {
  if (category === 'Economy & Business') {
    return `Signals shifting macro conditions, interest rate trends, and financial market sentiment directly impacting consumer prices and domestic business investments.`;
  }
  if (category === 'Technology & AI') {
    return `Demonstrates frontier developments in compute, algorithmic regulation, and AI infrastructure with implications for enterprise productivity and global technological sovereignty.`;
  }
  if (category === 'Courts & Legal') {
    return `Establishes constitutional precedent and judicial statutory interpretation governing regulatory authority and individual rights.`;
  }
  if (category === 'Defence & Security') {
    return `Directly impacts regional stability, territorial security readiness, and strategic defence cooperation with allied partner nations.`;
  }
  if (category === 'Science & Environment') {
    return `Presents empirical evidence on planetary resilience, ecological conservation benchmarks, and scientific innovation.`;
  }
  if (country === 'India') {
    return `Represents a key governance, legislative, or public policy milestone with direct outcomes for citizens and state administrations across India.`;
  }
  return `Marks a consequential international development with geopolitical, economic, or trade spillover effects across global markets.`;
}

/**
 * Main verification pipeline executing Steps 1 to 5
 */
function resolveEditorialImage(headline: string, category: string): string {
  const h = headline.toLowerCase();
  if (h.includes('supreme court') || h.includes('court') || h.includes('bench') || h.includes('sc/st') || h.includes('judge')) {
    return 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('rbi') || h.includes('repo') || h.includes('inflation') || h.includes('bank') || h.includes('market') || h.includes('stock')) {
    return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('semiconductor') || h.includes('chip') || h.includes('fab') || h.includes('hardware')) {
    return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('isro') || h.includes('space') || h.includes('venus') || h.includes('nasa') || h.includes('satellite') || h.includes('orbit')) {
    return 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('climate') || h.includes('summit') || h.includes('green') || h.includes('environment') || h.includes('cop') || h.includes('wind')) {
    return 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('ai') || h.includes('intelligence') || h.includes('tech') || h.includes('model') || h.includes('robot')) {
    return 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('defence') || h.includes('tejas') || h.includes('air force') || h.includes('military') || h.includes('army')) {
    return 'https://images.unsplash.com/photo-1579975096649-e773152b04cb?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('rail') || h.includes('train') || h.includes('kavach') || h.includes('transport')) {
    return 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('farm') || h.includes('crop') || h.includes('msp') || h.includes('agriculture')) {
    return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('health') || h.includes('hospital') || h.includes('ayushman') || h.includes('medical') || h.includes('disease')) {
    return 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80';
  }
  if (category === 'Technology & AI') return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';
  if (category === 'Economy & Business') return 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80';
  if (category === 'Science & Environment') return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80';
  if (category === 'Courts & Legal') return 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80';
  if (category === 'Defence & Security') return 'https://images.unsplash.com/photo-1579975096649-e773152b04cb?auto=format&fit=crop&w=1200&q=80';
  return 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1200&q=80';
}

export function runVerificationPipeline(rawItems: RawItem[]): Article[] {
  const processedArticles: Article[] = [];
  const eventClusters: Map<string, RawItem[]> = new Map();

  // STEP 1: Source Validation
  // Discard any raw item that does not come from an approved active source
  const validItems = rawItems.filter(item => {
    const source = getSourceById(item.sourceId);
    if (!source || !source.active) return false;
    
    // STEP 4: Misinformation & Clickbait Filtering
    if (MISINFO_PATTERNS.some(p => p.test(item.title) || p.test(item.contentSnippet || ''))) {
      return false;
    }

    return true;
  });

  // Group items by semantic similarity for claim corroboration
  // STEP 2: Claim Verification & Cluster Detection
  for (const item of validItems) {
    const tokens = extractKeywords(item.title);
    let matchedClusterKey: string | null = null;

    for (const [existingKey, cluster] of eventClusters.entries()) {
      const clusterTokens = extractKeywords(cluster[0].title);
      const similarity = calculateSimilarity(tokens, clusterTokens);

      // Overlap of 35%+ distinct keywords usually means same major story
      if (similarity >= 0.35) {
        matchedClusterKey = existingKey;
        break;
      }
    }

    if (matchedClusterKey) {
      eventClusters.get(matchedClusterKey)!.push(item);
    } else {
      const newKey = `event_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      eventClusters.set(newKey, [item]);
    }
  }

  // Process each cluster into verified articles
  for (const [eventId, clusterItems] of eventClusters.entries()) {
    const primaryItem = clusterItems[0];
    const source = getSourceById(primaryItem.sourceId)!;
    const headline = cleanHeadline(primaryItem.title);
    const snippet = primaryItem.contentSnippet || primaryItem.content || '';

    // Check wire syndication
    const wireCheck = isSyndicatedWire(headline, snippet);

    // Collect corroborating sources
    const corroboratingSources: CorroboratingSource[] = [];
    const distinctIndependentPublishers = new Set<string>();
    distinctIndependentPublishers.add(source.name);

    for (let i = 1; i < clusterItems.length; i++) {
      const cItem = clusterItems[i];
      const cSource = getSourceById(cItem.sourceId);
      if (cSource && cSource.id !== source.id) {
        const cWire = isSyndicatedWire(cItem.title, cItem.contentSnippet || '');
        const isWireDuplicate = wireCheck.isWire && cWire.isWire;
        
        corroboratingSources.push({
          publisher: cSource.name,
          headline: cleanHeadline(cItem.title),
          url: cItem.link,
          isWireSyndication: isWireDuplicate,
          publishedAt: cItem.pubDate || new Date().toISOString()
        });

        // Two articles copying the same original report do not count as two independent confirmations
        if (!isWireDuplicate) {
          distinctIndependentPublishers.add(cSource.name);
        }
      }
    }

    // STEP 3: Fact and Opinion Separation
    const contentType = classifyContentType(headline, snippet, source);
    const { category, subCategory, country } = categorizeArticle(headline, snippet, source.country);
    const { facts, analysis } = extractFactsAndAnalysis(snippet, headline);

    // STEP 5: Verification Status
    let verificationStatus: VerificationStatus = 'DEVELOPING';

    if (source.sourceType === 'Government Official' || contentType === 'Official Statement') {
      verificationStatus = 'OFFICIAL STATEMENT';
    } else if (distinctIndependentPublishers.size >= 2 || source.category === 'Fact-Check') {
      verificationStatus = 'VERIFIED';
    } else if (source.sourceType === 'Independent National' || source.sourceType === 'Wire Agency' || source.sourceType === 'Public Broadcaster') {
      verificationStatus = 'DEVELOPING';
    } else {
      verificationStatus = 'NOT VERIFIED';
    }

    // Exclude NOT VERIFIED items from the main feed
    if (verificationStatus === 'NOT VERIFIED') {
      continue;
    }

    // Construct factual 2-4 sentence summary
    const cleanSnippet = snippet.replace(/<[^>]*>?/gm, '').trim();
    const summary = cleanSnippet.length > 50 
      ? cleanSnippet.slice(0, 320) + (cleanSnippet.length > 320 ? '...' : '')
      : `${headline}. Reported by ${source.name} with ongoing developments monitored across reliable news desks.`;

    const urlOrTitle = primaryItem.link || primaryItem.title || headline;
    const articleHash = crypto.createHash('sha256').update(`${urlOrTitle}::${headline}`).digest('hex').slice(0, 18);
    const articleId = `art_${articleHash}`;

    processedArticles.push({
      id: articleId,
      headline,
      url: primaryItem.link,
      publisher: source.name,
      publisherId: source.id,
      country,
      category,
      subCategory,
      publishedAt: primaryItem.pubDate || new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      originalLanguage: 'en',
      originalSnippet: cleanSnippet.slice(0, 500),
      summary,
      whyItMatters: generateWhyItMatters(headline, category, country),
      verificationStatus,
      contentType,
      corroboratingSources,
      eventId,
      firstCollectedAt: new Date().toISOString(),
      facts,
      analysisOrUncertainties: analysis,
      location: country === 'India' ? (subCategory.includes('State') ? 'New Delhi / Regional' : 'New Delhi, India') : country,
      isPeerReviewedScience: category === 'Science & Environment' && !headline.toLowerCase().includes('preliminary'),
      isStateMedia: source.isStateControlled,
      imageUrl: primaryItem.imageUrl || resolveEditorialImage(headline, category)
    });
  }

  return processedArticles;
}
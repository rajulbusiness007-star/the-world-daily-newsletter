/**
 * High-quality curated news imagery mapping for The World Daily.
 * Provides authentic, high-resolution editorial photography for all categories and topics.
 * Includes resilient fallbacks to ensure Zero-Broken-Image Policy.
 */

// Category to reliable editorial photo mapping
export const CATEGORY_IMAGE_MAP: Record<string, string[]> = {
  'Courts & Legal': [
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80', // Supreme court / gavel / law
    'https://images.unsplash.com/photo-1479142506502-19b3a3b7ff33?auto=format&fit=crop&w=1200&q=80', // Legal pillars / justice
    'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1200&q=80'  // Law library / books
  ],
  'Economy & Business': [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80', // Financial markets / stock board
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80', // Currencies / banking
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80', // Trading charts / bull
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'  // Corporate headquarters
  ],
  'Technology & AI': [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', // Semiconductor / chip wafer
    'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80', // Artificial intelligence / neural
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80', // Robotics / tech
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80'  // Datacenter / cyber
  ],
  'Science & Environment': [
    'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?auto=format&fit=crop&w=1200&q=80', // Space / rocket launch / ISRO
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80', // Earth / satellite view
    'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80', // Wind turbines / renewable clean energy
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80'  // Science laboratory / research
  ],
  'Defence & Security': [
    'https://images.unsplash.com/photo-1579975096649-e773152b04cb?auto=format&fit=crop&w=1200&q=80', // Jet fighter aircraft
    'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80', // Aviation / radar
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80'  // National logistics / transport
  ],
  'Politics & Government': [
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80', // Parliament / assembly dome
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80', // International flags / summit
    'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=1200&q=80'  // Press conference / podium
  ],
  'National & Regional': [
    'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1200&q=80', // India Gate / New Delhi
    'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1200&q=80', // High speed train / railway
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80', // Agricultural fields / harvest
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80'  // Healthcare hospital
  ],
  'Education & Employment': [
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80', // University / students
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80', // Examination / study
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80'  // Career / corporate
  ]
};

// Fallback image generator
export function getArticleImageUrl(article: {
  id?: string;
  category?: string;
  headline?: string;
  imageUrl?: string;
}): string {
  if (article.imageUrl && article.imageUrl.startsWith('http')) {
    return article.imageUrl;
  }

  const h = (article.headline || '').toLowerCase();
  const c = article.category || 'National & Regional';

  // Keyword-specific images for highest relevance
  if (h.includes('supreme court') || h.includes('sc/st') || h.includes('bench') || h.includes('verdict')) {
    return 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('rbi') || h.includes('repo rate') || h.includes('monetary policy') || h.includes('inflation')) {
    return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('semiconductor') || h.includes('chip') || h.includes('dholera') || h.includes('tata')) {
    return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('isro') || h.includes('shukrayaan') || h.includes('venus') || h.includes('space') || h.includes('chandrayaan')) {
    return 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('climate') || h.includes('summit') || h.includes('green') || h.includes('emission')) {
    return 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('ai') || h.includes('nvidia') || h.includes('blackwell') || h.includes('model') || h.includes('algorithm')) {
    return 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('tejas') || h.includes('iaf') || h.includes('fighter') || h.includes('defence')) {
    return 'https://images.unsplash.com/photo-1579975096649-e773152b04cb?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('rail') || h.includes('train') || h.includes('kavach') || h.includes('track')) {
    return 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('farmer') || h.includes('msp') || h.includes('agriculture') || h.includes('crop')) {
    return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('ayushman') || h.includes('health') || h.includes('senior') || h.includes('hospital')) {
    return 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('upsc') || h.includes('exam') || h.includes('education') || h.includes('student')) {
    return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('fed') || h.includes('interest rate') || h.includes('stock') || h.includes('market')) {
    return 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80';
  }
  if (h.includes('british energy') || h.includes('wind') || h.includes('solar')) {
    return 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80';
  }

  // Fallback to Category List
  const pool = CATEGORY_IMAGE_MAP[c] || CATEGORY_IMAGE_MAP['National & Regional'];
  // Deterministic index from article ID or headline
  const seedStr = (article.id || article.headline || 'news');
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}

// Global Image Component with automatic fallback protection
export const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80'; // Newspaper / journalism press

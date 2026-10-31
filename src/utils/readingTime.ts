/**
 * Calculates estimated Time to Read in minutes based on word count.
 * Uses the industry standard average reading speed of 200 words per minute (WPM).
 */

export const WORDS_PER_MINUTE = 200;

export interface ArticleTextContent {
  headline?: string;
  summary?: string;
  whyItMatters?: string;
  facts?: string[];
  analysisOrUncertainties?: string[];
}

/**
 * Extracts all readable text from an article or article-like object.
 */
export function extractArticleText(article: ArticleTextContent): string {
  const parts: string[] = [];
  if (article.headline) parts.push(article.headline);
  if (article.summary) parts.push(article.summary);
  if (article.whyItMatters) parts.push(article.whyItMatters);
  if (article.facts && Array.isArray(article.facts)) parts.push(...article.facts);
  if (article.analysisOrUncertainties && Array.isArray(article.analysisOrUncertainties)) {
    parts.push(...article.analysisOrUncertainties);
  }
  return parts.filter(Boolean).join(' ');
}

/**
 * Counts total words from any given text string.
 */
export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Calculates raw integer reading time in minutes (minimum 1 minute),
 * based on 200 words per minute.
 */
export function getReadingTimeMinutes(
  input: string | ArticleTextContent | null | undefined,
  additionalContext?: string[]
): number {
  if (!input) return 1;

  let fullText = '';
  if (typeof input === 'string') {
    fullText = [input, ...(additionalContext || [])].filter(Boolean).join(' ');
  } else {
    const articleText = extractArticleText(input);
    fullText = [articleText, ...(additionalContext || [])].filter(Boolean).join(' ');
  }

  const words = countWords(fullText);
  // Based on an average reading speed of 200 words per minute, rounded up with 1 min floor
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/**
 * Returns formatted reading time string, e.g. "1 min read" or "3 min read".
 * Works with both plain text strings and full Article objects.
 * Based on 200 words per minute.
 */
export function getReadingTime(
  input: string | ArticleTextContent | null | undefined,
  additionalContext?: string[]
): string {
  const minutes = getReadingTimeMinutes(input, additionalContext);
  return `${minutes} min read`;
}

/**
 * Explicit helper to compute estimated reading time for a full article object.
 * Incorporates headline, summary, analysis, and corroborating facts at 200 WPM.
 */
export function getArticleReadingTime(
  article: ArticleTextContent | null | undefined,
  additionalContext?: string[]
): string {
  return getReadingTime(article, additionalContext);
}

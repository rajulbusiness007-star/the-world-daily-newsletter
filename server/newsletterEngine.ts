import { Article, DailyEdition } from './types.js';
import { generateBiggerPicture, generateFiveThingsToRemember } from './geminiService.js';

/**
 * Gets current date formatted as YYYY-MM-DD in Asia/Kolkata timezone
 */
export function getTodayISTDateString(): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  return formatter.format(new Date()); // Outputs YYYY-MM-DD
}

/**
 * Gets formatted human-readable date in IST (e.g., "Friday, 31 October 2026")
 */
export function getFormattedISTDate(): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return new Intl.DateTimeFormat('en-IN', options).format(new Date());
}

/**
 * Compiles a complete DailyEdition matching all prompt specifications
 */
export async function buildDailyEdition(articles: Article[], existingEditionsCount: number = 0): Promise<DailyEdition> {
  const dateStr = getTodayISTDateString();
  const formattedDate = getFormattedISTDate();

  // Separate India articles from World articles
  const indiaArticles = articles.filter(a => a.country === 'India');
  const worldArticles = articles.filter(a => a.country !== 'India');

  // Target ratio: ~60% India, ~40% World
  const total = articles.length;
  const indiaRatio = total > 0 ? Number((indiaArticles.length / total).toFixed(2)) : 0.60;
  const worldRatio = total > 0 ? Number((worldArticles.length / total).toFixed(2)) : 0.40;

  // SECTION A: India — Today's Top News (10 most important)
  // Sort prioritized by VERIFIED status first, then recency
  const sortedIndia = [...indiaArticles].sort((a, b) => {
    if (a.verificationStatus === 'VERIFIED' && b.verificationStatus !== 'VERIFIED') return -1;
    if (b.verificationStatus === 'VERIFIED' && a.verificationStatus !== 'VERIFIED') return 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
  const sectionA_IndiaTop10 = sortedIndia.slice(0, 10);

  // SECTION B: India — Detailed Coverage by category
  const sectionB_IndiaDetailed = {
    politicsAndGovernment: indiaArticles.filter(a => a.category === 'Politics & Government' || a.subCategory?.includes('Governance')),
    economyAndBusiness: indiaArticles.filter(a => a.category === 'Economy & Business' || a.subCategory?.includes('Finance')),
    technologyAndAI: indiaArticles.filter(a => a.category === 'Technology & AI'),
    courtsAndLegal: indiaArticles.filter(a => a.category === 'Courts & Legal' || a.subCategory?.includes('Judicial')),
    educationAndEmployment: indiaArticles.filter(a => a.category === 'Education & Employment'),
    defenceAndSecurity: indiaArticles.filter(a => a.category === 'Defence & Security'),
    scienceAndHealthcare: indiaArticles.filter(a => a.category === 'Science & Environment' || a.subCategory?.includes('Health') || a.subCategory?.includes('Disaster')),
    statesAndRegional: indiaArticles.filter(a => a.category === 'National & Regional' || (a.stateOrRegion && a.stateOrRegion !== 'National'))
  };

  // SECTION C: World — Top International News
  const sectionC_WorldTop = {
    unitedStates: worldArticles.filter(a => a.country === 'United States' || a.publisherId === 'cnn' || a.publisherId === 'ap-news'),
    unitedKingdom: worldArticles.filter(a => a.country === 'United Kingdom' || a.publisherId === 'bbc-news' || a.publisherId === 'the-guardian'),
    europe: worldArticles.filter(a => a.country === 'Europe' || a.country === 'Germany' || a.country === 'France' || a.publisherId === 'dw' || a.publisherId === 'france-24'),
    china: worldArticles.filter(a => a.country === 'China' || a.publisherId === 'scmp' || a.publisherId === 'xinhua'),
    australia: worldArticles.filter(a => a.country === 'Australia' || a.publisherId === 'abc-australia'),
    asiaPacific: worldArticles.filter(a => a.country === 'Japan' || a.country === 'Singapore' || a.country === 'South Korea' || a.publisherId === 'nikkei-asia' || a.publisherId === 'nhk-world'),
    middleEast: worldArticles.filter(a => a.country === 'Middle East' || a.country === 'Israel' || a.country === 'Saudi Arabia' || a.publisherId === 'al-jazeera'),
    otherGlobal: worldArticles.filter(a => !['United States', 'United Kingdom', 'Europe', 'China', 'Australia', 'Japan', 'Middle East'].includes(a.country) && !['cnn', 'bbc-news', 'al-jazeera', 'dw', 'france-24'].includes(a.publisherId))
  };

  // SECTION D: World Economy and Business
  const sectionD_WorldEconomy = worldArticles.filter(a => a.category === 'Economy & Business' || a.subCategory?.includes('Central Banks') || a.subCategory?.includes('Trade') || a.subCategory?.includes('Finance'));

  // SECTION E: Technology and AI
  const sectionE_TechAndAI = articles.filter(a => a.category === 'Technology & AI' || a.headline.toLowerCase().includes('ai') || a.headline.toLowerCase().includes('nvidia') || a.headline.toLowerCase().includes('semiconductor') || a.subCategory?.includes('AI'));

  // SECTION F: Science, Climate and Environment
  const sectionF_ScienceAndClimate = articles.filter(a => a.category === 'Science & Environment' || a.subCategory?.includes('Clean Energy') || a.subCategory?.includes('Climate') || a.subCategory?.includes('Nuclear Fusion'));

  // SECTION G: The Bigger Picture (AI-synthesized daily editorial explainer)
  const topForExplainer = [...sectionA_IndiaTop10, ...worldArticles.slice(0, 3)];
  const sectionG_TheBiggerPicture = await generateBiggerPicture(topForExplainer);

  // SECTION H: Five Things to Remember Today
  const sectionH_FiveThingsToRemember = await generateFiveThingsToRemember(topForExplainer);

  // Connected Trusted Outlets Summary for Newsletter Readers
  const trustedOutletsCatalog = [
    { outletId: 'indian-express', outletName: 'The Indian Express', country: 'India', badge: 'National Record' },
    { outletId: 'bbc-news', outletName: 'BBC News', country: 'United Kingdom', badge: 'Public Broadcaster' },
    { outletId: 'cnn', outletName: 'CNN International', country: 'United States', badge: '24/7 Global Desk' },
    { outletId: 'al-jazeera', outletName: 'Al Jazeera English', country: 'Global / M.E.', badge: 'In-Depth Global' },
    { outletId: 'reuters', outletName: 'Reuters', country: 'United States', badge: 'Wire Agency' },
    { outletId: 'the-hindu', outletName: 'The Hindu', country: 'India', badge: 'Paper of Record' },
    { outletId: 'ap-news', outletName: 'Associated Press', country: 'United States', badge: 'Wire Cooperative' },
    { outletId: 'the-guardian', outletName: 'The Guardian', country: 'United Kingdom', badge: 'Independent Trust' },
    { outletId: 'financial-times', outletName: 'Financial Times', country: 'United Kingdom', badge: 'Global Finance' }
  ];

  const connectedOutletsSummary = trustedOutletsCatalog.map(outlet => {
    const matchingArticles = articles.filter(a => 
      a.publisherId === outlet.outletId || 
      a.publisher.toLowerCase().includes(outlet.outletName.toLowerCase())
    );
    return {
      ...outlet,
      articleCount: matchingArticles.length
    };
  });

  return {
    date: dateStr,
    formattedDate,
    generatedAt: new Date().toISOString(),
    editionNumber: existingEditionsCount + 1,
    totalArticles: articles.length,
    indiaRatio,
    worldRatio,
    sectionA_IndiaTop10,
    sectionB_IndiaDetailed,
    sectionC_WorldTop,
    sectionD_WorldEconomy,
    sectionE_TechAndAI,
    sectionF_ScienceAndClimate,
    sectionG_TheBiggerPicture,
    sectionH_FiveThingsToRemember,
    connectedOutletsSummary
  };
}

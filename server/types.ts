export type VerificationStatus = 'VERIFIED' | 'OFFICIAL STATEMENT' | 'DEVELOPING' | 'NOT VERIFIED';

export type ContentType = 
  | 'Fact'
  | 'Official Statement'
  | 'Expert Analysis'
  | 'Editorial Opinion'
  | 'Allegation'
  | 'Developing Report';

export type SourceType = 
  | 'Independent National'
  | 'Independent Financial'
  | 'Wire Agency'
  | 'Public Broadcaster'
  | 'Government Official'
  | 'Fact Checker'
  | 'State-Controlled Media';

export interface NewsSource {
  id: string;
  name: string;
  website: string;
  country: 'India' | 'United States' | 'United Kingdom' | 'Europe' | 'Australia' | 'China' | 'Japan' | 'Global' | string;
  category: 'National' | 'Financial' | 'International' | 'Official' | 'Fact-Check';
  ownership: string;
  funding: string;
  sourceType: SourceType;
  editorialStandardsUrl?: string;
  rssUrl?: string;
  active: boolean;
  isStateControlled: boolean;
  requiresLicensingOrApi?: boolean;
}

export interface CorroboratingSource {
  publisher: string;
  headline: string;
  url: string;
  isWireSyndication?: boolean;
  publishedAt: string;
}

export interface Article {
  id: string;
  headline: string;
  url: string;
  publisher: string;
  publisherId: string;
  country: string;
  stateOrRegion?: string;
  category: string;
  subCategory?: string;
  publishedAt: string;
  lastUpdatedAt: string;
  originalLanguage: string;
  originalSnippet: string;
  summary: string;
  whyItMatters: string;
  verificationStatus: VerificationStatus;
  contentType: ContentType;
  corroboratingSources: CorroboratingSource[];
  eventId: string;
  firstCollectedAt: string;
  facts: string[];
  analysisOrUncertainties: string[];
  location?: string;
  isPeerReviewedScience?: boolean;
  isStateMedia: boolean;
  imageUrl?: string;
}

export interface DailyBiggerPicture {
  headline: string;
  whatHappened: string;
  whyDidItHappen: string;
  whatIsConfirmed: string[];
  whatIsStillUncertain: string[];
  whatCouldHappenNext: string;
  whyIndianReadersCare: string;
}

export interface DailyEdition {
  date: string; // YYYY-MM-DD in IST
  formattedDate: string;
  generatedAt: string;
  editionNumber: number;
  totalArticles: number;
  indiaRatio: number; // e.g. 0.60
  worldRatio: number; // e.g. 0.40
  
  // Section A: India — Today's Top News (10 most important)
  sectionA_IndiaTop10: Article[];
  
  // Section B: India — Detailed Coverage by category
  sectionB_IndiaDetailed: {
    politicsAndGovernment: Article[];
    economyAndBusiness: Article[];
    technologyAndAI: Article[];
    courtsAndLegal: Article[];
    educationAndEmployment: Article[];
    defenceAndSecurity: Article[];
    scienceAndHealthcare: Article[];
    statesAndRegional: Article[];
  };
  
  // Section C: World — Top International News
  sectionC_WorldTop: {
    unitedStates: Article[];
    unitedKingdom: Article[];
    europe: Article[];
    china: Article[];
    australia: Article[];
    asiaPacific: Article[];
    middleEast: Article[];
    otherGlobal: Article[];
  };
  
  // Section D: World Economy and Business
  sectionD_WorldEconomy: Article[];
  
  // Section E: Technology and AI
  sectionE_TechAndAI: Article[];
  
  // Section F: Science, Climate and Environment
  sectionF_ScienceAndClimate: Article[];
  
  // Section G: The Bigger Picture
  sectionG_TheBiggerPicture: DailyBiggerPicture;
  
  // Section H: Five Things to Remember Today
  sectionH_FiveThingsToRemember: string[];

  // Connected Outlets Summary
  connectedOutletsSummary?: {
    outletId: string;
    outletName: string;
    country: string;
    articleCount: number;
    badge: string;
  }[];
}

export interface SystemHealth {
  schedulerRunning: boolean;
  schedulerType: string;
  lastSuccessfulUpdate: string;
  nextScheduledUpdate: string;
  totalArticlesInDatabase: number;
  activeFeedCount: number;
  totalSourcesConfigured: number;
  failedFeeds: {
    sourceId: string;
    sourceName: string;
    error: string;
    lastAttempt: string;
  }[];
  recentIngestionLogs: {
    timestamp: string;
    message: string;
    level: 'info' | 'warn' | 'error';
    articlesAdded?: number;
  }[];
}

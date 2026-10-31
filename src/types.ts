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
  country: string;
  category: string;
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
  date: string;
  formattedDate: string;
  generatedAt: string;
  editionNumber: number;
  totalArticles: number;
  indiaRatio: number;
  worldRatio: number;
  sectionA_IndiaTop10: Article[];
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
  sectionD_WorldEconomy: Article[];
  sectionE_TechAndAI: Article[];
  sectionF_ScienceAndClimate: Article[];
  sectionG_TheBiggerPicture: DailyBiggerPicture;
  sectionH_FiveThingsToRemember: string[];
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

export interface ArchiveItem {
  date: string;
  formattedDate: string;
  editionNumber: number;
  totalArticles: number;
  indiaRatio: number;
  worldRatio: number;
  leadHeadline: string;
}

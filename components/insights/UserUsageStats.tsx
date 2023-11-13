import { UsagePeriod } from '@/types/types';

export type ProjectUsageStats = {
  name: string;
  slug: string;
  numEmbeddingTokens: number;
  numFiles: number;
  numSections: number;
  latestQuestions: string[];
  unansweredQuestions: string[];
  numQuestionsAsked: number;
  numQuestionsUnanswered: number;
  numQuestionsDownvoted: number;
  numQuestionsUpvoted: number;
  mostCitedSources: string[];
};

export type TeamUsageStats = {
  name: string;
  slug: string;
  tierName: string;
  usagePeriod: UsagePeriod;
  numAllowedEmbeddings: number;
  projectUsageStats: ProjectUsageStats[];
};

export type UserUsageStats = {
  teamUsageStats: TeamUsageStats[];
};

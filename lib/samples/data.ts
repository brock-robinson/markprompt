import { UserUsageStats } from '@/components/insights/UserUsageStats';

export const sampleUserUsageStats: UserUsageStats = {
  teamUsageStats: [
    {
      name: 'Markprompt',
      slug: 'sample-team-slug',
      tierName: 'Pro',
      usagePeriod: 'monthly',
      numAllowedEmbeddings: 1_000_000,
      projectUsageStats: [
        {
          name: 'Docs',
          slug: 'sample-project-slug',
          numEmbeddingTokens: 9421,
          numFiles: 199,
          numSections: 401,
          latestQuestions: [
            'What is Markprompt?',
            'What is React?',
            'How can I add Algolia search?',
          ],
          unansweredQuestions: [
            'What is Acme Corp?',
            'What it the weather in Menlo Park?',
          ],
          numQuestionsAsked: 103,
          numQuestionsUnanswered: 21,
          numQuestionsDownvoted: 3,
          numQuestionsUpvoted: 9,
          mostCitedSources: [
            'Home',
            'Getting started',
            'Algolia',
            'Docusaurus',
          ],
        },
        {
          name: 'Sample project 2',
          slug: 'sample-project-slug-2',
          numEmbeddingTokens: 1203,
          numFiles: 234,
          numSections: 401,
          latestQuestions: [],
          unansweredQuestions: [],
          numQuestionsAsked: 103,
          numQuestionsUnanswered: 21,
          numQuestionsDownvoted: 0,
          numQuestionsUpvoted: 0,
          mostCitedSources: ['Welcome'],
        },
      ],
    },
    {
      name: 'Sample team 2',
      slug: 'sample-team-slug-2',
      tierName: 'Pro',
      usagePeriod: 'monthly',
      numAllowedEmbeddings: 1_000_000,
      projectUsageStats: [
        {
          name: 'Sample project 2',
          slug: 'sample-project-slug-2',
          numEmbeddingTokens: 9421,
          numFiles: 199,
          numSections: 401,
          latestQuestions: [],
          unansweredQuestions: [],
          numQuestionsAsked: 103,
          numQuestionsUnanswered: 21,
          numQuestionsDownvoted: 3,
          numQuestionsUpvoted: 9,
          mostCitedSources: [],
        },
      ],
    },
  ],
};
export default sampleUserUsageStats;

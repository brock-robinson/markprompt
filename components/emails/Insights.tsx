import {
  Button,
  Column,
  Container,
  Heading,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from '@react-email/components';
import cn from 'classnames';
import { format } from 'date-fns';
import { FC } from 'react';

import { Wrapper } from './templates/Shared';
import { SocialSection } from './templates/SocialSection';
import { UserUsageStats } from '../insights/UserUsageStats';

type InsightsEmailProps = {
  preview: string;
  withHtml: boolean;
  stats: UserUsageStats;
  from: Date;
  to: Date;
};

// We create the email component as a standalone component, instead of
// creating it in the page itself, to avoid hydration errors (we
// import the component dynamically with SSR = false).
const InsightsEmail: FC<InsightsEmailProps> = ({
  preview,
  withHtml,
  stats,
  from,
  to,
}) => {
  return (
    <Wrapper
      preview={preview}
      bodyClassName="py-8 my-auto mx-auto bg-white font-sans"
      withHtml={withHtml}
    >
      <Container className="mx-auto w-full max-w-[720px] border-separate">
        <Section>
          <Img
            src="https://res.cloudinary.com/djp21wtxm/image/upload/v1689959311/Email_u1tegg.png"
            width={50}
            height={50}
            alt="Markprompt logo"
          />
        </Section>
        <Heading className="mt-8 text-xl font-bold text-neutral-900">
          Weekly report
        </Heading>
        <Text className="mt-4 border-b-0 text-sm text-neutral-600 no-underline">
          {format(from, 'LLL dd')} - {format(to, 'LLL dd, y')}
        </Text>
        <Hr className="mt-8 border-neutral-200" />
        {!stats.teamUsageStats || stats.teamUsageStats.length === 0 ? (
          <Text className="text-sm text-neutral-600">
            You are not a member of any team currently.
          </Text>
        ) : (
          stats.teamUsageStats
            .filter((team) => {
              // Exclude teams with no files in projects
              return team.projectUsageStats.some((p) => p.numFiles > 0);
            })
            .map((team, i) => {
              return (
                <Section key={`team-${i}`}>
                  <Section className={i > 0 ? 'mt-8' : ''}>
                    <Heading className="mt-8 w-min truncate whitespace-nowrap text-lg font-bold text-neutral-900">
                      {team.name}
                    </Heading>
                    <Text className="mb-0 text-sm text-neutral-600">
                      Plan: {team.tierName}
                    </Text>
                    <Text className="mt-2 text-sm text-neutral-600">
                      Projects: {team.projectUsageStats.length || 0}
                    </Text>
                  </Section>
                  {team.projectUsageStats
                    ?.filter((p) => p.numFiles > 0)
                    .map((project, j) => {
                      const answeredPercent = Math.min(
                        100,
                        Math.round(
                          (100 *
                            (project.numQuestionsAsked -
                              project.numQuestionsUnanswered)) /
                            project.numQuestionsAsked,
                        ),
                      );
                      return (
                        <Section
                          key={`team-${i}-project-${j}`}
                          className="mt-4 mb-4 border-separate overflow-hidden rounded-lg border border-solid"
                          style={{
                            background: 'rgb(245, 244, 245)',
                            borderColor: 'rgb(229, 229, 229)',
                            padding: '24px 24px',
                          }}
                        >
                          <Row>
                            <Column>
                              <Heading className="overflow-hidden truncate whitespace-nowrap text-base font-bold text-neutral-900">
                                {project.name}
                              </Heading>
                            </Column>
                            <Column align="right">
                              <Button
                                pX={10}
                                pY={10}
                                className="flex-none rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white no-underline"
                                href={`https://markprompt.com/${team.slug}/${project.slug}`}
                              >
                                View in dashboard
                              </Button>
                            </Column>
                          </Row>
                          <Section
                            className="mt-6 border-separate rounded-md border border-solid p-2"
                            style={{
                              background: 'rgb(250, 250, 250)',
                              borderColor: 'rgb(229, 229, 229)',
                            }}
                          >
                            <Row>
                              <Column className="p-4">
                                <Text className="mx-0 mt-0 mb-2 text-xl">
                                  📄
                                </Text>
                                <Text className="m-0 text-sm font-bold text-neutral-900">
                                  Files
                                </Text>
                                <Text className="m-0 mt-2 text-sm text-neutral-700">
                                  {project.numFiles}
                                </Text>
                              </Column>
                              {project.numQuestionsAsked > 0 && (
                                <Column className="p-4">
                                  <Text className="mx-0 mt-0 mb-2 text-xl">
                                    💬
                                  </Text>
                                  <Text className="m-0 text-sm font-bold text-neutral-900">
                                    Questions
                                  </Text>
                                  <Text className="m-0 mt-2 text-sm text-neutral-700">
                                    {project.numQuestionsAsked}
                                  </Text>
                                </Column>
                              )}
                              {project.numQuestionsAsked >
                                project.numQuestionsUnanswered && (
                                <Column className="p-4">
                                  <Text className="mx-0 mt-0 mb-2 text-xl">
                                    ✅
                                  </Text>
                                  <Text className="m-0 text-sm font-bold text-neutral-900">
                                    Answered
                                  </Text>
                                  <Text className="m-0 mt-2 truncate whitespace-nowrap text-sm text-neutral-700">
                                    {project.numQuestionsAsked -
                                      project.numQuestionsUnanswered}{' '}
                                    <span
                                      className={cn(
                                        'font-semibold text-neutral-500',
                                        {
                                          'text-green-600':
                                            answeredPercent >= 70,
                                          'text-orange-600':
                                            answeredPercent >= 50 &&
                                            answeredPercent < 70,
                                          'text-red-600': answeredPercent < 50,
                                        },
                                      )}
                                    >
                                      ({answeredPercent}%)
                                    </span>
                                  </Text>
                                </Column>
                              )}
                              {project.numQuestionsUpvoted > 0 && (
                                <Column className="px-4">
                                  <Text className="mx-0 mt-0 mb-2 text-xl">
                                    👍
                                  </Text>
                                  <Text className="m-0 text-sm font-bold text-neutral-900">
                                    Upvoted
                                  </Text>
                                  <Text className="m-0 mt-2 text-sm text-neutral-700">
                                    {project.numQuestionsUpvoted}
                                  </Text>
                                </Column>
                              )}
                              {project.numQuestionsDownvoted > 0 && (
                                <Column className="px-4">
                                  <Text className="mx-0 mt-0 mb-2 text-xl">
                                    👎
                                  </Text>
                                  <Text className="m-0 text-sm font-bold text-neutral-900">
                                    Downvoted
                                  </Text>
                                  <Text className="m-0 mt-2 text-sm text-neutral-700">
                                    {project.numQuestionsDownvoted}
                                  </Text>
                                </Column>
                              )}
                            </Row>
                          </Section>
                          {project.latestQuestions?.length > 0 && (
                            <>
                              <Heading className="mt-8 mb-4 w-min truncate whitespace-nowrap text-sm font-bold text-neutral-900">
                                Recent questions{' '}
                                <Link
                                  className="ml-2 text-sm font-normal text-violet-700 underline"
                                  href={`https://markprompt.com/${team.slug}/${project.slug}/insights`}
                                >
                                  See all
                                </Link>
                              </Heading>
                              {project.latestQuestions.map((question, k) => {
                                return (
                                  <Text
                                    key={`team-${i}-project-${j}-question-${k}`}
                                    className="mb-0 mt-2 w-full max-w-[640px] overflow-hidden truncate whitespace-nowrap  text-sm text-neutral-900"
                                  >
                                    • {question}
                                  </Text>
                                );
                              })}
                            </>
                          )}
                          {project.unansweredQuestions?.length > 0 && (
                            <>
                              <Heading className="mt-8 mb-4 w-min truncate whitespace-nowrap text-sm font-bold text-neutral-900">
                                Latest unanswered questions{' '}
                                <Link
                                  className="ml-2 text-sm font-normal text-violet-700 underline"
                                  href={`https://markprompt.com/${team.slug}/${project.slug}/insights`}
                                >
                                  See all
                                </Link>
                              </Heading>
                              {project.unansweredQuestions.map(
                                (question, k) => {
                                  return (
                                    <Text
                                      key={`team-${i}-project-${j}-question-${k}`}
                                      className="mb-0 mt-2 w-full max-w-[640px] overflow-hidden truncate whitespace-nowrap  text-sm text-neutral-900"
                                    >
                                      • {question}
                                    </Text>
                                  );
                                },
                              )}
                            </>
                          )}
                          {project.mostCitedSources?.length > 0 && (
                            <>
                              <Heading className="mt-6 mb-4 w-min truncate whitespace-nowrap text-sm font-bold text-neutral-900">
                                Most cited sources{' '}
                                <Link
                                  className="ml-2 text-sm font-normal text-violet-700 underline"
                                  href={`https://markprompt.com/${team.slug}/${project.slug}/insights`}
                                >
                                  See all
                                </Link>
                              </Heading>
                              {project.mostCitedSources.map((source, k) => {
                                return (
                                  <Text
                                    key={`team-${i}-project-${j}-question-${k}`}
                                    className="mb-0 mt-2 w-full max-w-[640px] overflow-hidden truncate whitespace-nowrap text-sm text-neutral-900"
                                  >
                                    • {source}
                                  </Text>
                                );
                              })}
                            </>
                          )}
                        </Section>
                      );
                    })}
                </Section>
              );
            })
        )}
        <SocialSection className="mt-8" excludeCTA />
        <Hr className="mt-8 border-neutral-200" />
        <Section className="mt-6">
          <Text className="text-xs text-neutral-500">
            You are receiving this email because you signed up at{' '}
            <Link
              className="text-neutral-500 underline"
              href="https://markprompt.com"
            >
              markprompt.com
            </Link>
            . You can unsubscribe in your{' '}
            <Link
              className="text-neutral-500 underline"
              href="https://markprompt.com"
            >
              account settings
            </Link>{' '}
            or via{' '}
            <Link
              href="{{{RESEND_UNSUBSCRIBE_URL}}}"
              className="text-neutral-500 underline"
            >
              this link
            </Link>
            .
          </Text>
        </Section>
        <Section>
          <Text className="text-xs text-neutral-500">
            Motif Land Inc, 2261 Market Street #4059, San Francisco CA, 94114
          </Text>
        </Section>
      </Container>
    </Wrapper>
  );
};

export default InsightsEmail;

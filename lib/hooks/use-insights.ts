import { parseISO, formatISO } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';
import useSWR from 'swr';

import {
  DateCountHistogramEntry,
  DbQueryFilter,
  PromptQueryStat,
  QueryFilterComparisonOperation,
  ReferenceWithOccurrenceCount,
} from '@/types/types';

import useProject from './use-project';
import useTeam from './use-team';
import {
  FixedDateRange,
  REFERENCE_TIMEZONE,
  dateRangeToFixedRange,
  getHistogramBinSize,
  getStoredRangeOrDefaultZonedTime,
} from '../date';
import { canViewInsights } from '../stripe/tiers';
import { fetcher, formatUrl } from '../utils';
import { safeParseJSON } from '../utils.nodeps';

export type FilterSpec = {
  field: string;
  op: QueryFilterComparisonOperation;
  value: string | null;
};

type UIQueryFilter = {
  status?: 'answered' | 'unanswered' | 'both';
  feedback?: 'upvoted' | 'downvoted' | 'upvoted_or_downvoted' | 'no_vote';
  metadata?: FilterSpec[];
};

export default function useInsights() {
  const { team } = useTeam();
  const { project } = useProject();
  const [page, setPage] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [queriesFilters, setQueriesFilters] = useState<
    UIQueryFilter | undefined
  >(undefined);

  useEffect(() => {
    if (!project?.id) {
      return;
    }
    setDateRange(
      getStoredRangeOrDefaultZonedTime(
        `${project.id}:insights:date-range`,
        FixedDateRange.PAST_3_MONTHS,
      ),
    );
  }, [project?.id]);

  useEffect(() => {
    if (!dateRange || !project?.id) {
      return;
    }
    const fixedDateRange = dateRangeToFixedRange(dateRange);
    if (fixedDateRange) {
      localStorage.setItem(
        `${project?.id}:insights:date-range`,
        String(fixedDateRange),
      );
    }
    // When switching date ranges, reset page to 0
    setPage(0);
  }, [dateRange, project?.id]);

  const fromISO = dateRange?.from && formatISO(dateRange?.from);
  const toISO = dateRange?.to && formatISO(dateRange?.to);
  const limit = team && canViewInsights(team) ? 20 : 3;

  const storageKey = project?.id
    ? `${project.id}:insights:query-filters`
    : undefined;
  useEffect(() => {
    if (!storageKey) {
      return;
    }
    setQueriesFilters(
      safeParseJSON(localStorage.getItem(storageKey), undefined),
    );
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }
    if (!queriesFilters) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, JSON.stringify(queriesFilters));
    }
  }, [queriesFilters, storageKey]);

  const preparedDBQueriesFilters = useMemo(() => {
    if (!project?.id) {
      return undefined;
    }

    // Transforms UI filters to DB filters
    const filters: DbQueryFilter[] = [];

    // Status
    if (queriesFilters?.status === 'answered') {
      filters.push([
        'is' as QueryFilterComparisonOperation,
        'no_response',
        null,
      ]);
    } else if (queriesFilters?.status === 'unanswered') {
      filters.push([
        'eq' as QueryFilterComparisonOperation,
        'no_response',
        true,
      ]);
    }

    // Feedback
    if (queriesFilters?.feedback === 'upvoted') {
      filters.push([
        'eq' as QueryFilterComparisonOperation,
        'feedback->>vote',
        '1',
      ]);
    } else if (queriesFilters?.feedback === 'downvoted') {
      filters.push([
        'eq' as QueryFilterComparisonOperation,
        'feedback->>vote',
        '-1',
      ]);
    } else if (queriesFilters?.feedback === 'upvoted_or_downvoted') {
      filters.push([
        'neq' as QueryFilterComparisonOperation,
        'feedback->>vote',
        null,
      ]);
    } else if (queriesFilters?.feedback === 'no_vote') {
      filters.push([
        'is' as QueryFilterComparisonOperation,
        'feedback->>vote',
        null,
      ]);
    }

    // Metadata
    for (const filter of queriesFilters?.metadata || []) {
      filters.push([
        filter.op,
        `decrypted_conversation_metadata->>${filter.field}`,
        filter.value,
      ]);
    }

    return filters;
  }, [queriesFilters, project?.id]);

  const {
    data: queries,
    mutate: mutateQueries,
    error: queriesError,
  } = useSWR(
    project?.id && fromISO && toISO && preparedDBQueriesFilters !== undefined
      ? formatUrl(`/api/project/${project.id}/insights/queries`, {
          page: `${page || 0}`,
          from: fromISO,
          to: toISO,
          limit: `${limit || 20}`,
          filters: JSON.stringify(preparedDBQueriesFilters),
        })
      : null,
    fetcher<{ queries: PromptQueryStat[] }>,
  );

  const { data: topReferences, error: topReferencesError } = useSWR(
    project?.id && fromISO && toISO
      ? formatUrl(`/api/project/${project.id}/insights/references`, {
          from: fromISO,
          to: toISO,
          limit: `${team && canViewInsights(team) ? 20 : 2}`,
        })
      : null,
    fetcher<ReferenceWithOccurrenceCount[]>,
  );

  // Important: queriesHistogramResponse returns bins with timestamps in UTC.
  // So for instance, if there is an event on 7/19 at 1pm in PST time zone,
  // the histogram will return 7/19 00:00 in UTC, which is correct. We should
  // treat that as 7/19 in local time zone without the time info, otherwise
  // it would map to 7/18 in PST time.
  const { data: queriesHistogramResponse, error: queriesHistogramError } =
    useSWR(
      project?.id && fromISO && toISO
        ? formatUrl(`/api/project/${project.id}/insights/queries-histogram`, {
            from: fromISO,
            to: toISO,
            tz: `${REFERENCE_TIMEZONE}`,
            period: `${getHistogramBinSize(dateRange)}`,
          })
        : null,
      fetcher<{ date: string; occurrences: number }[]>,
    );

  // Parse all dates here, once and for all
  const queriesHistogram = useMemo(() => {
    return queriesHistogramResponse?.map(
      (d) =>
        ({
          date: parseISO(d.date),
          count: d.occurrences,
        } as DateCountHistogramEntry),
    );
  }, [queriesHistogramResponse]);

  return {
    queries: queries?.queries,
    topReferences,
    queriesHistogram,
    dateRange,
    setDateRange,
    queriesFilters,
    setQueriesFilters,
    page,
    setPage,
    mutateQueries,
    loadingQueries: !project?.id || (!queries?.queries && !queriesError),
    loadingTopReferences:
      !project?.id || (!topReferences && !topReferencesError),
    loadingQueriesHistogram:
      !project?.id || (!queriesHistogram && !queriesHistogramError),
    hasMorePages: (queries?.queries?.length || 0) >= limit,
  };
}

import { NangoIntegrationId } from '@/types/types';

import { MarkdownProcessorOptions } from '../schema';

export type SalesforceEnvironment = 'production' | 'sandbox';
export type SalesforceDatabaseType = 'knowledge' | 'case';

export type SalesforceSyncMetadata = {
  customFields: string[] | undefined;
  filters: string | undefined;
  mappings: {
    title: string | undefined;
    content: string | undefined;
    path: string | undefined;
  };
  metadataFields: string[] | undefined;
  processorOptions?: MarkdownProcessorOptions;
};

export const getSalesforceDatabaseIntegrationId = (
  databaseType: SalesforceDatabaseType,
  environment: SalesforceEnvironment,
): NangoIntegrationId => {
  switch (databaseType) {
    case 'knowledge':
      return environment === 'production'
        ? 'salesforce-knowledge'
        : 'salesforce-knowledge-sandbox';
    case 'case':
      return environment === 'production'
        ? 'salesforce-case'
        : 'salesforce-case-sandbox';
  }
};

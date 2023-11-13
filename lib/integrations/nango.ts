import {
  DbSource,
  NangoIntegrationId,
  NangoSourceDataType,
  NangoSyncId,
  SyncData,
} from '@/types/types';

import { SalesforceEnvironment } from './salesforce';

export const getConnectionId = (
  source: Pick<DbSource, 'type' | 'data'>,
): string | undefined => {
  if (source.type !== 'nango') {
    return undefined;
  }
  return (source.data as NangoSourceDataType).connectionId;
};

// Currently, sync id and integration id are identical
export const getSyncId = (integrationId: NangoIntegrationId): NangoSyncId => {
  return integrationId;
};

export const getIntegrationId = (
  source: Pick<DbSource, 'type' | 'data'>,
): NangoIntegrationId | undefined => {
  if (source.type !== 'nango') {
    return undefined;
  }
  return (source.data as NangoSourceDataType).integrationId;
};

export const integrationRequiresAuth = (integrationId: NangoIntegrationId) => {
  switch (integrationId) {
    case 'notion-pages':
    case 'salesforce-case':
    case 'salesforce-case-sandbox':
    case 'salesforce-knowledge':
    case 'salesforce-knowledge-sandbox':
      return true;
  }
};

export const getIntegrationName = (integrationId: NangoIntegrationId) => {
  switch (integrationId) {
    case 'salesforce-case':
    case 'salesforce-case-sandbox':
      return 'Salesforce Case';
    case 'salesforce-knowledge':
    case 'salesforce-knowledge-sandbox':
      return 'Salesforce Knowledge';
    case 'notion-pages':
      return 'Notion';
    case 'website-pages':
      return 'Website';
  }
};

export const getIntegrationEnvironment = (
  integrationId: NangoIntegrationId,
): SalesforceEnvironment | undefined => {
  switch (integrationId) {
    case 'salesforce-case':
    case 'salesforce-knowledge':
      return 'production';
    case 'salesforce-case-sandbox':
    case 'salesforce-knowledge-sandbox':
      return 'sandbox';
    default:
      return undefined;
  }
};

export const getIntegrationEnvironmentName = (
  environment: SalesforceEnvironment,
): string => {
  switch (environment) {
    case 'production':
      return 'Production';
    case 'sandbox':
      return 'Sandbox';
  }
};

export const getSyncData = (
  source: Pick<DbSource, 'type' | 'data'>,
): SyncData | undefined => {
  const integrationId = getIntegrationId(source);
  const connectionId = getConnectionId(source);
  if (!integrationId || !connectionId) {
    return undefined;
  }
  const syncId = getSyncId(integrationId);
  return {
    integrationId,
    connectionId,
    syncId,
  };
};

export interface NangoFile {
  id: string;
  path: string;
  title: string | undefined;
  content: string | undefined;
  contentType: string | undefined;
  meta: object | undefined;
  error: string | undefined;
}
type LogLevel = 'info' | 'debug' | 'error' | 'warn' | 'http' | 'verbose' | 'silly';
interface ParamEncoder {
    (value: any, defaultEncoder: (value: any) => any): any;
}
interface GenericFormData {
    append(name: string, value: any, options?: any): any;
}
interface SerializerVisitor {
    (this: GenericFormData, value: any, key: string | number, path: null | Array<string | number>, helpers: FormDataVisitorHelpers): boolean;
}
interface CustomParamsSerializer {
    (params: Record<string, any>, options?: ParamsSerializerOptions): string;
}
interface FormDataVisitorHelpers {
    defaultVisitor: SerializerVisitor;
    convertValue: (value: any) => any;
    isVisitable: (value: any) => boolean;
}
interface SerializerOptions {
    visitor?: SerializerVisitor;
    dots?: boolean;
    metaTokens?: boolean;
    indexes?: boolean | null;
}
interface ParamsSerializerOptions extends SerializerOptions {
    encode?: ParamEncoder;
    serialize?: CustomParamsSerializer;
}
export interface AxiosResponse<T = any, D = any> {
    data: T;
    status: number;
    statusText: string;
    headers: any;
    config: D;
    request?: any;
}
export declare enum PaginationType {
    CURSOR = "cursor",
    LINK = "link",
    OFFSET = "offset"
}
export interface Pagination {
    type: string;
    limit?: number;
    response_path?: string;
    limit_name_in_request: string;
}
export interface CursorPagination extends Pagination {
    cursor_path_in_response: string;
    cursor_name_in_request: string;
}
export interface LinkPagination extends Pagination {
    link_rel_in_response_header?: string;
    link_path_in_response_body?: string;
}
export interface OffsetPagination extends Pagination {
    offset_name_in_request: string;
}
export interface ProxyConfiguration {
    endpoint: string;
    providerConfigKey?: string;
    connectionId?: string;
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'get' | 'post' | 'patch' | 'put' | 'delete';
    headers?: Record<string, string>;
    params?: string | Record<string, string>;
    paramsSerializer?: ParamsSerializerOptions;
    data?: unknown;
    retries?: number;
    baseUrlOverride?: string;
    paginate?: Partial<CursorPagination> | Partial<LinkPagination> | Partial<OffsetPagination>;
}
declare enum AuthModes {
    OAuth1 = "OAUTH1",
    OAuth2 = "OAUTH2",
    Basic = "BASIC",
    ApiKey = "API_KEY",
    App = "APP"
}
interface AppCredentials {
    type?: AuthModes.App;
    access_token: string;
    expires_at?: Date | undefined;
    raw: Record<string, any>;
}
interface BasicApiCredentials {
    type?: AuthModes.Basic;
    username: string;
    password: string;
}
interface ApiKeyCredentials {
    type?: AuthModes.ApiKey;
    apiKey: string;
}
interface CredentialsCommon<T = Record<string, any>> {
    type: AuthModes;
    raw: T;
}
interface OAuth2Credentials extends CredentialsCommon {
    type: AuthModes.OAuth2;
    access_token: string;
    refresh_token?: string;
    expires_at?: Date | undefined;
}
interface OAuth1Credentials extends CredentialsCommon {
    type: AuthModes.OAuth1;
    oauth_token: string;
    oauth_token_secret: string;
}
type AuthCredentials = OAuth2Credentials | OAuth1Credentials | BasicApiCredentials | ApiKeyCredentials | AppCredentials;
interface Metadata {
    [key: string]: string | Record<string, any>;
}
interface Connection {
    id?: number;
    created_at?: string;
    updated_at?: string;
    provider_config_key: string;
    connection_id: string;
    connection_config: Record<string, string>;
    environment_id: number;
    metadata: Metadata | null;
    credentials_iv?: string | null;
    credentials_tag?: string | null;
    credentials: AuthCredentials;
}
interface NangoProps {
    host?: string;
    secretKey: string;
    connectionId?: string;
    environmentId?: number;
    activityLogId?: number;
    providerConfigKey?: string;
    lastSyncDate?: Date;
    syncId?: string | undefined;
    nangoConnectionId?: number;
    syncJobId?: number | undefined;
    dryRun?: boolean;
    track_deletes?: boolean;
    attributes?: object | undefined;
    logMessages?: unknown[] | undefined;
    stubbedMetadata?: Metadata | undefined;
}
interface UserLogParameters {
    level?: LogLevel;
}
interface EnvironmentVariable {
    name: string;
    value: string;
}
export declare class NangoAction {
    private nango;
    private attributes;
    activityLogId?: number;
    syncId?: string;
    nangoConnectionId?: number;
    environmentId?: number;
    syncJobId?: number;
    dryRun?: boolean;
    connectionId?: string;
    providerConfigKey?: string;
    constructor(config: NangoProps);
    proxy<T = any>(config: ProxyConfiguration): Promise<AxiosResponse<T>>;
    get<T = any>(config: ProxyConfiguration): Promise<AxiosResponse<T>>;
    post<T = any>(config: ProxyConfiguration): Promise<AxiosResponse<T>>;
    patch<T = any>(config: ProxyConfiguration): Promise<AxiosResponse<T>>;
    delete<T = any>(config: ProxyConfiguration): Promise<AxiosResponse<T>>;
    getConnection(): Promise<Connection>;
    setMetadata(metadata: Record<string, string>): Promise<AxiosResponse<void>>;
    setFieldMapping(fieldMapping: Record<string, string>): Promise<AxiosResponse<void>>;
    getMetadata<T = Metadata>(): Promise<T>;
    getFieldMapping(): Promise<Metadata>;
    log(content: string, userDefinedLevel?: UserLogParameters): Promise<void>;
    getEnvironmentVariables(): Promise<EnvironmentVariable[] | null>;
    getFlowAttributes<A = object>(): A | null;
    paginate<T = any>(config: ProxyConfiguration): AsyncGenerator<T[], undefined, void>;
    triggerAction(providerConfigKey: string, connectionId: string, actionName: string, input?: unknown): Promise<object>;
}
export declare class NangoSync extends NangoAction {
    lastSyncDate?: Date;
    track_deletes: boolean;
    logMessages?: unknown[] | undefined;
    stubbedMetadata?: Metadata | undefined;
    constructor(config: NangoProps);
    /**
     * Set Sync Last Sync Date
     * @desc permanently set the last sync date for the sync
     * to be used for the next sync run
     */
    setLastSyncDate(date: Date): Promise<boolean>;
    /**
     * Deprecated, please use batchSave
     */
    batchSend<T = any>(results: T[], model: string): Promise<boolean | null>;
    batchSave<T = any>(results: T[], model: string): Promise<boolean | null>;
    batchDelete<T = any>(results: T[], model: string): Promise<boolean | null>;
    getMetadata<T = Metadata>(): Promise<T>;
}
export {};
export const NangoFlows = [
  {
    "providerConfigKey": "salesforce-knowledge",
    "syncs": [
      {
        "name": "salesforce-knowledge",
        "type": "sync",
        "runs": "every day",
        "track_deletes": false,
        "auto_start": false,
        "attributes": {},
        "returns": [
          "NangoFile"
        ],
        "models": [
          {
            "name": "NangoFile",
            "fields": [
              {
                "name": "id",
                "type": "string"
              },
              {
                "name": "path",
                "type": "string"
              },
              {
                "name": "title",
                "type": "string | undefined"
              },
              {
                "name": "content",
                "type": "string | undefined"
              },
              {
                "name": "contentType",
                "type": "string | undefined"
              },
              {
                "name": "meta",
                "type": "object | undefined"
              },
              {
                "name": "error",
                "type": "string | undefined"
              }
            ]
          }
        ],
        "description": "",
        "scopes": []
      }
    ],
    "actions": []
  },
  {
    "providerConfigKey": "salesforce-knowledge-sandbox",
    "syncs": [
      {
        "name": "salesforce-knowledge-sandbox",
        "type": "sync",
        "runs": "every day",
        "track_deletes": false,
        "auto_start": false,
        "attributes": {},
        "returns": [
          "NangoFile"
        ],
        "models": [
          {
            "name": "NangoFile",
            "fields": [
              {
                "name": "id",
                "type": "string"
              },
              {
                "name": "path",
                "type": "string"
              },
              {
                "name": "title",
                "type": "string | undefined"
              },
              {
                "name": "content",
                "type": "string | undefined"
              },
              {
                "name": "contentType",
                "type": "string | undefined"
              },
              {
                "name": "meta",
                "type": "object | undefined"
              },
              {
                "name": "error",
                "type": "string | undefined"
              }
            ]
          }
        ],
        "description": "",
        "scopes": []
      }
    ],
    "actions": []
  },
  {
    "providerConfigKey": "salesforce-case",
    "syncs": [
      {
        "name": "salesforce-case",
        "type": "sync",
        "runs": "every day",
        "track_deletes": false,
        "auto_start": false,
        "attributes": {},
        "returns": [
          "NangoFile"
        ],
        "models": [
          {
            "name": "NangoFile",
            "fields": [
              {
                "name": "id",
                "type": "string"
              },
              {
                "name": "path",
                "type": "string"
              },
              {
                "name": "title",
                "type": "string | undefined"
              },
              {
                "name": "content",
                "type": "string | undefined"
              },
              {
                "name": "contentType",
                "type": "string | undefined"
              },
              {
                "name": "meta",
                "type": "object | undefined"
              },
              {
                "name": "error",
                "type": "string | undefined"
              }
            ]
          }
        ],
        "description": "",
        "scopes": []
      }
    ],
    "actions": []
  },
  {
    "providerConfigKey": "salesforce-case-sandbox",
    "syncs": [
      {
        "name": "salesforce-case-sandbox",
        "type": "sync",
        "runs": "every day",
        "track_deletes": false,
        "auto_start": false,
        "attributes": {},
        "returns": [
          "NangoFile"
        ],
        "models": [
          {
            "name": "NangoFile",
            "fields": [
              {
                "name": "id",
                "type": "string"
              },
              {
                "name": "path",
                "type": "string"
              },
              {
                "name": "title",
                "type": "string | undefined"
              },
              {
                "name": "content",
                "type": "string | undefined"
              },
              {
                "name": "contentType",
                "type": "string | undefined"
              },
              {
                "name": "meta",
                "type": "object | undefined"
              },
              {
                "name": "error",
                "type": "string | undefined"
              }
            ]
          }
        ],
        "description": "",
        "scopes": []
      }
    ],
    "actions": []
  },
  {
    "providerConfigKey": "notion-pages",
    "syncs": [
      {
        "name": "notion-pages",
        "type": "sync",
        "runs": "every day",
        "track_deletes": true,
        "auto_start": false,
        "attributes": {},
        "returns": [
          "NangoFile"
        ],
        "models": [
          {
            "name": "NangoFile",
            "fields": [
              {
                "name": "id",
                "type": "string"
              },
              {
                "name": "path",
                "type": "string"
              },
              {
                "name": "title",
                "type": "string | undefined"
              },
              {
                "name": "content",
                "type": "string | undefined"
              },
              {
                "name": "contentType",
                "type": "string | undefined"
              },
              {
                "name": "meta",
                "type": "object | undefined"
              },
              {
                "name": "error",
                "type": "string | undefined"
              }
            ]
          }
        ],
        "description": "",
        "scopes": []
      }
    ],
    "actions": []
  },
  {
    "providerConfigKey": "website-pages",
    "syncs": [
      {
        "name": "website-pages",
        "type": "sync",
        "runs": "every week",
        "track_deletes": true,
        "auto_start": false,
        "attributes": {},
        "returns": [
          "NangoFile"
        ],
        "models": [
          {
            "name": "NangoFile",
            "fields": [
              {
                "name": "id",
                "type": "string"
              },
              {
                "name": "path",
                "type": "string"
              },
              {
                "name": "title",
                "type": "string | undefined"
              },
              {
                "name": "content",
                "type": "string | undefined"
              },
              {
                "name": "contentType",
                "type": "string | undefined"
              },
              {
                "name": "meta",
                "type": "object | undefined"
              },
              {
                "name": "error",
                "type": "string | undefined"
              }
            ]
          }
        ],
        "description": "",
        "scopes": []
      }
    ],
    "actions": []
  }
] as const; 

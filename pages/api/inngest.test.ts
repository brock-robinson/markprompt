/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { createServiceRoleSupabaseClient } from '@/lib/supabase';
import { DbFile, FileSections, NangoFileWithMetadata } from '@/types/types';

import {
  FileTrainEventData,
  createFullMeta,
  isFileChanged,
  runTrainFile,
} from './inngest';

let files: DbFile[] = [];
let fileSections: FileSections[] = [];

const server = setupServer(
  rest.post('https://api.openai.com/v1/embeddings', async (req, res, ctx) => {
    const body = await req.json();
    return res(
      ctx.status(200),
      ctx.body(
        JSON.stringify({
          model: 'text-embedding-ada-002-v2',
          object: 'list',
          usage: { prompt_tokens: 10, total_tokens: 10 },
          data: Array.from(Array(body.input.length).keys()).map((i) => [
            {
              object: 'embedding',
              index: 0,
              embedding: [0, 0, 0, 0, 0, 0],
            },
          ]),
        }),
      ),
    );
  }),
);

const supabaseClient = {
  from: (table: string) => ({
    select: (select: string) => ({
      eq: (eq1: string, value1: string) => ({
        eq: (eq2: string, value2: string) => ({
          then: (callback: any) => {
            if (
              table === 'files' &&
              select === 'id,meta,path,checksum' &&
              eq1 === 'source_id' &&
              eq2 === 'internal_metadata->>nangoFileId'
            ) {
              // getFilesIdAndCheksumBySourceAndNangoId
              callback({
                data: {
                  id: 'test-file-id-1',
                  meta: { title: 'Test title 1' },
                  path: '/test/path/1',
                  checksum: 'abc',
                },
              });
              return {
                catch: () => {
                  // Do nothing
                },
              };
            }
          },
        }),
        limit: (limit: number) => ({
          maybeSingle: () => ({
            then: (callback: any) => {
              if (
                table === 'sources' &&
                select === 'id' &&
                eq1 === 'data->>connectionId'
              ) {
                callback({ data: { id: 'test-source-id' } });
                return {
                  catch: () => {
                    // Do nothing
                  },
                };
              }
            },
          }),
        }),
      }),
      match: (obj: any) => ({
        limit: (limit: number) => ({
          maybeSingle: () => ({
            then: (callback: any) => {
              if (obj?.['source_id'] && obj?.['path']) {
                callback({ data: { id: 'test-source-id' } });
                return {
                  catch: () => {
                    // Do nothing
                  },
                };
              }
            },
          }),
        }),
      }),
    }),
    insert: (values: any[]) => {
      if (table === 'files') {
        return {
          select: (select: string) => ({
            limit: (limit: number) => ({
              maybeSingle: () => ({
                then: (callback: any) => {
                  // createFile
                  for (const value of values) {
                    files.push({
                      ...value,
                      id: Math.round(Math.pow(10, 8) * Math.random()),
                    });
                  }

                  callback({
                    data: { id: files[0].id },
                  });
                  return {
                    catch: () => {
                      // Do nothing
                    },
                  };
                },
              }),
            }),
          }),
        };
      } else if (table === 'file_sections') {
        return {
          then: async (callback: any) => {
            for (const value of values) {
              fileSections.push({
                ...value,
                id: Math.round(Math.pow(10, 8) * Math.random()),
              });
            }

            callback({});
            return {
              catch: () => {
                // Do nothing
              },
            };
          },
        };
      }
    },
    delete: () => ({
      in: (key: string, values: any[]) => ({
        then: (callback: any) => {
          // batchDeleteFiles
          if (table === 'files' && key === 'id') {
            files = files.filter((f) => !values.includes(f.id));
          }
          callback();
          return {
            catch: () => {
              // Do nothing
            },
          };
        },
      }),
      eq: (eqKey: string, eqValue: any) => ({
        in: (inKey: string, inValues: any[]) => ({
          then: (callback: any) => {
            // batchDeleteFilesBySourceAndNangoId
            if (
              table === 'files' &&
              eqKey === 'source_id' &&
              inKey === 'internal_metadata->>nangoFileId'
            ) {
              files = files.filter((f) => {
                if (f.source_id === eqValue) {
                  return false;
                }
                if (
                  inValues.includes((f.internal_metadata as any)?.nangoFileId)
                ) {
                  return false;
                }
              });
            }
            callback();
            return {
              catch: () => {
                // Do nothing
              },
            };
          },
        }),
      }),
    }),
  }),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => supabaseClient,
}));

describe('inngest', () => {
  describe('isFileChanged', () => {
    it('should detect whether a file has changed for training', () => {
      const newFile = {
        meta: { title: 'Hello', meta: { value: 1 } },
        path: '/path/to/file',
        checksum: 'abc',
      };
      expect(isFileChanged(newFile, newFile)).toBe(false);
      expect(
        isFileChanged(newFile, {
          ...newFile,
          meta: { meta: { value: 1 }, title: 'Hello' },
        }),
      ).toBe(false);
      expect(
        isFileChanged(newFile, {
          ...newFile,
          checksum: 'abcd',
        }),
      ).toBe(true);
      expect(
        isFileChanged(newFile, {
          ...newFile,
          path: '/other/path',
        }),
      ).toBe(true);
      expect(
        isFileChanged(newFile, {
          ...newFile,
          meta: { ...newFile.meta, meta: 1 },
        }),
      ).toBe(true);
    });
  });

  describe('createFullMeta', () => {
    it('should detect whether a file has changed for training', async () => {
      const baseNangoFile = {
        id: 'id',
        path: '/path',
        error: undefined,
      };
      expect(
        await createFullMeta({
          ...baseNangoFile,
          title: undefined,
          content: '<html><title>HTML Title</title></html>',
          contentType: 'html',
          meta: { title: 'Meta title', key: 1 },
        } as NangoFileWithMetadata),
      ).toStrictEqual({ title: 'HTML Title', key: 1 });
      expect(
        await createFullMeta({
          ...baseNangoFile,
          title: undefined,
          content: '---\ntitle: Frontmatter title\n---\n\n# Heading\n\nContent',
          contentType: 'mdx',
          meta: { title: 'Meta title', key: 1 },
        } as NangoFileWithMetadata),
      ).toStrictEqual({ title: 'Frontmatter title', key: 1 });
      expect(
        await createFullMeta({
          ...baseNangoFile,
          title: 'Nango title',
          content: '# Heading\n\nContent',
          contentType: 'md',
          meta: { key: 1 },
        } as NangoFileWithMetadata),
      ).toStrictEqual({ title: 'Nango title', key: 1 });
      expect(
        await createFullMeta({
          ...baseNangoFile,
          content: '',
          contentType: 'md',
          meta: {
            title: 'Nango title',
            key: 1,
          },
        } as NangoFileWithMetadata),
      ).toStrictEqual({ title: 'Nango title', key: 1 });
    });
  });

  describe('syncNangoRecords', () => {
    beforeAll(() => {
      server.listen({ onUnhandledRequest: 'error' });
    });

    afterEach(() => {
      files = [];
      fileSections = [];
    });

    afterAll(() => {
      server.close();
    });

    it('should sync records', async () => {
      const supabase = createServiceRoleSupabaseClient();

      const heading1 = 'Heading 1';
      const heading2 = 'Heading 2';
      const section1Content = `# ${heading1}\n\nSome Markdown content`;
      const section2Content = `# ${heading2}\n\nSome other content`;

      const fileTrainEventData: FileTrainEventData = {
        file: {
          id: 'test-id',
          path: '/test/path',
          title: 'Test file',
          content: `${section1Content}\n\n${section2Content}`,
          contentType: 'md',
          meta: { key: 'value' },
          error: undefined,
          _nango_metadata: {
            deleted_at: null,
            last_action: 'UPDATED',
            first_seen_at: '2023-11-01',
            last_modified_at: '2023-11-01',
          },
        },
        projectId: 'test-project-id',
        sourceId: 'test-source-id',
        processorOptions: undefined,
      };

      await runTrainFile(fileTrainEventData);

      expect(fileSections[0].file_id).toEqual(files[0].id);
      expect((fileSections[0] as any).meta.leadHeading.value).toEqual(heading1);
      expect((fileSections[0] as any).content.trim()).toEqual(
        section1Content.trim(),
      );
      expect(fileSections[1].file_id).toEqual(files[0].id);
      expect((fileSections[1] as any).meta.leadHeading.value).toEqual(heading2);
      expect((fileSections[1] as any).content.trim()).toEqual(
        section2Content.trim(),
      );
    });
  });
});

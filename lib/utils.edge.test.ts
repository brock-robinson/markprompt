/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';

import {
  deepMerge,
  getApiUrl,
  getAppHost,
  getAppOrigin,
  getDomain,
  isAppHost,
  isRequestFromMarkprompt,
  removeSchema,
} from './utils.edge';

describe('utils.edge', () => {
  describe('getAppHost', () => {
    it('should return localhost in dev environment', () => {
      expect(getAppHost()).toBe('localhost:3000');
      expect(getAppHost('api')).toBe('api.localhost:3000');
    });
  });

  describe('getAppOrigin', () => {
    it('should return localhost in dev environment', () => {
      expect(getAppOrigin()).toBe('http://localhost:3000');
      expect(getAppOrigin('api')).toBe('http://api.localhost:3000');
    });
  });

  describe('getApiUrl', () => {
    it('should return correct API urls', () => {
      const apis = [
        'embeddings',
        'completions',
        'chat',
        'sections',
        'search',
        'feedback',
      ] as (
        | 'embeddings'
        | 'completions'
        | 'chat'
        | 'sections'
        | 'search'
        | 'feedback'
      )[];
      for (const api of apis) {
        expect(getApiUrl(api)).toBe(`http://api.localhost:3000/v1/${api}`);
      }
    });
  });

  describe('isAppHost', () => {
    it('should detect app host', () => {
      expect(isAppHost('localhost:3000')).toBe(true);
    });
  });

  describe('removeSchema', () => {
    it('should remove schema', () => {
      expect(removeSchema('http://localhost:3000')).toBe('localhost:3000');
      expect(removeSchema('https://markprompt.com')).toBe('markprompt.com');
    });
  });

  describe('getDomain', () => {
    it('should get the domain', () => {
      expect(getDomain('http://localhost:3000')).toBe('localhost');
      expect(getDomain('https://markprompt.com')).toBe('markprompt.com');
      expect(getDomain('https://www.example.com')).toBe('example.com');
      expect(getDomain('localhost:3000')).toBe('localhost');
      expect(getDomain('www.example.com')).toBe('example.com');
    });
  });

  describe('isRequestFromMarkprompt', () => {
    it('should check whether request is from Markprompt origin', () => {
      expect(isRequestFromMarkprompt('http://localhost:3000')).toBe(true);
      expect(isRequestFromMarkprompt('http://api.localhost:3000')).toBe(false);
      expect(isRequestFromMarkprompt('https://example.com')).toBe(false);
    });
  });

  describe('deepMerge', () => {
    it('should deep merge two objects', () => {
      const obj1 = {
        a: 1,
        b: {
          c: 'd',
          g: { h: 4 },
        },
      };
      const obj2 = {
        e: 2,
        b: {
          c: 3,
          f: 4,
        },
      };
      expect(deepMerge(obj1, obj2)).toStrictEqual({
        a: 1,
        e: 2,
        b: {
          c: 3,
          f: 4,
          g: { h: 4 },
        },
      });
    });
  });
});

import { describe, expect, it } from 'vitest';

import { formatNumber, toNormalizedUrl } from './utils';

describe('utils', () => {
  describe('formatNumber', () => {
    it('should format numbers', () => {
      expect(formatNumber(1)).toBe('1');
    });
  });
});

describe('utils', () => {
  describe('toNormalizedUrl', () => {
    it('should turn strings to valid URLs', () => {
      expect(toNormalizedUrl('https://markprompt.com')).toBe(
        'https://markprompt.com',
      );
    });
    it('should append schema to a URL', () => {
      expect(toNormalizedUrl('markprompt.com')).toBe('https://markprompt.com');
    });
    it('should cleanup a URL', () => {
      expect(toNormalizedUrl('markprompt.com/')).toBe('https://markprompt.com');
    });
    it('should keep the path in a URL', () => {
      expect(toNormalizedUrl('markprompt.com/blog/')).toBe(
        'https://markprompt.com/blog',
      );
    });
  });
});

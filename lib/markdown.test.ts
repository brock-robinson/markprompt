import { describe, expect, it } from 'vitest';

import { convertToMarkdown, markdownToFileSectionData } from './markdown';

const content = `---
title: Some title
---

# Heading

[A link](/blog/index.mdx) ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum. Donec in efficitur ipsum, in egestas mauris.

![Lorem](https://example.com/assets/image.jpg)

<img src="https://example.com/assets/image.jpg" />
`;

const contentTransformed = `---
title: Some title
---

# Heading

[A link](/blog/index) ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum. Donec in efficitur ipsum, in egestas mauris.

![Lorem](https://globex.com/image.jpg)

<img src="https://globex.com/image.jpg" />
`;

const options = {
  linkRewrite: {
    rules: [{ pattern: '\\.mdx?', replace: '' }],
  },
  imageSourceRewrite: {
    rules: [
      {
        pattern: '^https://example.com/assets',
        replace: 'https://globex.com',
      },
    ],
  },
};

describe('markdown', () => {
  describe('convertToMarkdown', () => {
    it('should convert to Markdown content', () => {
      expect(convertToMarkdown(content, 'md', options)).toStrictEqual(
        convertToMarkdown(contentTransformed, 'md', options),
      );
    });

    it('should convert remove JSX tags', () => {
      expect(
        convertToMarkdown('# Heading\n\n<JSXTag />', 'mdx', undefined),
      ).toStrictEqual('# Heading');
    });

    it('should remove frontmatter tags', () => {
      expect(
        convertToMarkdown(
          '---\ntitle: Some title\n---\n\n# Heading\n\n<JSXTag />',
          'md',
          undefined,
        ),
      ).toStrictEqual('# Heading');
    });

    it('should convert code blocks', () => {
      expect(
        convertToMarkdown(
          '<body><h1>Heading</h1><pre>var i = 0;</pre></body>',
          'html',
          undefined,
        ),
      ).toStrictEqual('# Heading\n\n```\nvar i = 0;\n```');
    });
  });

  describe('markdownToFileSectionData', () => {
    it('should transform Markdown content', () => {
      expect(markdownToFileSectionData(content, false, options)).toStrictEqual(
        markdownToFileSectionData(contentTransformed, false, {}),
      );
    });
  });
});

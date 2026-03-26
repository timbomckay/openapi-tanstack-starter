import { useEffect, useState } from 'react';

import { codeToHtml } from 'shiki';

// In-memory cache so each snippet is only highlighted once per session.
const cache = new Map<string, string>();

async function highlight(code: string, lang: string): Promise<string> {
  const key = `${lang}\0${code}`;
  if (cache.has(key)) return cache.get(key)!;

  const html = await codeToHtml(code, {
    lang,
    themes: { light: 'github-light', dark: 'github-dark' },
    // Light is the default; dark is activated via .dark CSS override in index.css
    defaultColor: 'light',
  });

  cache.set(key, html);
  return html;
}

interface CodeBlockProps {
  code: string;
  lang?: string;
  className?: string;
}

export function CodeBlock({
  code,
  lang = 'typescript',
  className = '',
}: CodeBlockProps) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    highlight(code, lang).then((result) => {
      if (!cancelled) setHtml(result);
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  if (!html) {
    // Unstyled fallback while highlighting resolves (usually <100ms)
    return (
      <pre
        className={`overflow-x-auto rounded-lg border bg-muted/40 p-4 font-mono text-[12.5px] leading-relaxed text-foreground/80 ${className}`}
      >
        {code}
      </pre>
    );
  }

  return (
    <div
      // [&>pre] targets the <pre> shiki emits so we can apply our own shell styles
      className={`overflow-x-auto rounded-lg border text-[12.5px] leading-relaxed [&>pre]:rounded-lg [&>pre]:p-4 ${className}`}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

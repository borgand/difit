import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { AppearanceSettings } from './SettingsModal';
import { getMarkdownComponents } from '../viewers/MarkdownDiffViewer';

type DescriptionViewProps = {
  content: string;
  syntaxTheme?: AppearanceSettings['syntaxTheme'];
};

export function DescriptionView({ content, syntaxTheme }: DescriptionViewProps) {
  const components = getMarkdownComponents(syntaxTheme);
  return (
    <div className="flex-1 overflow-y-auto">
      <article
        data-testid="description-view"
        className="mx-auto max-w-3xl px-6 py-8 text-github-text-primary"
      >
        <header className="mb-6 border-b border-github-border pb-3">
          <h1 className="text-2xl font-semibold text-github-text-primary">Description</h1>
        </header>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}

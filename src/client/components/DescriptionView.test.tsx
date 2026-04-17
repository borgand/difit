import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';

vi.mock('./MermaidDiagram', () => ({
  MermaidDiagram: ({ chart }: { chart: string }) => (
    <div data-testid="mermaid-diagram">{chart}</div>
  ),
}));

import { DescriptionView } from './DescriptionView';

describe('DescriptionView', () => {
  it('renders headings and paragraphs', () => {
    render(<DescriptionView content={'# Title\n\nHello *world*.'} />);

    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByTestId('description-view')).toHaveTextContent('Hello world.');
  });

  it('renders a Description title header', () => {
    render(<DescriptionView content={'body text'} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Description' })).toBeInTheDocument();
  });

  it('renders mermaid fenced blocks via MermaidDiagram', () => {
    const content = ['before', '', '```mermaid', 'graph TD; A-->B', '```', '', 'after'].join('\n');

    render(<DescriptionView content={content} />);

    expect(screen.getByTestId('mermaid-diagram')).toHaveTextContent('graph TD; A-->B');
  });

  it('blocks javascript: links by rendering plain text', () => {
    render(<DescriptionView content={'[danger](javascript:alert(1))'} />);

    expect(screen.queryByRole('link', { name: 'danger' })).not.toBeInTheDocument();
    expect(screen.getByTestId('description-view')).toHaveTextContent('danger');
  });
});

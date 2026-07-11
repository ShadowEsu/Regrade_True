import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ChatMarkdown from './ChatMarkdown';

describe('ChatMarkdown academic content', () => {
  it('renders inline and display mathematics with KaTeX', () => {
    const { container } = render(<ChatMarkdown text={'Use $x^2$ and then:\n\n$$\n\\frac{a}{b} + \\int_0^1 x\\,dx\n$$'} />);
    expect(container.querySelectorAll('.katex').length).toBeGreaterThanOrEqual(2);
  });

  it('renders chemistry through mhchem', () => {
    const { container } = render(<ChatMarkdown text={'Reaction: $\\ce{2H2 + O2 -> 2H2O}$'} />);
    expect(container.querySelector('.katex')).not.toBeNull();
  });

  it('renders a bounded chart block', () => {
    render(<ChatMarkdown text={'```chart\n{"type":"bar","title":"Score by question","labels":["Q1","Q2"],"values":[8,6]}\n```'} />);
    expect(screen.getByRole('img')).toBeTruthy();
    expect(screen.getByText('Score by question')).toBeTruthy();
  });
});

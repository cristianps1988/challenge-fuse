import { render, screen } from '@testing-library/react';
import { ConfidenceIndicator } from './ConfidenceIndicator';

describe('ConfidenceIndicator', () => {
  it('renders high confidence correctly', () => {
    render(<ConfidenceIndicator confidence={0.95} />);
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('(High)')).toBeInTheDocument();
  });

  it('renders medium confidence correctly', () => {
    render(<ConfidenceIndicator confidence={0.75} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('(Medium)')).toBeInTheDocument();
  });

  it('renders low confidence correctly', () => {
    render(<ConfidenceIndicator confidence={0.55} />);
    expect(screen.getByText('55%')).toBeInTheDocument();
    expect(screen.getByText('(Low)')).toBeInTheDocument();
  });

  it('hides percentage when showPercentage is false', () => {
    render(<ConfidenceIndicator confidence={0.85} showPercentage={false} />);
    expect(screen.queryByText('85%')).not.toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender, container } = render(<ConfidenceIndicator confidence={0.85} size="sm" />);
    let progressBar = container.querySelector('.h-1\\.5');
    expect(progressBar).toBeInTheDocument();

    rerender(<ConfidenceIndicator confidence={0.85} size="md" />);
    progressBar = container.querySelector('.h-2');
    expect(progressBar).toBeInTheDocument();

    rerender(<ConfidenceIndicator confidence={0.85} size="lg" />);
    progressBar = container.querySelector('.h-3');
    expect(progressBar).toBeInTheDocument();
  });

  it('rounds confidence to nearest integer', () => {
    render(<ConfidenceIndicator confidence={0.847} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });
});

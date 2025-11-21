import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders spinner', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders text when provided', () => {
    render(<LoadingSpinner text="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('does not render text when not provided', () => {
    render(<LoadingSpinner />);
    expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
  });

  it('renders small size', () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    expect(container.querySelector('.h-4')).toBeInTheDocument();
  });

  it('renders medium size by default', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.h-6')).toBeInTheDocument();
  });

  it('renders large size', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    expect(container.querySelector('.h-8')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has animate-spin class', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});

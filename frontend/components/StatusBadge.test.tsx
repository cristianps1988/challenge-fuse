import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';
import { DocumentStatus } from '@/backend/domain/document-status.constants';

describe('StatusBadge', () => {
  it('renders processing status correctly', () => {
    render(<StatusBadge status={DocumentStatus.PROCESSING} />);
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('renders completed status correctly', () => {
    render(<StatusBadge status={DocumentStatus.COMPLETED} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders needs review status correctly', () => {
    render(<StatusBadge status={DocumentStatus.NEEDS_REVIEW} />);
    expect(screen.getByText('Needs Review')).toBeInTheDocument();
  });

  it('renders reviewed status correctly', () => {
    render(<StatusBadge status={DocumentStatus.REVIEWED} />);
    expect(screen.getByText('Reviewed')).toBeInTheDocument();
  });

  it('renders failed status correctly', () => {
    render(<StatusBadge status={DocumentStatus.FAILED} />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatusBadge status={DocumentStatus.COMPLETED} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="No items" description="Try uploading a file" />);
    expect(screen.getByText('Try uploading a file')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<EmptyState title="No items" />);
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    const customIcon = <div data-testid="custom-icon">Custom</div>;
    render(<EmptyState title="No items" icon={customIcon} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders default icon when not provided', () => {
    const { container } = render(<EmptyState title="No items" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    const action = <button>Upload File</button>;
    render(<EmptyState title="No items" action={action} />);
    expect(screen.getByRole('button', { name: 'Upload File' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState title="No items" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorMessage } from './ErrorMessage';

describe('ErrorMessage', () => {
  it('renders error message', () => {
    render(<ErrorMessage message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders default title when not provided', () => {
    render(<ErrorMessage message="Error occurred" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders custom title when provided', () => {
    render(<ErrorMessage title="Custom Error" message="Error occurred" />);
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });

  it('renders error variant by default', () => {
    const { container } = render(<ErrorMessage message="Error occurred" />);
    expect(container.querySelector('.bg-red-50')).toBeInTheDocument();
  });

  it('renders warning variant when specified', () => {
    const { container } = render(<ErrorMessage message="Warning" variant="warning" />);
    expect(container.querySelector('.bg-yellow-50')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = jest.fn();
    render(<ErrorMessage message="Error" onDismiss={onDismiss} />);

    const dismissButton = screen.getByLabelText('Dismiss');
    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not render dismiss button when onDismiss is not provided', () => {
    render(<ErrorMessage message="Error" />);
    expect(screen.queryByLabelText('Dismiss')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ErrorMessage message="Error" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

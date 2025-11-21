import { render, screen } from '@testing-library/react'
import Home from './page'

describe('Home Page', () => {
  it('should render the main heading', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AI-Powered Document Processing')
  })

  it('should render the description', () => {
    render(<Home />)
    expect(screen.getByText(/Automatically classify and extract structured data/)).toBeInTheDocument()
  })

  it('should render feature cards', () => {
    render(<Home />)
    expect(screen.getByText('Upload Documents')).toBeInTheDocument()
    expect(screen.getByText('View Documents')).toBeInTheDocument()
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('should render Get Started button', () => {
    render(<Home />)
    expect(screen.getByRole('link', { name: /Get Started/i })).toBeInTheDocument()
  })
})

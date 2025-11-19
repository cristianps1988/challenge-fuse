import { render, screen } from '@testing-library/react'
import Home from './page'

describe('Home Page', () => {
  it('should render the main heading', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Fuse Finance')
  })

  it('should render the description', () => {
    render(<Home />)
    expect(screen.getByText('Document Processing MVP')).toBeInTheDocument()
  })

  it('should render main element with correct classes', () => {
    render(<Home />)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('min-h-screen', 'p-8')
  })

  it('should render heading with correct styles', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveClass('text-3xl', 'font-bold')
  })
})

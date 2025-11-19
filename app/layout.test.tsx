import { render, screen } from '@testing-library/react'
import RootLayout, { metadata } from './layout'

describe('RootLayout', () => {
  it('should render children', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should render html tag with lang attribute', () => {
    const { container } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )
    const html = container.querySelector('html')
    expect(html).toHaveAttribute('lang', 'en')
  })

  it('should render body element', () => {
    const { container } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )
    const body = container.querySelector('body')
    expect(body).toBeInTheDocument()
  })
})

describe('metadata', () => {
  it('should have correct title', () => {
    expect(metadata.title).toBe('Fuse Finance - Document Processing')
  })

  it('should have correct description', () => {
    expect(metadata.description).toBe('AI-powered document classification and extraction for loan origination')
  })
})

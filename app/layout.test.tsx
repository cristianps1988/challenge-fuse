import { metadata } from './layout'

describe('RootLayout metadata', () => {
  it('should have correct title', () => {
    expect(metadata.title).toBe('Fuse Finance - Document Processing')
  })

  it('should have correct description', () => {
    expect(metadata.description).toBe('AI-powered document classification and extraction for loan origination')
  })
})

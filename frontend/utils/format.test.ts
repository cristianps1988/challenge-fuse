import { formatCurrency, formatDate, truncateText } from './format'

describe('format utilities', () => {
  describe('formatCurrency', () => {
    it('should format number as USD by default', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('should format number with custom currency', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56')
    })

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should handle negative numbers', () => {
      expect(formatCurrency(-50)).toBe('-$50.00')
    })
  })

  describe('formatDate', () => {
    it('should format Date object', () => {
      const date = new Date('2024-01-15T12:00:00')
      expect(formatDate(date)).toBe('January 15, 2024')
    })

    it('should format date string', () => {
      expect(formatDate('2024-01-15T12:00:00')).toBe('January 15, 2024')
    })
  })

  describe('truncateText', () => {
    it('should not truncate text shorter than maxLength', () => {
      expect(truncateText('Hello', 10)).toBe('Hello')
    })

    it('should truncate text longer than maxLength', () => {
      expect(truncateText('Hello World!', 8)).toBe('Hello Wo...')
    })

    it('should handle exact length', () => {
      expect(truncateText('Hello', 5)).toBe('Hello')
    })

    it('should handle empty string', () => {
      expect(truncateText('', 5)).toBe('')
    })
  })
})

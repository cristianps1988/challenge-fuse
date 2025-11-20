import '@testing-library/jest-dom'

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}))

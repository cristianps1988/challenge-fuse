import '@testing-library/jest-dom'
import path from 'path'
import fs from 'fs'

process.env.DATABASE_PATH = ':memory:'
process.env.UPLOADS_DIR = path.join(process.cwd(), 'data', 'test-uploads')

const testUploadsDir = process.env.UPLOADS_DIR;
if (fs.existsSync(testUploadsDir)) {
  fs.rmSync(testUploadsDir, { recursive: true, force: true });
}
fs.mkdirSync(testUploadsDir, { recursive: true });

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}))

afterAll(() => {
  if (fs.existsSync(testUploadsDir)) {
    fs.rmSync(testUploadsDir, { recursive: true, force: true });
  }
});

import { validateEnv } from './env.js';

const VALID_SECRET = 'x'.repeat(32);

describe('validateEnv', () => {
  const ORIGINAL = process.env;
  beforeEach(() => { process.env = { ...ORIGINAL }; });
  afterEach(() => { process.env = ORIGINAL; vi.restoreAllMocks(); });

  it('throws when DATABASE_URL is missing', () => {
    process.env.JWT_SECRET = VALID_SECRET;
    delete process.env.DATABASE_URL;
    expect(() => validateEnv()).toThrow(/DATABASE_URL is not set/);
  });

  it('throws when JWT_SECRET is missing', () => {
    process.env.DATABASE_URL = 'postgresql://localhost/db';
    delete process.env.JWT_SECRET;
    expect(() => validateEnv()).toThrow(/JWT_SECRET is not set/);
  });

  it('lists both problems when both required vars are missing', () => {
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
    expect(() => validateEnv()).toThrow(/DATABASE_URL is not set[\s\S]*JWT_SECRET is not set/);
  });

  it('throws when JWT_SECRET is shorter than 32 characters', () => {
    process.env.DATABASE_URL = 'postgresql://localhost/db';
    process.env.JWT_SECRET = 'too-short';
    expect(() => validateEnv()).toThrow(/JWT_SECRET is too short/);
  });

  it('passes when both required vars are set and the secret is long enough', () => {
    process.env.DATABASE_URL = 'postgresql://localhost/db';
    process.env.JWT_SECRET = VALID_SECRET;
    delete process.env.NODE_ENV;
    expect(() => validateEnv()).not.toThrow();
  });

  it('warns but does not throw in production when RESEND_API_KEY is missing', () => {
    process.env.DATABASE_URL = 'postgresql://localhost/db';
    process.env.JWT_SECRET = VALID_SECRET;
    process.env.NODE_ENV = 'production';
    process.env.EMAIL_FROM = 'noreply@example.com';
    delete process.env.RESEND_API_KEY;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => validateEnv()).not.toThrow();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('RESEND_API_KEY'));
  });

  it('warns in production when EMAIL_FROM is missing', () => {
    process.env.DATABASE_URL = 'postgresql://localhost/db';
    process.env.JWT_SECRET = VALID_SECRET;
    process.env.NODE_ENV = 'production';
    process.env.RESEND_API_KEY = 're_test';
    delete process.env.EMAIL_FROM;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    validateEnv();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('EMAIL_FROM'));
  });

  it('does not warn about email config outside production', () => {
    process.env.DATABASE_URL = 'postgresql://localhost/db';
    process.env.JWT_SECRET = VALID_SECRET;
    process.env.NODE_ENV = 'development';
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    validateEnv();
    expect(spy).not.toHaveBeenCalled();
  });
});

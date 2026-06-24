import crypto from 'node:crypto';
import { isCommonPassword, genCode, hashCode, EMAIL_RE } from './account.js';

// account.js imports db.js (which calls neon() at import) and email.js; stub
// both so these pure-function tests need no DB connection or mailer.
vi.mock('./db.js', () => ({ sql: vi.fn() }));
vi.mock('./email.js', () => ({ deliverCode: vi.fn() }));

describe('isCommonPassword', () => {
  it('rejects an exact common password', () => {
    expect(isCommonPassword('password123')).toBe(true);
  });

  it('rejects a common password regardless of case', () => {
    expect(isCommonPassword('LETMEIN')).toBe(true);
  });

  it('accepts a strong password not in the blocklist', () => {
    expect(isCommonPassword('correct-horse-battery-staple-92')).toBe(false);
  });
});

describe('genCode', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns a 6-character code', () => {
    expect(genCode()).toHaveLength(6);
  });

  it('contains only digits', () => {
    expect(genCode()).toMatch(/^\d{6}$/);
  });

  it('pads numbers shorter than 6 digits with leading zeros', () => {
    vi.spyOn(crypto, 'randomInt').mockReturnValue(42);
    expect(genCode()).toBe('000042');
  });
});

describe('hashCode', () => {
  it('produces a 64-character hex SHA-256 digest', () => {
    expect(hashCode('123456')).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic for the same input', () => {
    expect(hashCode('123456')).toBe(hashCode('123456'));
  });

  it('produces different hashes for different codes', () => {
    expect(hashCode('123456')).not.toBe(hashCode('654321'));
  });

  it('never returns the plaintext code', () => {
    expect(hashCode('123456')).not.toContain('123456');
  });
});

describe('EMAIL_RE', () => {
  it('accepts plus-addressing and subdomains', () => {
    expect(EMAIL_RE.test('a+x@mail.b.co')).toBe(true);
  });

  it('rejects an address with no @', () => {
    expect(EMAIL_RE.test('abc.example.com')).toBe(false);
  });

  it('rejects an address containing a space', () => {
    expect(EMAIL_RE.test('a b@example.com')).toBe(false);
  });

  it('rejects an address with no dot in the domain', () => {
    expect(EMAIL_RE.test('a@b')).toBe(false);
  });
});

import { api, setUnauthorizedHandler } from './api.js';

const mockFetch = ({ ok, status, data }) =>
  vi.fn().mockResolvedValue({ ok, status, json: () => Promise.resolve(data) });

beforeEach(() => { setUnauthorizedHandler(null); });
afterEach(() => { vi.restoreAllMocks(); delete global.fetch; });

describe('api', () => {
  it('throws an Error carrying status and data on a non-2xx response', async () => {
    global.fetch = mockFetch({ ok: false, status: 400, data: { error: 'Title is required' } });
    const err = await api('/items', { method: 'POST', body: {} }).catch((e) => e);
    expect(err.message).toBe('Title is required');
    expect(err.status).toBe(400);
    expect(err.data).toEqual({ error: 'Title is required' });
  });

  it('flags sessionExpired and calls the handler on a 401 from a protected path', async () => {
    global.fetch = mockFetch({ ok: false, status: 401, data: { error: 'Not authenticated' } });
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    const err = await api('/items/1', { method: 'DELETE' }).catch((e) => e);
    expect(err.sessionExpired).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not flag sessionExpired for a 401 from an /auth/ path', async () => {
    global.fetch = mockFetch({ ok: false, status: 401, data: { error: 'Invalid email or password' } });
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    const err = await api('/auth/login', { method: 'POST', body: {} }).catch((e) => e);
    expect(err.status).toBe(401);
    expect(err.sessionExpired).toBeUndefined();
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns the parsed JSON on a 2xx response', async () => {
    global.fetch = mockFetch({ ok: true, status: 200, data: { items: [{ id: '1' }] } });
    await expect(api('/items')).resolves.toEqual({ items: [{ id: '1' }] });
  });

  it('always sends credentials: include', async () => {
    const fetchMock = mockFetch({ ok: true, status: 200, data: {} });
    global.fetch = fetchMock;
    await api('/items');
    expect(fetchMock).toHaveBeenCalledWith('/api/items', expect.objectContaining({ credentials: 'include' }));
  });
});

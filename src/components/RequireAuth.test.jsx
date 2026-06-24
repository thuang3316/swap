import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { RequireAuth } from './RequireAuth.jsx';
import { useAuth } from '../lib/auth.jsx';

vi.mock('../lib/auth.jsx', () => ({ useAuth: vi.fn() }));

// Renders the /login target so we can read the `expired` flag RequireAuth passes
// in navigation state.
function LoginProbe() {
  const location = useLocation();
  return <span data-testid="expired">{String(Boolean(location.state?.expired))}</span>;
}

// A fresh element each call — passing a stable reference to rerender() makes
// React bail out and skip re-reading the (re-mocked) useAuth.
const tree = () => (
  <MemoryRouter initialEntries={['/profile']}>
    <Routes>
      <Route path="/profile" element={<RequireAuth><div>Secret content</div></RequireAuth>} />
      <Route path="/login" element={<LoginProbe />} />
    </Routes>
  </MemoryRouter>
);

const signedIn = () => ({ user: { username: 'jane' }, loading: false, refresh: vi.fn().mockResolvedValue() });
const signedOut = () => ({ user: null, loading: false, refresh: vi.fn().mockResolvedValue() });

afterEach(() => { vi.clearAllMocks(); });

describe('RequireAuth', () => {
  it('renders the protected content when a user is signed in', () => {
    useAuth.mockReturnValue(signedIn());
    render(tree());
    expect(screen.getByText('Secret content')).toBeInTheDocument();
  });

  it('redirects a never-signed-in visitor to /login without an expired flag', () => {
    useAuth.mockReturnValue(signedOut());
    render(tree());
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
    expect(screen.getByTestId('expired')).toHaveTextContent('false');
  });

  it('redirects with an expired flag when a session existed then disappeared', () => {
    useAuth.mockReturnValue(signedIn());
    const { rerender } = render(tree());
    useAuth.mockReturnValue(signedOut()); // cookie expired
    rerender(tree());
    expect(screen.getByTestId('expired')).toHaveTextContent('true');
  });
});

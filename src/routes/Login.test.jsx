import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { Login } from './Login.jsx';

// Login only needs setUser from the auth context for these render-state tests.
vi.mock('../lib/auth.jsx', () => ({ useAuth: () => ({ setUser: vi.fn() }) }));

const renderLogin = (entry) =>
  render(<MemoryRouter initialEntries={[entry]}><Login /></MemoryRouter>);

describe('Login', () => {
  it('shows the session-expired notice when redirected with state.expired', () => {
    renderLogin({ pathname: '/login', state: { expired: true } });
    expect(screen.getByText(/session expired/i)).toBeInTheDocument();
  });

  it('does not show the expired notice on a normal visit', () => {
    renderLogin('/login');
    expect(screen.queryByText(/session expired/i)).not.toBeInTheDocument();
  });
});

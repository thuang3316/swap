import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { Nav } from './Nav.jsx';
import { useAuth } from '../lib/auth.jsx';

vi.mock('../lib/auth.jsx', () => ({ useAuth: vi.fn() }));

const renderNav = () => render(<MemoryRouter><Nav /></MemoryRouter>);

afterEach(() => { vi.clearAllMocks(); });

describe('Nav', () => {
  it('shows Sign in and Sign up when logged out', () => {
    useAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() });
    renderNav();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });

  it('shows the username and Sign out when logged in', () => {
    useAuth.mockReturnValue({ user: { username: 'jane' }, loading: false, logout: vi.fn() });
    renderNav();
    expect(screen.getByText('Hi, jane')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
    expect(screen.queryByText('Sign in')).not.toBeInTheDocument();
  });
});

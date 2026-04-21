import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import App from './App';

vi.mock('react-firebase-hooks/auth', () => ({
  useAuthState: vi.fn(),
}));

vi.mock('./pages/Login', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}));

vi.mock('./pages/Dashboard', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>
}));

vi.mock('./pages/Onboarding', () => ({
  default: () => <div data-testid="onboarding-page">Onboarding Page</div>
}));

describe('App', () => {
  it('renders loading state for protected routes initially', () => {
    (useAuthState as any).mockReturnValue([null, true]);
    const { container } = render(<App />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders login page when not authenticated and trying to access dashboard (via root /)', () => {
    (useAuthState as any).mockReturnValue([null, false]);
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('renders dashboard when authenticated', () => {
    (useAuthState as any).mockReturnValue([{ uid: '123' }, false]);
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('renders onboarding when authenticated', () => {
    (useAuthState as any).mockReturnValue([{ uid: '123' }, false]);
    window.history.pushState({}, '', '/onboarding');
    render(<App />);
    expect(screen.getByTestId('onboarding-page')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from './Dashboard';
import { auth } from '../lib/firebase';

vi.mock('../lib/firebase', () => ({
  auth: {
    signOut: vi.fn(),
    currentUser: null,
  }
}));

const originalWindowLocation = window.location;

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).location;
    window.location = { ...originalWindowLocation, href: '' } as any;

    // Default mock user
    (auth as any).currentUser = {
      displayName: 'Test User',
      email: 'test@example.com',
      phoneNumber: null,
    };
  });

  afterAll(() => {
    window.location = originalWindowLocation;
  });

  it('renders default Overview tab content', () => {
    render(<Dashboard />);
    expect(screen.getByText('Total Bills Due')).toBeInTheDocument();
    expect(screen.getByText('Next Appointment')).toBeInTheDocument();
    expect(screen.getByText('Active Renewals')).toBeInTheDocument();
    expect(screen.getByText('Shopping Items')).toBeInTheDocument();
  });

  it('navigates to Bills tab', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    const { unmount } = render(<Dashboard />);
    fireEvent.click(screen.getByText('Bills'));
    expect(screen.getByText('Upcoming Bills')).toBeInTheDocument();
    expect(screen.getAllByText('Electricity Bill').length).toBeGreaterThan(0);
  });

  it('navigates to Tickets tab', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    render(<Dashboard />);
    fireEvent.click(screen.getByText('Tickets'));
    expect(screen.getByText('Active Tickets')).toBeInTheDocument();
    expect(screen.getByText('No active support tickets.')).toBeInTheDocument();
  });

  it('navigates back to Overview tab', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    render(<Dashboard />);
    fireEvent.click(screen.getByText('Bills'));
    fireEvent.click(screen.getByText('Overview'));
    expect(screen.getByText('Total Bills Due')).toBeInTheDocument();
  });

  it('handles logout', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    render(<Dashboard />);
    fireEvent.click(screen.getByText('Logout'));
    expect(auth.signOut).toHaveBeenCalled();
    expect(window.location.href).toBe('/login');
  });

  it('toggles mobile menu', () => {
    // Force small screen
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });

    render(<Dashboard />);

    // Open mobile menu
    const menuButton = screen.getAllByRole('button').find(b => b.classList.contains('lg:hidden'));
    fireEvent.click(menuButton!);

    // Check if overlay exists by looking for the backdrop div
    const overlay = document.querySelector('.bg-gray-900\\/50');
    expect(overlay).toBeInTheDocument();

    // Close mobile menu by clicking overlay
    fireEvent.click(overlay!);
    expect(document.querySelector('.bg-gray-900\\/50')).not.toBeInTheDocument();
  });

  it('closes mobile menu when clicking a sidebar item', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    render(<Dashboard />);

    const menuButton = screen.getAllByRole('button').find(b => b.classList.contains('lg:hidden'));
    fireEvent.click(menuButton!);

    // The sidebar items don't have text on small screens, so we click the button containing the SVG
    // Sidebar items are the first 3 buttons inside nav
    const navButtons = document.querySelectorAll('nav button');
    fireEvent.click(navButtons[1]); // Bills
    expect(document.querySelector('.bg-gray-900\\/50')).not.toBeInTheDocument();
  });

  it('toggles desktop sidebar', () => {
    // Force large screen
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });

    render(<Dashboard />);

    const toggleSidebarBtn = screen.getAllByRole('button').find(b => b.classList.contains('hidden') && b.classList.contains('lg:block'));

    // Click to collapse
    fireEvent.click(toggleSidebarBtn!);

    // Label should be empty when collapsed
    expect(screen.queryByText('My Orbit', { selector: 'span' })).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(toggleSidebarBtn!);
    expect(screen.getByText('My Orbit')).toBeInTheDocument();
  });

  it('renders correctly without user info (fallback values)', () => {
    (auth as any).currentUser = null;
    render(<Dashboard />);
    expect(screen.getByText('Welcome back, User!')).toBeInTheDocument();
    expect(screen.getByText('U')).toBeInTheDocument(); // The avatar initial
  });

  it('renders correctly with phone user', () => {
    (auth as any).currentUser = {
      displayName: null,
      email: null,
      phoneNumber: '+1234567890'
    };
    render(<Dashboard />);
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
  });
});

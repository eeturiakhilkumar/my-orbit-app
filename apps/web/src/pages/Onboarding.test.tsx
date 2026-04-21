import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Onboarding from './Onboarding';
import api from '../lib/api';
import { auth } from '../lib/firebase';

vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

vi.mock('../lib/firebase', () => ({
  auth: {
    currentUser: null
  }
}));

const originalWindowLocation = window.location;

describe('Onboarding Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).location;
    window.location = { ...originalWindowLocation, href: '' } as any;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    window.location = originalWindowLocation;
  });

  it('renders loading state initially', () => {
    (api.get as any).mockImplementation(() => new Promise(() => {})); // pending promise
    const { container } = render(<Onboarding />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('fetches user data and populates form', async () => {
    (api.get as any).mockResolvedValue({
      data: { email: 'test@example.com', phone_number: '+1234567890', display_name: 'Test User' }
    });

    render(<Onboarding />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    });
  });

  it('uses auth currentUser display name fallback if api display name is empty', async () => {
    (auth as any).currentUser = { displayName: 'Auth Name' };
    (api.get as any).mockResolvedValue({
      data: { email: 'test@example.com', phone_number: '+1234567890', display_name: null }
    });

    render(<Onboarding />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Auth Name')).toBeInTheDocument();
    });
  });

  it('handles fetch error gracefully', async () => {
    (api.get as any).mockRejectedValue(new Error('Fetch failed'));

    render(<Onboarding />);

    await waitFor(() => {
      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
    });
  });

  it('shows error if mandatory fields are cleared', async () => {
    (api.get as any).mockResolvedValue({ data: {} });

    render(<Onboarding />);

    await waitFor(() => {
      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
    });

    fireEvent.submit(screen.getByText('Start Using My Orbit').closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Email and Phone Number are mandatory.')).toBeInTheDocument();
    });
  });

  it('submits form successfully and redirects to dashboard', async () => {
    (api.get as any).mockResolvedValue({ data: {} });
    (api.post as any).mockResolvedValue({});

    render(<Onboarding />);

    await waitFor(() => {
      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '+1987654321' } });

    fireEvent.submit(screen.getByText('Start Using My Orbit').closest('form')!);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/users/sync', {
        email: 'new@example.com',
        phone_number: '+1987654321',
        display_name: 'New User'
      });
      expect(window.location.href).toBe('/dashboard');
    });
  });

  it('shows error if submission fails', async () => {
    (api.get as any).mockResolvedValue({ data: {} });
    (api.post as any).mockRejectedValue(new Error('Submit failed'));

    render(<Onboarding />);

    await waitFor(() => {
      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '+1987654321' } });

    fireEvent.submit(screen.getByText('Start Using My Orbit').closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Failed to save your details. Please check if the email or phone is already in use.')).toBeInTheDocument();
    });
  });

  it('covers empty response data defaults (email and phone)', async () => {
    (auth as any).currentUser = { displayName: null }; // no auth display name
    (api.get as any).mockResolvedValue({
      data: { email: null, phone_number: undefined, display_name: null }
    });

    render(<Onboarding />);

    await waitFor(() => {
      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
    });

    // Inputs will be empty, which means value=""
    expect((screen.getByLabelText(/Email Address/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Phone Number/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Full Name/i) as HTMLInputElement).value).toBe('');
  });
});

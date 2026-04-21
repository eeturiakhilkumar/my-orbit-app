import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import { signInWithPopup, signInWithPhoneNumber } from 'firebase/auth';
import api from '../lib/api';

vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  signInWithPhoneNumber: vi.fn(),
}));

vi.mock('../lib/firebase', () => ({
  auth: {},
  googleProvider: {},
  setupRecaptcha: vi.fn(),
}));

vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

const originalWindowLocation = window.location;

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { ...originalWindowLocation, href: '' },
      writable: true,
      configurable: true
    });
    delete (window as any).recaptchaVerifier;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    Object.defineProperty(window, 'location', {
      value: originalWindowLocation,
      writable: true,
      configurable: true
    });
  });

  describe('Google Sign In', () => {
    it('redirects to dashboard if user exists (Google)', async () => {
      (signInWithPopup as any).mockResolvedValue({ user: { email: 'test@test.com' } });
      (api.get as any).mockResolvedValue({ data: { phone_number: '123', email: 'test@test.com' } });

      render(<Login />);
      fireEvent.click(screen.getByText(/Google/i));

      await waitFor(() => {
        expect(window.location.href).toBe('/dashboard');
      });
    });

    it('redirects to onboarding if user lacks details (Google)', async () => {
      (signInWithPopup as any).mockResolvedValue({ user: { email: 'test@test.com' } });
      (api.get as any).mockResolvedValue({ data: { phone_number: null, email: 'test@test.com' } });

      render(<Login />);
      fireEvent.click(screen.getByText(/Google/i));

      await waitFor(() => {
        expect(window.location.href).toBe('/onboarding');
      });
    });

    it('syncs new user and redirects to onboarding (Google)', async () => {
      (signInWithPopup as any).mockResolvedValue({
        user: { email: 'test@test.com', displayName: 'Test', photoURL: 'url' }
      });
      (api.get as any).mockRejectedValue({ response: { status: 404 } });
      (api.post as any).mockResolvedValue({});

      render(<Login />);
      fireEvent.click(screen.getByText(/Google/i));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/users/sync', {
          email: 'test@test.com',
          display_name: 'Test',
          photo_url: 'url'
        });
        expect(window.location.href).toBe('/onboarding');
      });
    });

    it('displays error if sync fails (Google)', async () => {
      (signInWithPopup as any).mockResolvedValue({ user: { email: 'test@test.com' } });
      (api.get as any).mockRejectedValue({ response: { status: 500 }, message: 'Server error' });

      render(<Login />);
      fireEvent.click(screen.getByText(/Google/i));

      await waitFor(() => {
        expect(screen.getByText(/Backend sync failed: Server error/)).toBeInTheDocument();
      });
    });

    it('displays error if sync fails without message (Google)', async () => {
      (signInWithPopup as any).mockResolvedValue({ user: { email: 'test@test.com' } });
      (api.get as any).mockRejectedValue({ response: { status: 500 } }); // no message

      render(<Login />);
      fireEvent.click(screen.getByText(/Google/i));

      await waitFor(() => {
        expect(screen.getByText(/Backend sync failed: Unknown error/)).toBeInTheDocument();
      });
    });

    it('displays error if Google login fails', async () => {
      (signInWithPopup as any).mockRejectedValue(new Error('Firebase error'));

      render(<Login />);
      fireEvent.click(screen.getByText(/Google/i));

      await waitFor(() => {
        expect(screen.getByText(/Google Login failed: Firebase error/)).toBeInTheDocument();
      });
    });

    it('displays default error if Google login fails without message', async () => {
      (signInWithPopup as any).mockRejectedValue({});

      render(<Login />);
      fireEvent.click(screen.getByText(/Google/i));

      await waitFor(() => {
        expect(screen.getByText(/Google Login failed: Please check your Firebase configuration./)).toBeInTheDocument();
      });
    });
  });

  describe('Phone Sign In', () => {
    it('validates phone number on input', async () => {
      render(<Login />);
      const input = screen.getByLabelText(/Phone Number/i);
      const button = screen.getByText(/Send OTP/i);

      expect(button).toBeDisabled();

      fireEvent.change(input, { target: { value: '+123' } }); // too short
      expect(button).toBeDisabled();

      fireEvent.change(input, { target: { value: '123456789' } }); // 9 digits
      expect(button).toBeDisabled();

      fireEvent.change(input, { target: { value: '1234567890' } }); // 10 digits
      expect(button).not.toBeDisabled();

      fireEvent.change(input, { target: { value: '+1234567890' } }); // + and 10 digits
      expect(button).not.toBeDisabled();
    });

    it('sends OTP and switches to OTP view', async () => {
      (signInWithPhoneNumber as any).mockResolvedValue({ confirm: vi.fn() });
      (window as any).recaptchaVerifier = { clear: vi.fn() };

      render(<Login />);
      fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '+1234567890' } });
      fireEvent.click(screen.getByText(/Send OTP/i));

      await waitFor(() => {
        expect(screen.getByLabelText(/Verification Code/i)).toBeInTheDocument();
      });
    });

    it('formats 10 digit number to add +91', async () => {
      (signInWithPhoneNumber as any).mockResolvedValue({ confirm: vi.fn() });
      (window as any).recaptchaVerifier = { clear: vi.fn() };

      render(<Login />);
      fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '1234567890' } });
      fireEvent.click(screen.getByText(/Send OTP/i));

      await waitFor(() => {
        expect(signInWithPhoneNumber).toHaveBeenCalledWith(expect.anything(), '+911234567890', expect.anything());
      });
    });

    it('formats number starting with 0', async () => {
      (signInWithPhoneNumber as any).mockResolvedValue({ confirm: vi.fn() });
      (window as any).recaptchaVerifier = { clear: vi.fn() };

      render(<Login />);
      // 0 followed by 10 digits
      fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '01234567890' } });
      // Because validatePhone expects exact 10 digits or starting with +, 01234567890 is 11 digits, which makes the button disabled.
      // Let's force form submit since the button might be disabled.
      fireEvent.submit(screen.getByLabelText(/Phone Number/i).closest('form')!);

      await waitFor(() => {
        // Since it's 10 digits after removing 0, it adds +91
        expect(signInWithPhoneNumber).toHaveBeenCalledWith(expect.anything(), '+911234567890', expect.anything());
      });
    });

    it('shows error if invalid formatted phone on submit', async () => {
      render(<Login />);
      const input = screen.getByLabelText(/Phone Number/i);
      fireEvent.change(input, { target: { value: '+1234567' } }); // valid via validatePhone, invalid via format check inside submit
      fireEvent.click(screen.getByText(/Send OTP/i));

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid 10-digit mobile number./)).toBeInTheDocument();
      });
    });

    it('shows error if send OTP fails and clears recaptcha', async () => {
      (signInWithPhoneNumber as any).mockRejectedValue(new Error('Failed'));
      const mockClear = vi.fn();
      (window as any).recaptchaVerifier = { clear: mockClear };

      render(<Login />);
      fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '+1234567890' } });
      fireEvent.click(screen.getByText(/Send OTP/i));

      await waitFor(() => {
        expect(screen.getByText(/Failed to send OTP/)).toBeInTheDocument();
        expect(mockClear).toHaveBeenCalled();
        expect((window as any).recaptchaVerifier).toBeFalsy();
      });
    });

    it('shows error if send OTP fails and no recaptcha to clear', async () => {
      (signInWithPhoneNumber as any).mockRejectedValue(new Error('Failed'));

      render(<Login />);
      fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '+1234567890' } });
      fireEvent.click(screen.getByText(/Send OTP/i));

      await waitFor(() => {
        expect(screen.getByText(/Failed to send OTP/)).toBeInTheDocument();
      });
    });
  });

  describe('OTP Submit', () => {
    let mockConfirm: any;
    beforeEach(async () => {
      mockConfirm = vi.fn();
      (signInWithPhoneNumber as any).mockResolvedValue({ confirm: mockConfirm });
      (window as any).recaptchaVerifier = { clear: vi.fn() };
    });

    const setupOtpView = async () => {
      render(<Login />);
      fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '+1234567890' } });
      fireEvent.click(screen.getByText(/Send OTP/i));
      await waitFor(() => {
        expect(screen.getByLabelText(/Verification Code/i)).toBeInTheDocument();
      });
    };

    it('shows error if OTP is empty on submit', async () => {
      await setupOtpView();
      // Form submit prevents default if required attribute is active, but we test the function
      fireEvent.submit(screen.getByLabelText(/Verification Code/i).closest('form')!);
      await waitFor(() => {
        expect(screen.getByText(/Please enter the verification code./)).toBeInTheDocument();
      });
    });

    it('allows changing number (resets view)', async () => {
      await setupOtpView();
      fireEvent.click(screen.getByText(/Change number/i));
      expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
    });

    it('redirects to dashboard on successful OTP and user exists', async () => {
      await setupOtpView();
      mockConfirm.mockResolvedValue({ user: { phoneNumber: '+1234567890' } });
      (api.get as any).mockResolvedValue({ data: { phone_number: '123', email: 'test@test.com' } });

      fireEvent.change(screen.getByLabelText(/Verification Code/i), { target: { value: '123456' } });
      fireEvent.click(screen.getByText(/Verify OTP/i));

      await waitFor(() => {
        expect(window.location.href).toBe('/dashboard');
      });
    });

    it('redirects to onboarding if user lacks email', async () => {
      await setupOtpView();
      mockConfirm.mockResolvedValue({ user: { phoneNumber: '+1234567890' } });
      (api.get as any).mockResolvedValue({ data: { phone_number: '123', email: null } });

      fireEvent.change(screen.getByLabelText(/Verification Code/i), { target: { value: '123456' } });
      fireEvent.click(screen.getByText(/Verify OTP/i));

      await waitFor(() => {
        expect(window.location.href).toBe('/onboarding');
      });
    });

    it('syncs new user and redirects to onboarding', async () => {
      await setupOtpView();
      mockConfirm.mockResolvedValue({ user: { phoneNumber: '+1234567890' } });
      (api.get as any).mockRejectedValue({ response: { status: 404 } });
      (api.post as any).mockResolvedValue({});

      fireEvent.change(screen.getByLabelText(/Verification Code/i), { target: { value: '123456' } });
      fireEvent.click(screen.getByText(/Verify OTP/i));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/users/sync', { phone_number: '+1234567890' });
        expect(window.location.href).toBe('/onboarding');
      });
    });

    it('displays error if sync fails', async () => {
      await setupOtpView();
      mockConfirm.mockResolvedValue({ user: { phoneNumber: '+1234567890' } });
      (api.get as any).mockRejectedValue({ response: { status: 500 }, message: 'Server err' });

      fireEvent.change(screen.getByLabelText(/Verification Code/i), { target: { value: '123456' } });
      fireEvent.click(screen.getByText(/Verify OTP/i));

      await waitFor(() => {
        expect(screen.getByText(/Backend sync failed: Server err/)).toBeInTheDocument();
      });
    });

    it('displays error if OTP verification fails', async () => {
      await setupOtpView();
      mockConfirm.mockRejectedValue(new Error('Invalid code'));

      fireEvent.change(screen.getByLabelText(/Verification Code/i), { target: { value: '123456' } });
      fireEvent.click(screen.getByText(/Verify OTP/i));

      await waitFor(() => {
        expect(screen.getByText(/Verification failed: Invalid code/)).toBeInTheDocument();
      });
    });

    it('displays default error if OTP verification fails without message', async () => {
      await setupOtpView();
      mockConfirm.mockRejectedValue({});

      fireEvent.change(screen.getByLabelText(/Verification Code/i), { target: { value: '123456' } });
      fireEvent.click(screen.getByText(/Verify OTP/i));

      await waitFor(() => {
        expect(screen.getByText(/Verification failed: Invalid code. Please try again./)).toBeInTheDocument();
      });
    });
  });
});

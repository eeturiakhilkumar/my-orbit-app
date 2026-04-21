import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupRecaptcha, app, auth, googleProvider } from './firebase';

vi.mock('firebase/app', () => {
  return {
    initializeApp: vi.fn().mockReturnValue({}),
    getApps: vi.fn().mockReturnValue([]),
    getApp: vi.fn().mockReturnValue({})
  };
});

vi.mock('firebase/auth', () => {
  return {
    getAuth: vi.fn().mockReturnValue({}),
    GoogleAuthProvider: class {},
    RecaptchaVerifier: class {
      auth: any;
      containerId: any;
      options: any;
      constructor(auth: any, containerId: any, options: any) {
        this.auth = auth;
        this.containerId = containerId;
        this.options = options;
      }
    }
  };
});

describe('firebase config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).recaptchaVerifier;
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('exports app, auth, and googleProvider', () => {
    expect(app).toBeDefined();
    expect(auth).toBeDefined();
    expect(googleProvider).toBeDefined();
  });

  it('setupRecaptcha creates a new verifier if none exists', () => {
    setupRecaptcha('recaptcha-container');
    expect((window as any).recaptchaVerifier).toBeDefined();
    expect((window as any).recaptchaVerifier.containerId).toBe('recaptcha-container');

    // Call the callbacks for coverage
    (window as any).recaptchaVerifier.options.callback();
    expect(console.log).toHaveBeenCalledWith('reCAPTCHA solved');

    (window as any).recaptchaVerifier.options['expired-callback']();
    expect(console.log).toHaveBeenCalledWith('reCAPTCHA expired');
  });

  it('setupRecaptcha does not create a new verifier if one exists', () => {
    (window as any).recaptchaVerifier = { mock: true };
    setupRecaptcha('recaptcha-container');
    expect((window as any).recaptchaVerifier).toEqual({ mock: true });
  });
});

describe('firebase initialization with existing apps', () => {
  beforeEach(() => {
    vi.resetModules(); // This allows re-importing to trigger top-level code again
  });

  it('uses existing app if getApps().length > 0', async () => {
    vi.mock('firebase/app', () => {
      return {
        initializeApp: vi.fn(),
        getApps: vi.fn().mockReturnValue([{ name: '[DEFAULT]' }]),
        getApp: vi.fn().mockReturnValue({ existingApp: true })
      };
    });

    // We dynamically import to force module execution
    const { app } = await import('./firebase');
    expect(app).toEqual({ existingApp: true });
  });
});

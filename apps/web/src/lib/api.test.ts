import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import api from './api';
import { auth } from './firebase';

vi.mock('./firebase', () => ({
  auth: {
    currentUser: null
  }
}));

describe('api interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not add Authorization header if no user', async () => {
    Object.defineProperty(auth, 'currentUser', { value: null, writable: true });

    // Trigger interceptor
    const interceptor = (api.interceptors.request as any).handlers[0].fulfilled;
    const config = { headers: {} };
    const newConfig = await interceptor(config);

    expect(newConfig.headers.Authorization).toBeUndefined();
  });

  it('should add Authorization header if user exists', async () => {
    const mockGetIdToken = vi.fn().mockResolvedValue('mock-token');
    Object.defineProperty(auth, 'currentUser', { value: { getIdToken: mockGetIdToken }, writable: true });

    const interceptor = (api.interceptors.request as any).handlers[0].fulfilled;
    const config = { headers: {} };
    const newConfig = await interceptor(config);

    expect(mockGetIdToken).toHaveBeenCalledWith(true);
    expect(newConfig.headers.Authorization).toBe('Bearer mock-token');
  });

  it('should handle request with no headers defined', async () => {
    const mockGetIdToken = vi.fn().mockResolvedValue('mock-token');
    Object.defineProperty(auth, 'currentUser', { value: { getIdToken: mockGetIdToken }, writable: true });

    const interceptor = (api.interceptors.request as any).handlers[0].fulfilled;
    const config = {};
    const newConfig = await interceptor(config);

    expect(newConfig.headers).toBeUndefined();
  });

  it('should pass through rejected requests', async () => {
    const interceptor = (api.interceptors.request as any).handlers[0].rejected;
    const error = new Error('Request failed');

    await expect(interceptor(error)).rejects.toThrow('Request failed');
  });
});

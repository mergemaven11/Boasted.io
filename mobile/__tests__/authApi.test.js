jest.mock('../src/api', () => ({ api: { post: jest.fn(), get: jest.fn() } }));
jest.mock('../src/authStorage', () => ({
  setAccessToken: jest.fn(),
  clearAccessToken: jest.fn(),
}));

import { api } from '../src/api';
import { clearAccessToken, setAccessToken } from '../src/authStorage';
import { getAuthErrorMessage, login, logout, restoreSession } from '../src/authApi';

describe('mobile auth API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('normalizes email, stores the returned token, and returns the user', async () => {
    api.post.mockResolvedValue({ data: { access_token: 'token-123', user: { email: 'tee@example.com' } } });

    await expect(login('  Tee@Example.COM ', 'secret')).resolves.toEqual({ email: 'tee@example.com' });
    expect(api.post).toHaveBeenCalledWith('/auth/login', 'username=tee%40example.com&password=secret', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    expect(setAccessToken).toHaveBeenCalledWith('token-123');
  });

  it('restores the signed-in user from /auth/me', async () => {
    api.get.mockResolvedValue({ data: { name: 'Tee' } });
    await expect(restoreSession()).resolves.toEqual({ name: 'Tee' });
  });

  it('clears an expired token when /auth/me returns 401', async () => {
    const error = { response: { status: 401 } };
    api.get.mockRejectedValue(error);
    await expect(restoreSession()).rejects.toBe(error);
    expect(clearAccessToken).toHaveBeenCalledTimes(1);
  });

  it('clears local credentials on logout', async () => {
    await logout();
    expect(clearAccessToken).toHaveBeenCalledTimes(1);
  });

  it('surfaces backend auth detail and a useful offline fallback', () => {
    expect(getAuthErrorMessage({ response: { data: { detail: 'Email verification required.' } } })).toBe('Email verification required.');
    expect(getAuthErrorMessage(new Error('network'))).toMatch(/Could not reach BragStack/);
  });
});

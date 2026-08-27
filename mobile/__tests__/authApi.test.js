jest.mock('../src/api', () => ({ api: { post: jest.fn(), get: jest.fn() } }));
jest.mock('../src/authStorage', () => ({
  setAccessToken: jest.fn(),
  clearAccessToken: jest.fn(),
}));

import { api } from '../src/api';
import { clearAccessToken, setAccessToken } from '../src/authStorage';
import {
  confirmEmailVerification,
  confirmPasswordReset,
  getAuthErrorMessage,
  login,
  logout,
  register,
  requestPasswordReset,
  resendVerification,
  restoreSession,
} from '../src/authApi';

describe('mobile auth API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('normalizes email, stores the returned token, and returns the user on login', async () => {
    api.post.mockResolvedValue({ data: { access_token: 'token-123', user: { email: 'tee@example.com' } } });

    await expect(login('  Tee@Example.COM ', 'secret')).resolves.toEqual({ email: 'tee@example.com' });
    expect(api.post).toHaveBeenCalledWith('/auth/login', 'username=tee%40example.com&password=secret', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    expect(setAccessToken).toHaveBeenCalledWith('token-123');
  });

  it('registers using trimmed identity data', async () => {
    api.post.mockResolvedValue({ data: { verification_required: true, email_sent: true } });
    await expect(register(' Tee ', ' Tee@Example.COM ', 'password123')).resolves.toEqual({ verification_required: true, email_sent: true });
    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Tee',
      email: 'tee@example.com',
      password: 'password123',
    });
  });

  it('resends verification and requests password recovery with normalized email', async () => {
    api.post
      .mockResolvedValueOnce({ data: { message: 'verification sent' } })
      .mockResolvedValueOnce({ data: { message: 'reset sent' } });

    await expect(resendVerification(' Tee@Example.COM ')).resolves.toEqual({ message: 'verification sent' });
    await expect(requestPasswordReset(' Tee@Example.COM ')).resolves.toEqual({ message: 'reset sent' });
    expect(api.post).toHaveBeenNthCalledWith(1, '/auth/email-verification/resend', { email: 'tee@example.com' });
    expect(api.post).toHaveBeenNthCalledWith(2, '/auth/password-reset/request', { email: 'tee@example.com' });
  });

  it('confirms email verification, stores the token, and returns the user', async () => {
    api.post.mockResolvedValue({ data: { access_token: 'verified-token', user: { name: 'Tee' } } });
    await expect(confirmEmailVerification('verify-token-value')).resolves.toEqual({ name: 'Tee' });
    expect(api.post).toHaveBeenCalledWith('/auth/email-verification/confirm', { token: 'verify-token-value' });
    expect(setAccessToken).toHaveBeenCalledWith('verified-token');
  });

  it('confirms a password reset', async () => {
    api.post.mockResolvedValue({ data: { message: 'Password updated.' } });
    await expect(confirmPasswordReset('reset-token-value', 'new-password')).resolves.toEqual({ message: 'Password updated.' });
    expect(api.post).toHaveBeenCalledWith('/auth/password-reset/confirm', {
      token: 'reset-token-value',
      password: 'new-password',
    });
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

  it('preserves credentials for non-auth server errors', async () => {
    const error = { response: { status: 503 } };
    api.get.mockRejectedValue(error);
    await expect(restoreSession()).rejects.toBe(error);
    expect(clearAccessToken).not.toHaveBeenCalled();
  });

  it('clears local credentials on logout', async () => {
    await logout();
    expect(clearAccessToken).toHaveBeenCalledTimes(1);
  });

  it('returns specific and safe auth error messages', () => {
    expect(getAuthErrorMessage({ response: { data: { detail: 'Email verification required.' }, status: 403 } })).toBe('Email verification required.');
    expect(getAuthErrorMessage({ response: { data: { detail: { message: 'Receipt already exists.' } }, status: 409 } })).toBe('Receipt already exists.');
    expect(getAuthErrorMessage(new Error('network'))).toMatch(/Could not reach BragStack/);
    expect(getAuthErrorMessage({ response: { data: {}, status: 503 } })).toMatch(/having trouble/);
    expect(getAuthErrorMessage({ response: { data: {}, status: 400 } })).toMatch(/check your details/i);
  });
});

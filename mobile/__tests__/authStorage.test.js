jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';
import { clearAccessToken, getAccessToken, setAccessToken } from '../src/authStorage';

describe('encrypted auth storage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses the stable BragStack token key', async () => {
    SecureStore.getItemAsync.mockResolvedValue('abc');
    await expect(getAccessToken()).resolves.toBe('abc');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('bragstack.accessToken');
  });

  it('stores and deletes the token through SecureStore', async () => {
    await setAccessToken('abc');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('bragstack.accessToken', 'abc');

    await clearAccessToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('bragstack.accessToken');
  });

  it('treats an empty token as a delete', async () => {
    await setAccessToken('');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('bragstack.accessToken');
  });
});

const useRequestInterceptor = jest.fn();
const create = jest.fn(() => ({
  interceptors: { request: { use: useRequestInterceptor } },
}));

jest.mock('axios', () => ({ create }));
jest.mock('../src/authStorage', () => ({ getAccessToken: jest.fn() }));

import { getAccessToken } from '../src/authStorage';

describe('authenticated API client', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    useRequestInterceptor.mockClear();
    create.mockClear();
  });

  it('uses the configured API URL and a bounded timeout', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test';
    require('../src/api');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: 'https://api.example.test',
      timeout: 15000,
    }));
  });

  it('adds a bearer token when one exists and leaves anonymous requests alone', async () => {
    require('../src/api');
    const interceptor = useRequestInterceptor.mock.calls[0][0];

    getAccessToken.mockResolvedValueOnce('abc123');
    const signed = await interceptor({ headers: {} });
    expect(signed.headers.Authorization).toBe('Bearer abc123');

    getAccessToken.mockResolvedValueOnce(null);
    const anonymous = await interceptor({ headers: {} });
    expect(anonymous.headers.Authorization).toBeUndefined();
  });
});

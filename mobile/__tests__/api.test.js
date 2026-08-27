const mockUseRequestInterceptor = jest.fn();
const mockCreate = jest.fn(() => ({
  interceptors: { request: { use: mockUseRequestInterceptor } },
}));

jest.mock('axios', () => ({ create: mockCreate }));
jest.mock('../src/authStorage', () => ({ getAccessToken: jest.fn() }));

describe('authenticated API client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRequestInterceptor.mockClear();
    mockCreate.mockClear();
  });

  it('uses the configured API URL and a bounded timeout', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test';
    jest.isolateModules(() => {
      require('../src/api');
    });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: 'https://api.example.test',
      timeout: 15000,
    }));
  });

  it('adds a bearer token when one exists and leaves anonymous requests alone', async () => {
    const { getAccessToken } = require('../src/authStorage');
    jest.isolateModules(() => {
      require('../src/api');
    });
    const interceptor = mockUseRequestInterceptor.mock.calls[0][0];

    getAccessToken.mockResolvedValueOnce('abc123');
    const signed = await interceptor({ headers: {} });
    expect(signed.headers.Authorization).toBe('Bearer abc123');

    getAccessToken.mockResolvedValueOnce(null);
    const anonymous = await interceptor({ headers: {} });
    expect(anonymous.headers.Authorization).toBeUndefined();
  });
});

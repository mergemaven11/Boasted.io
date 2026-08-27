jest.mock('../src/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

import { api } from '../src/api';
import {
  buildEntryPayload,
  createPrivateEntry,
  getEntries,
  getImpactReceipts,
  getProductErrorMessage,
  loadProofOverview,
  updateProfile,
} from '../src/productApi';

describe('mobile product API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads entries and Impact Receipts with pagination', async () => {
    api.get
      .mockResolvedValueOnce({ data: { entries: [{ id: 'e1' }] } })
      .mockResolvedValueOnce({ data: { receipts: [{ id: 'r1' }] } });

    await expect(getEntries(5, 10)).resolves.toEqual({ entries: [{ id: 'e1' }] });
    await expect(getImpactReceipts(7, 3)).resolves.toEqual({ receipts: [{ id: 'r1' }] });
    expect(api.get).toHaveBeenNthCalledWith(1, '/entries', { params: { limit: 5, skip: 10 } });
    expect(api.get).toHaveBeenNthCalledWith(2, '/impact-receipts', { params: { limit: 7, skip: 3 } });
  });

  it('combines proof pages into a dashboard overview', async () => {
    api.get
      .mockResolvedValueOnce({ data: { total_entries: 2, entries: [{ id: 'e1' }, { id: 'e2' }] } })
      .mockResolvedValueOnce({ data: { total_receipts: 1, receipts: [{ id: 'r1' }] } });

    await expect(loadProofOverview()).resolves.toEqual({
      entries: [{ id: 'e1' }, { id: 'e2' }],
      receipts: [{ id: 'r1' }],
      totalEntries: 2,
      totalReceipts: 1,
    });
  });

  it('uses safe empty defaults when proof pages omit optional collections', async () => {
    api.get
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: {} });

    await expect(loadProofOverview()).resolves.toEqual({
      entries: [],
      receipts: [],
      totalEntries: 0,
      totalReceipts: 0,
    });
  });

  it('builds a truthful private accomplishment payload', () => {
    const payload = buildEntryPayload({
      title: '  Fixed production deploys  ',
      situation: ' Deploys were failing ',
      action: ' Added validation ',
      impact: ' Restored reliable releases ',
      category: ' Platform ',
      tags: 'Docker, CI, Docker,  ',
    });

    expect(payload).toEqual(expect.objectContaining({
      title: 'Fixed production deploys',
      situation: 'Deploys were failing',
      action: 'Added validation',
      impact: 'Restored reliable releases',
      category: 'Platform',
      entry_type: 'Current Job',
      lesson: null,
      tags: ['Docker', 'CI'],
      is_public: false,
    }));
    expect(payload.entry_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('defaults the category and rejects incomplete proof', () => {
    expect(buildEntryPayload({ title: 'Win', situation: 'Context', action: 'Action', impact: 'Impact' }).category).toBe('General');
    expect(() => buildEntryPayload({ title: 'Win', situation: '', action: 'Action', impact: 'Impact' })).toThrow(/required/);
  });

  it('persists a private accomplishment through /entries', async () => {
    api.post.mockResolvedValue({ data: { id: 'entry-1', title: 'Win' } });
    await expect(createPrivateEntry({
      title: 'Win',
      situation: 'Context',
      action: 'Action',
      impact: 'Impact',
      tags: '',
    })).resolves.toEqual({ id: 'entry-1', title: 'Win' });

    expect(api.post).toHaveBeenCalledWith('/entries', expect.objectContaining({
      title: 'Win',
      is_public: false,
    }));
  });

  it('updates profile while preserving fields not edited on mobile', async () => {
    api.patch.mockResolvedValue({ data: { name: 'Tee', headline: 'Platform Engineer' } });
    const user = {
      name: 'Old Name',
      headline: 'Old headline',
      bio: 'Old bio',
      location: 'Old location',
      github_url: 'https://github.com/example',
      portfolio_url: 'https://example.com',
      resume_url: 'https://example.com/resume.pdf',
      profile_theme: 'engineer',
      profile_primary_color: '#112233',
      profile_secondary_color: '#223344',
      profile_background_color: '#334455',
    };

    await expect(updateProfile(user, {
      name: ' Tee ',
      headline: ' Platform Engineer ',
      bio: ' Builds reliable systems ',
      location: ' Georgia ',
    })).resolves.toEqual({ name: 'Tee', headline: 'Platform Engineer' });

    expect(api.patch).toHaveBeenCalledWith('/auth/me/profile', {
      name: 'Tee',
      headline: 'Platform Engineer',
      bio: 'Builds reliable systems',
      location: 'Georgia',
      github_url: 'https://github.com/example',
      portfolio_url: 'https://example.com',
      resume_url: 'https://example.com/resume.pdf',
      profile_theme: 'engineer',
      profile_primary_color: '#112233',
      profile_secondary_color: '#223344',
      profile_background_color: '#334455',
    });
  });

  it('uses backend detail, offline, and fallback product errors safely', () => {
    expect(getProductErrorMessage({ response: { data: { detail: 'Specific problem' } } })).toBe('Specific problem');
    expect(getProductErrorMessage({ response: { data: { detail: { message: 'Structured problem' } } } })).toBe('Structured problem');
    expect(getProductErrorMessage(new Error('network'))).toMatch(/Could not reach BragStack/);
    expect(getProductErrorMessage({ response: { data: {} } }, 'Try again later')).toBe('Try again later');
  });
});

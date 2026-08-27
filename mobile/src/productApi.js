import { api } from './api';

export function getProductErrorMessage(error, fallback = 'Could not load your BragStack data.') {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail.message === 'string') return detail.message;
  if (!error?.response) return 'Could not reach BragStack. Check your connection and try again.';
  return fallback;
}

export async function getEntries(limit = 30, skip = 0) {
  const response = await api.get('/entries', { params: { limit, skip } });
  return response.data;
}

export async function getImpactReceipts(limit = 30, skip = 0) {
  const response = await api.get('/impact-receipts', { params: { limit, skip } });
  return response.data;
}

export async function loadProofOverview() {
  const [entriesPage, receiptsPage] = await Promise.all([
    getEntries(),
    getImpactReceipts(),
  ]);
  return {
    entries: entriesPage?.entries || [],
    receipts: receiptsPage?.receipts || [],
    totalEntries: Number(entriesPage?.total_entries || 0),
    totalReceipts: Number(receiptsPage?.total_receipts || 0),
  };
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function buildEntryPayload(input) {
  const title = String(input?.title || '').trim();
  const situation = String(input?.situation || '').trim();
  const action = String(input?.action || '').trim();
  const impact = String(input?.impact || '').trim();
  const category = String(input?.category || '').trim() || 'General';
  const tags = String(input?.tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!title || !situation || !action || !impact) {
    throw new Error('Title, context, action, and impact are required.');
  }

  return {
    title,
    category,
    entry_date: todayIsoDate(),
    entry_type: 'Current Job',
    situation,
    action,
    impact,
    lesson: null,
    tags: [...new Set(tags)],
    is_public: false,
  };
}

export async function createPrivateEntry(input) {
  const response = await api.post('/entries', buildEntryPayload(input));
  return response.data;
}

export async function updateProfile(user, changes) {
  const payload = {
    name: String(changes?.name ?? user?.name ?? '').trim(),
    headline: String(changes?.headline ?? user?.headline ?? '').trim(),
    bio: String(changes?.bio ?? user?.bio ?? '').trim(),
    location: String(changes?.location ?? user?.location ?? '').trim(),
    github_url: String(user?.github_url || '').trim(),
    portfolio_url: String(user?.portfolio_url || '').trim(),
    resume_url: String(user?.resume_url || '').trim(),
    profile_theme: user?.profile_theme || 'default',
    profile_primary_color: user?.profile_primary_color || '',
    profile_secondary_color: user?.profile_secondary_color || '',
    profile_background_color: user?.profile_background_color || '',
  };

  const response = await api.patch('/auth/me/profile', payload);
  return response.data;
}

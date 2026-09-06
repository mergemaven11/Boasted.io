import axios from "axios";

import { ANALYTICS_EVENTS, trackAnalyticsEvent } from "./analytics.js";
import { normalizeDashboardTags } from "./dashboardTags.js";
import {
  consumeConfidentialityAttestation,
  isConfidentialityProtectedRequest,
} from "./ndaSafety.js";

const CONFIDENTIALITY_ATTESTATION_HEADER = "X-Boasted-Confidentiality-Attestation";

function getDefaultApiBaseUrl() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

const api = axios.create({ baseURL: getDefaultApiBaseUrl() });

function getPublicBragPath(slug, suffix = "") {
  const normalizedSlug = slug?.trim();
  return normalizedSlug ? `/public/brag/${encodeURIComponent(normalizedSlug)}${suffix}` : `/public/brag${suffix}`;
}

function getPacketPayload(startDate, endDate, options = {}) {
  return {
    ...(startDate && endDate ? { start_date: startDate, end_date: endDate } : {}),
    ...(options.careerArea ? { career_area: options.careerArea } : {}),
    ...(options.roleTitle ? { role_title: options.roleTitle } : {}),
    ...(options.organization ? { organization: options.organization } : {}),
    ...(options.targetRole ? { target_role: options.targetRole } : {}),
    ...(options.targetLevel ? { target_level: options.targetLevel } : {}),
    ...(options.targetOrganization ? { target_organization: options.targetOrganization } : {}),
    ...(options.selectedEntryIds?.length ? { selected_entry_ids: options.selectedEntryIds } : {}),
    ...(options.includeEvidenceReferences ? { include_evidence_references: true } : {}),
    ...(options.credentialName ? { credential_name: options.credentialName } : {}),
    ...(options.issuingBody ? { issuing_body: options.issuingBody } : {}),
    ...(options.reviewType ? { review_type: options.reviewType } : {}),
    ...(options.requirementNotes ? { requirement_notes: options.requirementNotes } : {}),
    ...(options.programName ? { program_name: options.programName } : {}),
    ...(options.institutionName ? { institution_name: options.institutionName } : {}),
    ...(options.applicationType ? { application_type: options.applicationType } : {}),
    ...(options.applicationDeadline ? { application_deadline: options.applicationDeadline } : {}),
    ...(options.applicationPrompt ? { application_prompt: options.applicationPrompt } : {}),
    ...(options.scholarshipName ? { scholarship_name: options.scholarshipName } : {}),
    ...(options.sponsorName ? { sponsor_name: options.sponsorName } : {}),
    ...(options.awardFocus ? { award_focus: options.awardFocus } : {}),
    ...(options.scholarshipDeadline ? { scholarship_deadline: options.scholarshipDeadline } : {}),
    ...(options.essayPrompt ? { essay_prompt: options.essayPrompt } : {}),
    ...(options.portfolioTitle ? { portfolio_title: options.portfolioTitle } : {}),
    ...(options.portfolioAudience ? { portfolio_audience: options.portfolioAudience } : {}),
    ...(options.portfolioFocus ? { portfolio_focus: options.portfolioFocus } : {}),
    ...(options.projectNotes ? { project_notes: options.projectNotes } : {}),
    ...(options.targetIndustry ? { target_industry: options.targetIndustry } : {}),
    ...(options.transitionGoal ? { transition_goal: options.transitionGoal } : {}),
    ...(options.transferableSkillsFocus ? { transferable_skills_focus: options.transferableSkillsFocus } : {}),
    ...(options.transitionNotes ? { transition_notes: options.transitionNotes } : {}),
    ...(options.signatureEntryIds?.length ? { signature_entry_ids: options.signatureEntryIds } : {}),
    ...(Array.isArray(options.sections) ? { sections: options.sections } : {}),
    ...(options.packetNote ? { packet_note: options.packetNote } : {}),
    ...(options.itemNotes && Object.keys(options.itemNotes).length ? { item_notes: options.itemNotes } : {}),
    ...(options.theme ? { theme: options.theme } : {}),
    ...(options.brandName ? { brand_name: options.brandName } : {}),
    ...(options.departmentLabel ? { department_label: options.departmentLabel } : {}),
    ...(options.reviewerName ? { reviewer_name: options.reviewerName } : {}),
    ...(options.reviewCycleLabel ? { review_cycle_label: options.reviewCycleLabel } : {}),
    include_notes: options.includeNotes !== false,
    confidential: options.confidential !== false,
  };
}

function parseDownloadFilename(contentDisposition, fallback) {
  const match = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallback;
}

function packetOptionsFromPacket(packet) {
  const period = packet?.period ?? {};
  const context = packet?.context ?? {};
  const subject = packet?.subject ?? {};
  const target = packet?.target ?? {};
  const interviewPreferences = packet?.interview_preferences ?? {};
  const credentialReview = packet?.credential_review ?? {};
  const application = packet?.application_context ?? {};
  const scholarship = packet?.scholarship_context ?? {};
  const portfolio = packet?.portfolio_context ?? {};
  const transition = packet?.transition_context ?? {};
  const render = packet?.render_config ?? {};
  const annotations = packet?.annotations ?? {};
  const branding = packet?.branding ?? {};
  return {
    startDate: period.start_date,
    endDate: period.end_date,
    careerArea: context.career_area,
    roleTitle: subject.role,
    organization: context.organization,
    targetRole: target.role || transition.target_role,
    targetLevel: target.level,
    targetOrganization: target.organization,
    selectedEntryIds: interviewPreferences.selected_entry_ids,
    includeEvidenceReferences: interviewPreferences.include_evidence_references === true,
    credentialName: credentialReview.credential_name,
    issuingBody: credentialReview.issuing_body,
    reviewType: credentialReview.review_type,
    requirementNotes: credentialReview.requirement_notes,
    programName: application.program_name,
    institutionName: application.institution_name,
    applicationType: application.application_type,
    applicationDeadline: application.application_deadline,
    applicationPrompt: application.application_prompt,
    scholarshipName: scholarship.scholarship_name,
    sponsorName: scholarship.sponsor_name,
    awardFocus: scholarship.award_focus,
    scholarshipDeadline: scholarship.scholarship_deadline,
    essayPrompt: scholarship.essay_prompt,
    portfolioTitle: portfolio.portfolio_title,
    portfolioAudience: portfolio.portfolio_audience,
    portfolioFocus: portfolio.portfolio_focus,
    projectNotes: portfolio.project_notes,
    targetIndustry: transition.target_industry,
    transitionGoal: transition.transition_goal,
    transferableSkillsFocus: transition.transferable_skills_focus,
    transitionNotes: transition.transition_notes,
    signatureEntryIds: render.signature_entry_ids,
    sections: render.sections,
    theme: render.theme,
    packetNote: annotations.packet_note,
    itemNotes: annotations.item_notes,
    includeNotes: annotations.include_in_export !== false,
    brandName: branding.brand_name,
    departmentLabel: branding.department_label,
    reviewerName: branding.reviewer_name,
    reviewCycleLabel: branding.review_cycle_label,
    confidential: packet?.confidential !== false,
  };
}

async function downloadPacketFile(path, packet, fallbackFilename) {
  const options = packetOptionsFromPacket(packet);
  const response = await api.post(
    path,
    getPacketPayload(options.startDate, options.endDate, options),
    { responseType: "blob" },
  );
  return {
    blob: response.data,
    filename: parseDownloadFilename(response.headers["content-disposition"], fallbackFilename),
  };
}

async function mintServerConfidentialityAttestation(method, url, version, authToken) {
  const path = String(url || "").split("?")[0] || "/";
  const response = await axios.post(
    "/confidentiality/attestations",
    {
      version,
      method: String(method || "").toUpperCase(),
      path,
      confirmed: true,
    },
    {
      baseURL: getDefaultApiBaseUrl(),
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    },
  );
  return response.data?.attestation_token || null;
}

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("bragstack_token");
  config.headers = config.headers || {};
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const method = String(config.method || "").toLowerCase();
  const url = String(config.url || "");
  if (!isConfidentialityProtectedRequest(method, url)) return config;

  const attestationVersion = consumeConfidentialityAttestation();
  if (!attestationVersion) return config;

  const serverToken = await mintServerConfidentialityAttestation(
    method,
    url,
    attestationVersion,
    token,
  );
  if (serverToken) config.headers[CONFIDENTIALITY_ATTESTATION_HEADER] = serverToken;
  return config;
});

api.interceptors.response.use((response) => {
  const method = String(response.config?.method || "").toLowerCase();
  const url = String(response.config?.url || "").split("?")[0];

  if (method !== "post") return response;

  if (url === "/auth/register") {
    trackAnalyticsEvent(ANALYTICS_EVENTS.SIGN_UP, { method: "email_password" });
  } else if (url === "/entries") {
    trackAnalyticsEvent(ANALYTICS_EVENTS.ACCOMPLISHMENT_CREATED);
  } else if (url === "/impact-receipts") {
    trackAnalyticsEvent(ANALYTICS_EVENTS.IMPACT_RECEIPT_CREATED, { creation_source: "manual" });
  } else if (url.startsWith("/impact-receipts/from-entry/")) {
    trackAnalyticsEvent(ANALYTICS_EVENTS.IMPACT_RECEIPT_CREATED, { creation_source: "accomplishment" });
  }

  return response;
});

export async function registerUser(user) { const response = await api.post("/auth/register", user); return response.data; }
export async function loginUser(credentials) {
  const formData = new URLSearchParams();
  formData.append("username", credentials.email);
  formData.append("password", credentials.password);
  const response = await api.post("/auth/login", formData, { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
  return response.data;
}
export async function getCurrentUser() { const response = await api.get("/auth/me"); return response.data; }
export async function updateCurrentUserProfile(profile) { const response = await api.patch("/auth/me/profile", profile); return response.data; }
export async function getBillingStatus() { const response = await api.get("/billing/status"); return response.data; }
export async function cancelSubscription() { const response = await api.post("/billing/cancel"); return response.data; }
export async function resumeSubscription() { const response = await api.post("/billing/resume"); return response.data; }
export async function getPublicProfile(slug) { const response = await api.get(getPublicBragPath(slug, "/profile")); return response.data; }
export async function getEntries(limit = 10, skip = 0) { const response = await api.get("/entries", { params: { limit, skip } }); return response.data; }
export async function getWeeklyReport() { const response = await api.get("/entries/reports/weekly"); return response.data; }
export async function getTagsSummary() {
  const response = await api.get("/entries/tags/summary");
  return {
    ...response.data,
    tags: Object.fromEntries(normalizeDashboardTags(response.data?.tags)),
  };
}
export async function getCategoriesSummary() { const response = await api.get("/entries/categories/summary"); return response.data; }
export async function createEntry(entry) { const response = await api.post("/entries", entry); return response.data; }
export async function updateEntry(entryId, entry) { const response = await api.put(`/entries/${entryId}`, entry); return response.data; }
export async function deleteEntry(entryId) { const response = await api.delete(`/entries/${entryId}`); return response.data; }
export async function getPublicEntries(slug, limit = 6, skip = 0) { const response = await api.get(getPublicBragPath(slug), { params: { limit, skip } }); return response.data; }
export async function getPublicWeeklyReport(slug) { const response = await api.get(getPublicBragPath(slug, "/reports/weekly")); return response.data; }
export async function getPublicTagsSummary(slug) { const response = await api.get(getPublicBragPath(slug, "/tags/summary")); return response.data; }
export async function getPublicCategoriesSummary(slug) { const response = await api.get(getPublicBragPath(slug, "/categories/summary")); return response.data; }
export async function getImpactReceipts() { const response = await api.get("/impact-receipts?limit=20&skip=0"); return response.data; }
export async function createImpactReceipt(payload) { const response = await api.post("/impact-receipts", payload); return response.data; }
export async function createImpactReceiptFromEntry(entryId, payload) { const response = await api.post(`/impact-receipts/from-entry/${entryId}`, payload); return response.data; }
export async function updateImpactReceipt(receiptId, payload) { const response = await api.patch(`/impact-receipts/${receiptId}`, payload); return response.data; }
export async function deleteImpactReceipt(receiptId) { await api.delete(`/impact-receipts/${receiptId}`); }
export async function getWeeklyCareerReport() { const response = await api.get("/reports/weekly"); return response.data; }
export async function getAllTimeCareerReport() { const response = await api.get("/reports/all-time"); return response.data; }
export async function getExecutiveImpactDashboard(lens) { const response = await api.get("/enterprise/executive-impact", { params: lens ? { lens } : {} }); return response.data; }
export async function createExecutiveGoal(payload) { const response = await api.post("/enterprise/executive-impact/goals", payload); return response.data; }
export async function requestExecutiveExport(goalIds, purpose) { const response = await api.post("/enterprise/executive-impact/exports", { goal_ids: goalIds, purpose }); return response.data; }
export async function getCustomCareerReport(startDate, endDate) { const response = await api.get("/reports/custom", { params: { start_date: startDate, end_date: endDate } }); return response.data; }

export async function getPerformancePacket(startDate, endDate, options = {}) {
  const packetType = options.packetType || "performance-review";
  const response = await api.post(
    `/packets/catalog/${encodeURIComponent(packetType)}`,
    getPacketPayload(startDate, endDate, options),
  );
  return response.data;
}
export async function getPromotionPacket(startDate, endDate, options = {}) { return getPerformancePacket(startDate, endDate, { ...options, packetType: "promotion" }); }
export async function getInterviewPacket(startDate, endDate, options = {}) { return getPerformancePacket(startDate, endDate, { ...options, packetType: "interview" }); }
export async function getCertificationPacket(startDate, endDate, options = {}) { return getPerformancePacket(startDate, endDate, { ...options, packetType: "certification" }); }

export async function downloadCareerPacket(packet, format = "pdf") {
  const safeFormat = format === "docx" ? "docx" : "pdf";
  const packetType = packet?.kind || "performance-review";
  return downloadPacketFile(
    `/packets/catalog/${encodeURIComponent(packetType)}.${safeFormat}`,
    packet,
    `bragstack-${packetType}.${safeFormat}`,
  );
}
export async function downloadPerformancePacketPdf(packet) { return downloadCareerPacket(packet, "pdf"); }
export async function downloadPromotionPacketPdf(packet) { return downloadCareerPacket(packet, "pdf"); }
export async function downloadInterviewPacketPdf(packet) { return downloadCareerPacket(packet, "pdf"); }
export async function downloadCertificationPacketPdf(packet) { return downloadCareerPacket(packet, "pdf"); }

export async function getPacketExportHistory(limit = 20) { const response = await api.get("/packets/export-history", { params: { limit } }); return response.data; }

export async function createPacketShare(packet, controls = {}) {
  const options = packetOptionsFromPacket(packet);
  const payload = {
    start_date: options.startDate || null,
    end_date: options.endDate || null,
    career_area: options.careerArea || "",
    role_title: options.roleTitle || "",
    organization: options.organization || "",
    confidential: options.confidential !== false,
    signature_entry_ids: options.signatureEntryIds || [],
    sections: options.sections || [],
    packet_note: options.packetNote || "",
    item_notes: options.itemNotes || {},
    theme: options.theme || "classic-dossier",
    brand_name: options.brandName || "",
    department_label: options.departmentLabel || "",
    reviewer_name: options.reviewerName || "",
    review_cycle_label: options.reviewCycleLabel || "",
    expires_at: controls.expiresAt || null,
    access_code: controls.accessCode || null,
    allow_download: controls.allowDownload === true,
    include_evidence: controls.includeEvidence === true,
    include_notes: controls.includeNotes === true,
  };
  const response = await api.post("/packets/shares", payload);
  return response.data;
}
export async function listPacketShares() { const response = await api.get("/packets/shares"); return response.data; }
export async function revokePacketShare(shareId) { const response = await api.delete(`/packets/shares/${shareId}`); return response.data; }
export function buildPacketShareUrl(path) {
  const base = String(api.defaults.baseURL || "").replace(/\/$/, "");
  return base.startsWith("/") ? `${window.location.origin}${base}${path}` : `${base}${path}`;
}

export async function getPublicImpactReceipts(slug) { const response = await api.get(getPublicBragPath(slug, "/impact-receipts")); return response.data; }

export async function reportInterviewIntelligenceVerification({ responseCount, overallScore, violationCodes = [] }) {
  const response = await api.post("/career-intelligence/interview-verification", {
    response_count: responseCount,
    overall_score: overallScore,
    failed: violationCodes.length > 0,
    violation_codes: violationCodes,
  });
  return response.data;
}

import axios from "axios";

function getBaseUrl() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

function selectedTemplateId() {
  try {
    return localStorage.getItem("boasted_resume_template_v1") || "classic-navy";
  } catch {
    return "classic-navy";
  }
}

function supportingSectionsSnapshot() {
  try {
    return JSON.parse(sessionStorage.getItem("boasted_resume_supporting_sections_v1") || "{}") || {};
  } catch {
    return {};
  }
}

const resumeApi = axios.create({ baseURL: getBaseUrl() });
resumeApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("bragstack_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function importResume(file) {
  const form = new FormData();
  form.append("file", file);
  const response = await resumeApi.post("/resume-builder/import-fast", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function buildResume(payload) {
  const response = await resumeApi.post("/resume-builder/build", payload);
  return response.data;
}

export async function saveResume(payload) {
  const response = await resumeApi.post("/resume-builder/resumes-v2", {
    ...payload,
    supporting_sections: {
      ...supportingSectionsSnapshot(),
      ...(payload.supporting_sections || {}),
    },
    template_id: payload.template_id || selectedTemplateId(),
  });
  return response.data;
}

export async function listResumes() {
  const response = await resumeApi.get("/resume-builder/resumes-v2");
  return response.data;
}

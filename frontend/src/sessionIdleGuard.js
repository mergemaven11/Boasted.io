import { signOutAndRedirect } from "./authSessionApi.js";

const DEFAULT_IDLE_MINUTES = 60;
const LAST_ACTIVITY_KEY = "boasted_last_user_activity_v1";
const ACTIVITY_TOKEN_KEY = "boasted_activity_token_id_v1";
const ACTIVITY_WRITE_THROTTLE_MS = 15_000;
const CHECK_INTERVAL_MS = 30_000;

function idleTimeoutMs() {
  const configured = Number(import.meta.env.VITE_AUTH_IDLE_MINUTES || DEFAULT_IDLE_MINUTES);
  const minutes = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_IDLE_MINUTES;
  return minutes * 60_000;
}

function tokenMarker(token) {
  const signature = String(token || "").split(".")[2] || String(token || "");
  return signature.slice(-24);
}

function readLastActivity() {
  const value = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function writeLastActivity(timestamp = Date.now()) {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(timestamp));
}

export function clearAuthActivityTimestamp() {
  localStorage.removeItem(LAST_ACTIVITY_KEY);
  localStorage.removeItem(ACTIVITY_TOKEN_KEY);
}

export function installAuthIdleGuard() {
  const token = localStorage.getItem("bragstack_token");
  if (!token) return () => {};

  const marker = tokenMarker(token);
  const previousMarker = localStorage.getItem(ACTIVITY_TOKEN_KEY);
  if (!previousMarker || previousMarker !== marker) {
    localStorage.setItem(ACTIVITY_TOKEN_KEY, marker);
    writeLastActivity();
  }

  const timeoutMs = idleTimeoutMs();
  let lastWrite = readLastActivity();
  if (!lastWrite) {
    lastWrite = Date.now();
    writeLastActivity(lastWrite);
  }
  let signingOut = false;

  const expireIfIdle = () => {
    if (signingOut) return true;
    const lastActivity = readLastActivity() || lastWrite || Date.now();
    if (Date.now() - lastActivity < timeoutMs) return false;
    signingOut = true;
    void signOutAndRedirect();
    return true;
  };

  const markActivity = () => {
    if (expireIfIdle()) return;
    const now = Date.now();
    if (now - (lastWrite || 0) < ACTIVITY_WRITE_THROTTLE_MS) return;
    lastWrite = now;
    writeLastActivity(now);
  };

  const checkOnFocus = () => { expireIfIdle(); };
  const checkOnVisibility = () => {
    if (document.visibilityState === "visible") expireIfIdle();
  };

  const activityEvents = ["pointerdown", "keydown", "touchstart", "scroll"];
  activityEvents.forEach((eventName) => window.addEventListener(eventName, markActivity, { passive: true }));
  window.addEventListener("focus", checkOnFocus);
  document.addEventListener("visibilitychange", checkOnVisibility);
  const intervalId = window.setInterval(expireIfIdle, CHECK_INTERVAL_MS);

  // Catch a tab restored after sleeping before treating the restore as activity.
  expireIfIdle();

  return () => {
    activityEvents.forEach((eventName) => window.removeEventListener(eventName, markActivity));
    window.removeEventListener("focus", checkOnFocus);
    document.removeEventListener("visibilitychange", checkOnVisibility);
    window.clearInterval(intervalId);
  };
}

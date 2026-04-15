const AUTH_STORAGE_KEY = 'healthai_auth';
const AUTH_CHANGED_EVENT = 'healthai-auth-changed';

export function getAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.user || !parsed?.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setAuth(authPayload) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authPayload));
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function getDashboardPathByRole(role) {
  if (role === 'admin') return '/admin';
  if (role === 'engineer') return '/dashboard/engineer';
  return '/dashboard/healthcare';
}

export function getAuthChangedEventName() {
  return AUTH_CHANGED_EVENT;
}

const AUTH_STORAGE_KEY = 'healthai_auth';

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
}

export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getDashboardPathByRole(role) {
  if (role === 'admin') return '/admin';
  if (role === 'engineer') return '/dashboard/engineer';
  return '/dashboard/healthcare';
}

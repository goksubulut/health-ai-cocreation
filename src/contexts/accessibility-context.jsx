import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const ACCESSIBILITY_STORAGE_KEY = 'healthai_accessibility_preferences';

export const DEFAULT_ACCESSIBILITY = {
  highContrast: false,
  largeText: false,
  reduceMotion: false,
  focusMode: false,
  underlineLinks: false,
  spaciousControls: false,
};

function normalizePreferences(value) {
  return { ...DEFAULT_ACCESSIBILITY, ...(value || {}) };
}

function readStoredAccessibility() {
  if (typeof window === 'undefined') return DEFAULT_ACCESSIBILITY;

  try {
    return normalizePreferences(JSON.parse(window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY)));
  } catch {
    return DEFAULT_ACCESSIBILITY;
  }
}

function applyAccessibilityClasses(preferences) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.toggle('a11y-high-contrast', preferences.highContrast);
  root.classList.toggle('a11y-large-text', preferences.largeText);
  root.classList.toggle('a11y-reduce-motion', preferences.reduceMotion);
  root.classList.toggle('a11y-focus-mode', preferences.focusMode);
  root.classList.toggle('a11y-underline-links', preferences.underlineLinks);
  root.classList.toggle('a11y-spacious-controls', preferences.spaciousControls);
}

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [preferences, setPreferences] = useState(readStoredAccessibility);

  useEffect(() => {
    applyAccessibilityClasses(preferences);
    window.localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === ACCESSIBILITY_STORAGE_KEY) {
        setPreferences(readStoredAccessibility());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value = useMemo(() => {
    const activeCount = Object.values(preferences).filter(Boolean).length;
    const togglePreference = (key) => {
      setPreferences((current) => ({ ...current, [key]: !current[key] }));
    };
    const resetPreferences = () => setPreferences(DEFAULT_ACCESSIBILITY);

    return {
      preferences,
      activeCount,
      togglePreference,
      resetPreferences,
      setPreferences,
    };
  }, [preferences]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

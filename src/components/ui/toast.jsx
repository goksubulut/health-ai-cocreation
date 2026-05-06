import React, { createContext, useCallback, useContext, useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ── Context ───────────────────────────────────────────────────
const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle2 size={16} className="shrink-0" style={{ color: 'var(--accent-emerald)' }} />,
  error:   <XCircle     size={16} className="shrink-0" style={{ color: 'var(--status-danger)' }} />,
  warning: <AlertTriangle size={16} className="shrink-0" style={{ color: 'var(--status-warning)' }} />,
  info:    <Info         size={16} className="shrink-0" style={{ color: 'var(--status-info)' }} />,
};

const ACCENT = {
  success: 'var(--accent-emerald)',
  error:   'var(--status-danger)',
  warning: 'var(--status-warning)',
  info:    'var(--status-info)',
};

// ── Provider ──────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, variant = 'info', duration = 4000 }) => {
    const id = `t-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, title, description, variant, duration }]);
    if (duration !== Infinity) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Viewport */}
      <div
        aria-live="polite"
        role="region"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px',
          width: '100%',
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence initial={false}>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              style={{
                pointerEvents: 'all',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elev-1)',
                border: '1px solid var(--border)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                borderLeft: `3px solid ${ACCENT[t.variant]}`,
                backdropFilter: 'blur(8px)',
              }}
            >
              {ICONS[t.variant]}
              <div style={{ flex: 1, minWidth: 0 }}>
                {t.title && (
                  <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', color: 'var(--fg)' }}>
                    {t.title}
                  </p>
                )}
                {t.description && (
                  <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--fg-muted)' }}>
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--fg-subtle)', flexShrink: 0 }}
                aria-label="Kapat"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

// ── Convenience helpers (çağrı kolaylığı için) ───────────────
export function createToastHelpers(toast) {
  return {
    success: (title, description) => toast({ title, description, variant: 'success' }),
    error:   (title, description) => toast({ title, description, variant: 'error' }),
    warning: (title, description) => toast({ title, description, variant: 'warning' }),
    info:    (title, description) => toast({ title, description, variant: 'info' }),
  };
}

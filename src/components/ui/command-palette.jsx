import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, CalendarCheck,
  User, Search, ArrowRight, Settings, HelpCircle,
  PlusCircle, Stethoscope, Cpu,
} from 'lucide-react';
import { getAuth, getDashboardPathByRole } from '@/lib/auth';

const STATIC_COMMANDS = [
  { id: 'board',        label: 'İlan Panosu',         icon: <FileText size={15} />,       path: '/board',          group: 'Sayfalar' },
  { id: 'new-post',     label: 'Yeni İlan Oluştur',   icon: <PlusCircle size={15} />,     path: '/post/new',       group: 'Eylemler' },
  { id: 'meetings',     label: 'Toplantılarım',        icon: <CalendarCheck size={15} />,  path: '/meetings',       group: 'Sayfalar' },
  { id: 'profile',      label: 'Profilim',             icon: <User size={15} />,           path: '/profile',        group: 'Sayfalar' },
  { id: 'how-matching', label: 'Eşleştirme Nasıl Çalışır?', icon: <Stethoscope size={15} />, path: '/how-matching-works', group: 'Yardım' },
  { id: 'faq',          label: 'Sık Sorulan Sorular', icon: <HelpCircle size={15} />,     path: '/help/faq',       group: 'Yardım' },
  { id: 'contact',      label: 'Destek Al',            icon: <Settings size={15} />,       path: '/help/contact-support', group: 'Yardım' },
];

function normalize(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
}

function highlight(text, query) {
  if (!query) return text;
  const idx = normalize(text).indexOf(normalize(query));
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'color-mix(in srgb, var(--accent-violet) 22%, transparent)', color: 'var(--accent-violet)', borderRadius: '2px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const auth = getAuth();

  // ⌘K / Ctrl+K listener
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const allCommands = React.useMemo(() => {
    const cmds = [...STATIC_COMMANDS];
    if (auth) {
      const dashPath = getDashboardPathByRole(auth.user.role);
      cmds.unshift({ id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} />, path: dashPath, group: 'Sayfalar' });
    }
    return cmds;
  }, [auth]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return allCommands;
    const q = normalize(query.trim());
    return allCommands.filter(c => normalize(c.label).includes(q) || normalize(c.group).includes(q));
  }, [query, allCommands]);

  // Group filtered results
  const groups = React.useMemo(() => {
    const map = {};
    filtered.forEach(c => {
      if (!map[c.group]) map[c.group] = [];
      map[c.group].push(c);
    });
    return map;
  }, [filtered]);

  const flatFiltered = filtered; // used for keyboard nav index

  const execute = useCallback((cmd) => {
    setOpen(false);
    navigate(cmd.path);
  }, [navigate]);

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, flatFiltered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatFiltered[selectedIdx]) execute(flatFiltered[selectedIdx]);
    }
  };

  // Reset selection on query change
  useEffect(() => { setSelectedIdx(0); }, [query]);

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9990,
              background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
            }}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 480, damping: 34 }}
            style={{
              position: 'fixed', top: '18vh', left: '50%', transform: 'translateX(-50%)',
              zIndex: 9991, width: '100%', maxWidth: '520px',
              background: 'var(--bg-elev-1)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
              overflow: 'hidden',
            }}
          >
            {/* Search input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <Search size={16} style={{ color: 'var(--fg-subtle)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Sayfa ara, ilan bul..."
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--fg)',
                }}
              />
              <kbd style={{
                fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--fg-subtle)',
                background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: '5px',
                padding: '2px 6px', flexShrink: 0,
              }}>esc</kbd>
            </div>

            {/* Results */}
            <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px' }}>
              {flatFiltered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--fg-subtle)' }}>
                  Sonuç bulunamadı
                </div>
              ) : (
                Object.entries(groups).map(([group, items]) => (
                  <div key={group} style={{ marginBottom: '8px' }}>
                    <div style={{
                      padding: '4px 10px', fontFamily: 'var(--font-sans)', fontSize: '10px',
                      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--fg-subtle)',
                    }}>
                      {group}
                    </div>
                    {items.map(cmd => {
                      const globalIdx = flatFiltered.indexOf(cmd);
                      const isSelected = globalIdx === selectedIdx;
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => execute(cmd)}
                          onMouseEnter={() => setSelectedIdx(globalIdx)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '10px 12px', borderRadius: 'var(--radius-md)',
                            background: isSelected ? 'var(--bg-elev-2)' : 'transparent',
                            border: 'none', cursor: 'pointer', textAlign: 'left',
                            transition: 'background 0.1s',
                          }}
                        >
                          <span style={{ color: isSelected ? 'var(--accent-violet)' : 'var(--fg-subtle)', flexShrink: 0 }}>
                            {cmd.icon}
                          </span>
                          <span style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--fg)' }}>
                            {highlight(cmd.label, query)}
                          </span>
                          {isSelected && <ArrowRight size={13} style={{ color: 'var(--fg-subtle)', flexShrink: 0 }} />}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div style={{
              borderTop: '1px solid var(--border)', padding: '8px 18px',
              display: 'flex', gap: '16px',
              fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--fg-subtle)',
            }}>
              {[['↑↓', 'Gezin'], ['↵', 'Seç'], ['esc', 'Kapat']].map(([k, v]) => (
                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <kbd style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1px 5px', fontSize: '10px' }}>{k}</kbd>
                  {v}
                </span>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

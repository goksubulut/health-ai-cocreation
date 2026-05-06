import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLocale } from '@/contexts/locale-context';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 26 } },
};

/* ─── Shared shell ──────────────────────────────────────────── */
function EmptyShell({ illustration, title, description, action }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
        padding: '48px 24px', gap: '16px',
      }}
    >
      <motion.div variants={item}>{illustration}</motion.div>
      <motion.p variants={item} style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--fg)', fontWeight: 400 }}>
        {title}
      </motion.p>
      {description && (
        <motion.p variants={item} style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'var(--fg-subtle)', maxWidth: '340px', lineHeight: 1.6 }}>
          {description}
        </motion.p>
      )}
      {action && <motion.div variants={item}>{action}</motion.div>}
    </motion.div>
  );
}

/* ─── No Search Results ─────────────────────────────────────── */
export function NoResults({ query, onClear }) {
  const { t } = useLocale();
  return (
    <EmptyShell
      illustration={
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="34" cy="34" r="22" stroke="var(--border-strong)" strokeWidth="3" />
          <line x1="50" y1="50" x2="68" y2="68" stroke="var(--border-strong)" strokeWidth="3" strokeLinecap="round" />
          <motion.line
            x1="26" y1="34" x2="42" y2="34"
            stroke="var(--fg-subtle)" strokeWidth="2.5" strokeLinecap="round"
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3, duration: 0.4 }}
            style={{ transformOrigin: '26px 34px' }}
          />
          <motion.line
            x1="34" y1="26" x2="34" y2="42"
            stroke="var(--fg-subtle)" strokeWidth="2.5" strokeLinecap="round"
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.45, duration: 0.4 }}
            style={{ transformOrigin: '34px 26px' }}
          />
        </svg>
      }
      title={query ? `"${query}" ${t('noResultsFor', 'için sonuç bulunamadı')}` : t('noResults', 'Sonuç bulunamadı')}
      description={t('noResultsDesc', 'Farklı anahtar kelimeler ya da filtreler deneyin.')}
      action={onClear && (
        <button
          onClick={onClear}
          className="btn-secondary"
          style={{ fontSize: '13px', padding: '8px 20px' }}
        >
          {t('clearFilters', 'Filtreleri Temizle')}
        </button>
      )}
    />
  );
}

/* ─── No Meetings ───────────────────────────────────────────── */
export function NoMeetings() {
  const { t } = useLocale();
  return (
    <EmptyShell
      illustration={
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="12" y="20" width="56" height="46" rx="8" stroke="var(--border-strong)" strokeWidth="2.5" />
          <line x1="12" y1="34" x2="68" y2="34" stroke="var(--border-strong)" strokeWidth="2" />
          <rect x="24" y="12" width="6" height="14" rx="3" fill="var(--fg-subtle)" />
          <rect x="50" y="12" width="6" height="14" rx="3" fill="var(--fg-subtle)" />
          {[0, 1, 2, 3, 4, 5].map(i => (
            <motion.circle
              key={i}
              cx={28 + (i % 3) * 14}
              cy={48 + Math.floor(i / 3) * 12}
              r="4"
              fill="var(--bg-elev-2)"
              stroke="var(--border)"
              strokeWidth="1.5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 + i * 0.06, type: 'spring', stiffness: 400 }}
            />
          ))}
        </svg>
      }
      title={t('noMeetingsTitle', 'Henüz toplantı yok')}
      description={t('noMeetingsDesc', 'İlanlara göz atarak ilgilendiğin projelere toplantı talebi gönderebilirsin.')}
      action={
        <Link to="/board" className="btn-primary" style={{ fontSize: '13px', padding: '8px 20px' }}>
          {t('discoverListingsAction', 'İlanları Keşfet')}
        </Link>
      }
    />
  );
}

/* ─── No Posts ──────────────────────────────────────────────── */
export function NoPosts({ canCreate = false }) {
  const { t } = useLocale();
  return (
    <EmptyShell
      illustration={
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="14" y="14" width="52" height="52" rx="10" stroke="var(--border-strong)" strokeWidth="2.5" />
          <motion.line x1="26" y1="32" x2="54" y2="32" stroke="var(--fg-subtle)" strokeWidth="2" strokeLinecap="round"
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.2, duration: 0.4 }} style={{ transformOrigin: '26px 32px' }} />
          <motion.line x1="26" y1="40" x2="46" y2="40" stroke="var(--fg-subtle)" strokeWidth="2" strokeLinecap="round"
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.35, duration: 0.4 }} style={{ transformOrigin: '26px 40px' }} />
          <motion.line x1="26" y1="48" x2="38" y2="48" stroke="var(--fg-subtle)" strokeWidth="2" strokeLinecap="round"
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5, duration: 0.4 }} style={{ transformOrigin: '26px 48px' }} />
        </svg>
      }
      title={t('noPostsTitle', 'İlan bulunamadı')}
      description={canCreate ? t('noPostsDescCanCreate', 'Projeni paylaşarak doğru iş birlikçiyi bulmaya başla.') : t('noPostsDesc', 'Şu anda aktif ilan yok.')}
      action={canCreate && (
        <Link to="/post/new" className="btn-primary" style={{ fontSize: '13px', padding: '8px 20px' }}>
          {t('createPostAction', 'İlan Oluştur')}
        </Link>
      )}
    />
  );
}

/* ─── No Bookmarks ──────────────────────────────────────────── */
export function NoBookmarks() {
  const { t } = useLocale();
  return (
    <EmptyShell
      illustration={
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <motion.path
            d="M24 16 H56 A4 4 0 0 1 60 20 V68 L40 56 L20 68 V20 A4 4 0 0 1 24 16 Z"
            stroke="var(--border-strong)" strokeWidth="2.5" fill="none" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
          />
          <motion.path
            d="M32 36 L36 40 L48 28"
            stroke="var(--fg-subtle)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.6 }}
          />
        </svg>
      }
      title={t('noBookmarksTitle', 'Kaydedilen ilan yok')}
      description={t('noBookmarksDesc', 'Beğendiğin ilanları kaydet, daha sonra kolayca bul.')}
      action={
        <Link to="/board" className="btn-secondary" style={{ fontSize: '13px', padding: '8px 20px' }}>
          {t('browseListingsAction', 'İlanlara Bak')}
        </Link>
      }
    />
  );
}

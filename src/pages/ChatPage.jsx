/**
 * ChatPage — HEALTH AI Messaging
 * ──────────────────────────────────────────────────────────
 * Onaylanan tasarımın tam React implementasyonu.
 * Layout: Sidebar | ChatWindow | InfoPanel
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Plus, Users, Search, Smile,
  Info, MoreVertical, Lock,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChat } from '@/contexts/chat-context';
import { getAuth } from '@/lib/auth';
import { useLocale } from '@/contexts/locale-context';

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function initials(user) {
  if (!user) return '?';
  const f = user.first_name?.[0] || user.firstName?.[0] || '';
  const l = user.last_name?.[0] || user.lastName?.[0] || '';
  return (f + l).toUpperCase() || user.email?.[0]?.toUpperCase() || '?';
}

function displayName(user, t) {
  const unk = t ? t('chatUnknownUser', 'Unknown') : 'Unknown';
  if (!user) return unk;
  const name = [user.first_name || user.firstName, user.last_name || user.lastName]
    .filter(Boolean).join(' ');
  return name || user.email || unk;
}

function formatTime(dateStr, t) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const justNow = t ? t('chatJustNow', 'just now') : 'just now';
  if (diff < 60000) return justNow;
  if (diff < 3600000) {
    const m = Math.floor(diff / 60000);
    const tmpl = t ? t('chatMinutesShort', '{n}m') : '{n}m';
    return tmpl.replace('{n}', String(m));
  }
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const yLabel = t ? t('chatYesterday', 'Yesterday') : 'Yesterday';
  if (d.toDateString() === yesterday.toDateString()) return yLabel;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatMsgTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function avatarColor(role) {
  if (role === 'healthcare') return 'emerald';
  if (role === 'engineer') return 'violet';
  return 'neutral';
}

// ─── Avatar component ─────────────────────────────────────────────────────────
function Avatar({ user, size = 38, online = false, className = '' }) {
  const color = avatarColor(user?.role);
  const colorMap = {
    emerald: { bg: 'var(--accent-emerald-tint)', color: 'var(--accent-emerald)' },
    violet: { bg: 'var(--accent-violet-tint)', color: 'var(--accent-violet)' },
    neutral: { bg: 'var(--bg-elev-2)', color: 'var(--fg-muted)' },
  };
  const style = {
    width: size, height: size, borderRadius: '50%',
    background: colorMap[color].bg,
    color: colorMap[color].color,
    display: 'grid', placeItems: 'center',
    fontSize: size * 0.34, fontWeight: 700, letterSpacing: '.04em',
    flexShrink: 0, position: 'relative',
    border: '1px solid var(--border)',
  };
  return (
    <div style={style} className={className}>
      {initials(user)}
      {online && (
        <span style={{
          position: 'absolute', bottom: 0, right: 0,
          width: size * 0.26, height: size * 0.26, borderRadius: '50%',
          background: 'var(--accent-emerald)',
          border: '2px solid var(--bg-elev-1)',
        }} />
      )}
    </div>
  );
}

function GroupAvatar({ size = 38 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--accent-violet-tint), var(--accent-emerald-tint))',
      border: '1px solid var(--border)',
      display: 'grid', placeItems: 'center',
      fontSize: size * 0.44, flexShrink: 0,
    }}>🏥</div>
  );
}

// ─── Role badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const { t } = useLocale();
  if (!role || role === 'admin') return null;
  const style = role === 'healthcare'
    ? { background: 'var(--accent-emerald-tint)', color: 'var(--accent-emerald)' }
    : { background: 'var(--accent-violet-tint)', color: 'var(--accent-violet)' };
  const label = role === 'healthcare'
    ? t('chatRoleHealthcare', 'Healthcare')
    : t('chatRoleEngineer', 'Engineer');
  return (
    <span style={{
      ...style,
      fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
      padding: '1px 6px', borderRadius: 999, flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

// ─── Conversation Item ─────────────────────────────────────────────────────────
function ConvItem({ conv, isActive, onClick, myUserId, onlineUsers }) {
  const { t } = useLocale();
  const other = conv.participants?.[0];
  const isGroup = conv.type === 'group';
  const isOnline = other && onlineUsers[other.id];

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 10px', borderRadius: 'var(--radius-lg)',
        cursor: 'pointer', width: '100%', textAlign: 'left',
        background: isActive ? 'var(--bg-inset)' : 'transparent',
        border: 'none',
        transition: 'background 0.12s',
        position: 'relative',
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-elev-2)'; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      {isActive && (
        <span style={{
          position: 'absolute', left: -1, top: 8, bottom: 8,
          width: 3, background: 'var(--fg)', borderRadius: '0 2px 2px 0',
        }} />
      )}

      {isGroup
        ? <GroupAvatar size={38} />
        : <Avatar user={other} size={38} online={isOnline} />
      }

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: 'var(--fg)',
          display: 'flex', alignItems: 'center', gap: 6,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {isGroup ? conv.name : displayName(other, t)}
          </span>
          {!isGroup && other && <RoleBadge role={other.role} />}
        </div>
        <div style={{
          fontSize: 12, marginTop: 1,
          color: conv.unreadCount > 0 ? 'var(--fg-muted)' : 'var(--fg-subtle)',
          fontWeight: conv.unreadCount > 0 ? 500 : 400,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {conv.lastMessagePreview || t('chatNoMessagesPreview', 'No messages yet')}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: 'var(--fg-subtle)' }}>
          {formatTime(conv.lastMessageAt, t)}
        </span>
        {conv.unreadCount > 0 && (
          <span style={{
            background: 'var(--fg)', color: 'var(--bg)',
            fontSize: 10, fontWeight: 700,
            width: 18, height: 18, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn, showAvatar, showSender, isGroup }) {
  const { t } = useLocale();
  const sender = msg.sender;

  if (msg.type === 'system') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
        <span style={{
          fontSize: 11, color: 'var(--fg-subtle)',
          background: 'var(--bg-inset)', border: '1px solid var(--border)',
          borderRadius: 999, padding: '5px 14px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Lock size={10} /> {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'flex-end',
      flexDirection: isOwn ? 'row-reverse' : 'row',
      margin: '1px 0',
    }}>
      {/* Avatar placeholder — hep yer kaplar ama bazen görünmez */}
      <div style={{ width: 26, flexShrink: 0 }}>
        {showAvatar && !isOwn && sender && (
          <Avatar user={sender} size={26} />
        )}
      </div>

      <div style={{
        maxWidth: '62%', display: 'flex', flexDirection: 'column',
        gap: 2, alignItems: isOwn ? 'flex-end' : 'flex-start',
      }}>
        {showSender && isGroup && !isOwn && (
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-muted)', padding: '0 3px', marginBottom: 1 }}>
            {displayName(sender, t)}
          </span>
        )}

        {/* File attachment */}
        {msg.type === 'file' ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 13px',
            borderRadius: 'var(--radius-lg)',
            borderBottomLeftRadius: isOwn ? 'var(--radius-lg)' : 'var(--radius-sm)',
            borderBottomRightRadius: isOwn ? 'var(--radius-sm)' : 'var(--radius-lg)',
            background: 'var(--bg-elev-1)', border: '1px solid var(--border)',
            cursor: 'pointer',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-violet-tint)', color: 'var(--accent-violet)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }}>📄</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>
                {msg.attachmentName || t('chatFile', 'File')}
              </div>
              <div style={{ fontSize: 10, color: 'var(--fg-subtle)' }}>
                {msg.attachmentSize ? `${Math.round(msg.attachmentSize / 1024)} KB` : ''}
                {msg.attachmentMime ? ` · ${msg.attachmentMime.split('/')[1]?.toUpperCase()}` : ''}
              </div>
            </div>
          </div>
        ) : (
          /* Text bubble */
          <div style={{
            padding: '9px 13px',
            borderRadius: 'var(--radius-lg)',
            borderBottomLeftRadius: isOwn ? 'var(--radius-lg)' : 'var(--radius-sm)',
            borderBottomRightRadius: isOwn ? 'var(--radius-sm)' : 'var(--radius-lg)',
            background: isOwn ? 'var(--fg)' : 'var(--bg-elev-1)',
            color: isOwn ? 'var(--bg)' : 'var(--fg)',
            border: isOwn ? 'none' : '1px solid var(--border)',
            fontSize: 13.5, lineHeight: 1.55, wordBreak: 'break-word',
            opacity: msg._optimistic ? 0.7 : 1,
          }}>
            {msg.deletedAt
              ? <em style={{ color: 'var(--fg-subtle)', fontSize: 12 }}>{t('chatDeletedMessage', 'This message was deleted')}</em>
              : msg.content
            }
          </div>
        )}

        {/* Reactions */}
        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
            {Object.entries(msg.reactions).map(([emoji, users]) => (
              <span key={emoji} style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '2px 8px', borderRadius: 999,
                background: 'var(--bg-inset)', border: '1px solid var(--border)',
                fontSize: 11, cursor: 'pointer',
              }}>
                {emoji} <span style={{ fontSize: 10, color: 'var(--fg-muted)' }}>{users.length}</span>
              </span>
            ))}
          </div>
        )}

        {/* Meta: time + read status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '0 3px', fontSize: 10, color: 'var(--fg-subtle)',
        }}>
          <span>{formatMsgTime(msg.createdAt || msg.created_at)}</span>
          {isOwn && !msg._optimistic && (
            <span style={{ color: 'var(--accent-emerald)', display: 'flex' }}>
              {/* Double checkmark */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: -7 }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator({ user }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', margin: '4px 0' }}>
      <div style={{ width: 26, flexShrink: 0 }}>
        {user && <Avatar user={user} size={26} />}
      </div>
      <div style={{
        padding: '10px 14px',
        borderRadius: 'var(--radius-lg)', borderBottomLeftRadius: 'var(--radius-sm)',
        background: 'var(--bg-elev-1)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <span key={i} style={{
            width: 5, height: 5, borderRadius: '50%', background: 'var(--fg-subtle)',
            display: 'inline-block',
            animation: `chatTypingBounce 1.2s ${delay}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── Date separator ───────────────────────────────────────────────────────────
function DateSep({ date }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 6px' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase',
        color: 'var(--fg-subtle)', whiteSpace: 'nowrap',
      }}>
        {date}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

// ─── New Group Modal ───────────────────────────────────────────────────────────
function NewGroupModal({ onClose, onCreated }) {
  const { t } = useLocale();
  const { createConversation, searchUsers } = useChat();
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      const users = await searchUsers(query);
      setResults(users);
    }, 300);
    return () => clearTimeout(t);
  }, [query, searchUsers]);

  const submit = async () => {
    if (!name.trim() || selected.length === 0) return;
    setBusy(true);
    const conv = await createConversation({
      type: 'group',
      name: name.trim(),
      participantIds: selected.map((u) => u.id),
    });
    setBusy(false);
    if (conv) { onCreated?.(conv); onClose(); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(11,11,16,0.5)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        style={{
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(245,245,242,0.15)',
          background: 'rgba(11,11,16,0.88)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 30px 100px rgba(15,8,36,0.5)',
          padding: 28, width: 380, position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', top: -30, left: -30,
          width: 140, height: 140, borderRadius: '50%',
          background: 'rgba(124,92,252,0.2)', filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(245,245,242,0.5)', marginBottom: 6 }}>
          {t('chatModalEyebrowNew', 'New conversation')}
        </p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: '#f5f5f2', marginBottom: 20, letterSpacing: '-.02em' }}>
          {t('chatModalCreateGroupLead', 'Create a ')}<em style={{ color: '#cdbfff', fontStyle: 'italic' }}>{t('chatModalCreateGroupEm', 'group chat')}</em>
        </h2>

        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', color: 'rgba(245,245,242,0.55)', marginBottom: 6 }}>
          {t('chatModalGroupName', 'Group Name')}
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('chatModalGroupNamePlaceholder', 'e.g. AI Diagnostic Core Team')}
          style={{
            width: '100%', padding: '9px 13px', marginBottom: 14,
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(245,245,242,0.15)',
            background: 'rgba(245,245,242,0.07)',
            color: '#f5f5f2', fontSize: 13, outline: 'none',
            fontFamily: 'var(--font-sans)',
          }}
        />

        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', color: 'rgba(245,245,242,0.55)', marginBottom: 6 }}>
          {t('chatModalAddMembers', 'Add Members')}
        </label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('chatModalSearchUsers', 'Search by name or institution…')}
          style={{
            width: '100%', padding: '9px 13px', marginBottom: 10,
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(245,245,242,0.15)',
            background: 'rgba(245,245,242,0.07)',
            color: '#f5f5f2', fontSize: 13, outline: 'none',
            fontFamily: 'var(--font-sans)',
          }}
        />

        {results.length > 0 && (
          <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {results.map((u) => (
              <button key={u.id} type="button"
                onClick={() => { if (!selected.some((s) => s.id === u.id)) setSelected((p) => [...p, u]); setQuery(''); setResults([]); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(245,245,242,0.07)', border: '1px solid rgba(245,245,242,0.12)',
                  color: '#f5f5f2', cursor: 'pointer', fontSize: 13, textAlign: 'left',
                }}>
                <Avatar user={u} size={24} />
                <span>{displayName(u, t)}</span>
                <RoleBadge role={u.role} />
              </button>
            ))}
          </div>
        )}

        {selected.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {selected.map((u) => (
              <span key={u.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 600,
                padding: '3px 10px', borderRadius: 999,
                background: 'rgba(43,217,160,0.18)', color: '#2bd9a0',
              }}>
                {displayName(u, t)}
                <button type="button" onClick={() => setSelected((p) => p.filter((s) => s.id !== u.id))}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', lineHeight: 1, padding: 0 }}>
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{
            padding: '9px 18px', borderRadius: 999,
            border: '1px solid rgba(245,245,242,0.2)', background: 'transparent',
            color: 'rgba(245,245,242,0.7)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}>{t('chatModalCancel', 'Cancel')}</button>
          <button type="button" onClick={submit} disabled={busy} style={{
            padding: '9px 20px', borderRadius: 999,
            border: 'none', background: '#f5f5f2', color: '#0f0f17',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font-sans)', opacity: busy ? 0.6 : 1,
          }}>
            {busy ? t('chatModalCreating', 'Creating…') : t('chatModalCreateGroupBtn', 'Create Group')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── New DM Modal ──────────────────────────────────────────────────────────────
function NewDMModal({ onClose, onCreated }) {
  const { t } = useLocale();
  const { createConversation, searchUsers } = useChat();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => setResults(await searchUsers(query)), 300);
    return () => clearTimeout(t);
  }, [query, searchUsers]);

  const start = async (user) => {
    setBusy(true);
    const conv = await createConversation({ type: 'direct', targetUserId: user.id });
    setBusy(false);
    if (conv) { onCreated?.(conv); onClose(); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(11,11,16,0.5)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        style={{
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(245,245,242,0.15)',
          background: 'rgba(11,11,16,0.88)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 30px 100px rgba(15,8,36,0.5)',
          padding: 28, width: 360, position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(124,92,252,0.2)', filter: 'blur(36px)', pointerEvents: 'none' }} />
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(245,245,242,0.5)', marginBottom: 6 }}>{t('chatModalDirectEyebrow', 'Direct message')}</p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: '#f5f5f2', marginBottom: 18, letterSpacing: '-.02em' }}>
          {t('chatModalDirectLead', 'Start a ')}<em style={{ color: '#cdbfff', fontStyle: 'italic' }}>{t('chatModalDirectEm', 'conversation')}</em>
        </h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('chatModalSearchUsers', 'Search by name or institution…')}
          autoFocus
          style={{
            width: '100%', padding: '9px 13px', marginBottom: 12,
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(245,245,242,0.15)',
            background: 'rgba(245,245,242,0.07)',
            color: '#f5f5f2', fontSize: 13, outline: 'none',
            fontFamily: 'var(--font-sans)',
          }}
        />
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {results.map((u) => (
              <button key={u.id} type="button" onClick={() => start(u)} disabled={busy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(245,245,242,0.07)', border: '1px solid rgba(245,245,242,0.12)',
                  color: '#f5f5f2', cursor: 'pointer', fontSize: 13, textAlign: 'left',
                  transition: 'background 0.12s',
                }}>
                <Avatar user={u} size={30} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{displayName(u, t)}</div>
                  <div style={{ fontSize: 11, color: 'rgba(245,245,242,0.5)', marginTop: 1 }}>{u.institution || u.email}</div>
                </div>
                <RoleBadge role={u.role} />
              </button>
            ))}
          </div>
        )}
        {query.length >= 2 && results.length === 0 && (
          <p style={{ fontSize: 13, color: 'rgba(245,245,242,0.4)', textAlign: 'center', padding: '16px 0' }}>{t('chatModalNoUsersFound', 'No users found')}</p>
        )}
      </motion.div>
    </div>
  );
}

// ─── Info Panel ────────────────────────────────────────────────────────────────
function InfoPanel({ conv, myUserId, onlineUsers }) {
  const { t } = useLocale();
  if (!conv) return null;
  const isGroup = conv.type === 'group';
  const other = conv.participants?.[0];
  const isOnline = other && onlineUsers[other.id];

  return (
    <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', minHeight: 0 }}>

      {/* Dark glass header */}
      <div style={{
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(245,245,242,0.15)',
        background: 'rgba(11,11,16,0.6)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 60px rgba(15,8,36,0.28)',
        padding: '20px 16px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(43,217,160,0.18)', filter: 'blur(30px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {isGroup
            ? <GroupAvatar size={56} />
            : <div style={{ display: 'inline-block', position: 'relative' }}>
                <Avatar user={other} size={56} />
                {isOnline && (
                  <span style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%', background: 'var(--accent-emerald)', border: '2.5px solid rgba(11,11,16,0.8)' }} />
                )}
              </div>
          }
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: '#f5f5f2', marginTop: 10 }}>
            {isGroup ? conv.name : displayName(other, t)}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(245,245,242,0.5)', marginTop: 3 }}>
            {isGroup
              ? t('chatMembersCount', '{count} members').replace('{count}', String((conv.participants?.length || 0) + 1))
              : (other?.role || '')}
            {!isGroup && other?.institution ? ` · ${other.institution}` : ''}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {!isGroup && isOnline && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 999, background: 'rgba(43,217,160,0.2)', color: '#2bd9a0' }}>
                ● {t('chatOnline', 'Online')}
              </span>
            )}
            {!isGroup && other && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 999, background: 'rgba(167,139,255,0.18)', color: '#c4b5fd' }}>
                {other.role === 'healthcare' ? t('chatRoleHealthcare', 'Healthcare') : t('chatRoleEngineer', 'Engineer')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* About / Members */}
      <div style={{
        borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-hair)',
        background: 'color-mix(in srgb, var(--bg-elev-1) 75%, transparent)',
        backdropFilter: 'blur(12px)', padding: 14,
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--fg-subtle)', marginBottom: 10 }}>
          {isGroup ? t('chatMembers', 'Members') : t('chatAbout', 'About')}
        </div>

        {isGroup ? (
          conv.participants?.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border-hair)' }}>
              <Avatar user={p} size={26} />
              <span style={{ fontSize: 12, color: 'var(--fg-muted)', flex: 1 }}>{displayName(p, t)}</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: onlineUsers[p.id] ? 'var(--accent-emerald)' : 'var(--border-strong)' }} />
            </div>
          ))
        ) : (
          <>
            {other?.institution && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: 'var(--fg-muted)' }}>
                <span>🏛️</span> {other.institution}
              </div>
            )}
            {other?.role && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: 'var(--fg-muted)' }}>
                <span>{other.role === 'healthcare' ? '🔬' : '💻'}</span>{' '}
                {other.role === 'healthcare' ? t('chatRoleHealthcare', 'Healthcare') : t('chatRoleEngineer', 'Engineer')}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}

// ─── Main ChatPage ─────────────────────────────────────────────────────────────
const CHAT_FILTER_KEYS = {
  all: 'chatFilterAll',
  direct: 'chatFilterDirect',
  group: 'chatFilterGroup',
  unread: 'chatFilterUnread',
};

const CHAT_QUICK_EMOJIS = [
  '😀', '😃', '😄', '😁', '😅', '🤣', '😂', '🙂',
  '😉', '😊', '😍', '🥰', '🤔', '😴', '🙄', '😮',
  '👍', '👎', '👏', '🙏', '💪', '🔥', '✅', '❌',
  '❤️', '💙', '💚', '🎉', '💯', '💬', '🏥', '🔬',
];

export default function ChatPage() {
  const { t } = useLocale();
  const auth = getAuth();
  const myUserId = auth?.user?.id;
  const { convId } = useParams();
  const navigate = useNavigate();
  const {
    conversations, convLoading,
    activeConvId, setActiveConvId,
    messagesByConv, msgLoading,
    hasMoreByConv, typingByConv,
    onlineUsers,
    loadConversations, loadMessages,
    sendMessage, sendTyping, markRead,
  } = useChat();

  const [filter, setFilter] = useState('all');
  const [searchQ, setSearchQ] = useState('');
  const [inputText, setInputText] = useState('');
  const [showInfo, setShowInfo] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showDMModal, setShowDMModal] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState([]);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatHeaderMenuRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const persistBlocked = useCallback((ids) => {
    if (!myUserId || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(`healthai_chat_blocked_${myUserId}`, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }, [myUserId]);

  useEffect(() => {
    if (!myUserId || typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(`healthai_chat_blocked_${myUserId}`);
      if (raw) setBlockedUserIds(JSON.parse(raw));
    } catch {
      setBlockedUserIds([]);
    }
  }, [myUserId]);

  useEffect(() => {
    if (!chatMenuOpen) return;
    const close = (e) => {
      if (chatHeaderMenuRef.current && !chatHeaderMenuRef.current.contains(e.target)) {
        setChatMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [chatMenuOpen]);

  useEffect(() => {
    if (!emojiPickerOpen) return;
    const close = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setEmojiPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [emojiPickerOpen]);

  const blockUserId = useCallback((userId) => {
    const s = String(userId);
    setBlockedUserIds((prev) => {
      if (prev.includes(s)) return prev;
      const next = [...prev, s];
      persistBlocked(next);
      return next;
    });
  }, [persistBlocked]);

  const unblockUserId = useCallback((userId) => {
    const s = String(userId);
    setBlockedUserIds((prev) => {
      const next = prev.filter((id) => id !== s);
      persistBlocked(next);
      return next;
    });
  }, [persistBlocked]);

  // İlk yüklemede konuşmaları çek
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (convId && String(convId) !== String(activeConvId)) {
      setActiveConvId(convId);
    }
  }, [convId, activeConvId, setActiveConvId]);

  // Aktif konuşma değişince mesajları yükle
  useEffect(() => {
    if (!activeConvId) return;
    loadMessages(activeConvId);
  }, [activeConvId, loadMessages]);

  // Mesajlar güncellenince en alta kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesByConv, activeConvId]);

  useEffect(() => {
    setChatMenuOpen(false);
    setEmojiPickerOpen(false);
  }, [activeConvId]);

  const activeConv = useMemo(
    () => conversations.find((c) => String(c.id) === String(activeConvId)),
    [conversations, activeConvId]
  );

  const messages = useMemo(
    () => messagesByConv[activeConvId] || [],
    [messagesByConv, activeConvId]
  );

  const visibleMessages = useMemo(
    () => messages.filter((msg) => {
      if (msg.type === 'system') return true;
      const sid = String(msg.senderId ?? msg.sender_id ?? msg.sender?.id ?? '');
      if (!sid) return true;
      return !blockedUserIds.includes(sid);
    }),
    [messages, blockedUserIds]
  );

  const typing = typingByConv[activeConvId];
  const typingUser = typing ? activeConv?.participants?.find((p) => p.id === typing.userId) : null;

  // Filtrelenmiş konuşmalar
  const filteredConvs = useMemo(() => {
    let list = [...conversations];
    if (filter === 'direct') list = list.filter((c) => c.type === 'direct');
    else if (filter === 'group') list = list.filter((c) => c.type === 'group');
    else if (filter === 'unread') list = list.filter((c) => c.unreadCount > 0);
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter((c) => {
        const name = c.type === 'group' ? c.name : displayName(c.participants?.[0], t);
        return name?.toLowerCase().includes(q) || c.lastMessagePreview?.toLowerCase().includes(q);
      });
    }
    return list;
  }, [conversations, filter, searchQ, t]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || !activeConvId) return;
    sendMessage({ conversationId: activeConvId, content: inputText.trim() }).catch(() => {});
    setInputText('');
    inputRef.current?.focus();
  }, [inputText, activeConvId, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = (e) => {
    setInputText(e.target.value);
    if (activeConvId) sendTyping(activeConvId);
  };

  const insertEmoji = useCallback((emoji) => {
    const ta = inputRef.current;
    const hasSel = ta && typeof ta.selectionStart === 'number' && typeof ta.selectionEnd === 'number';
    const insStart = hasSel ? ta.selectionStart : null;
    const insEnd = hasSel ? ta.selectionEnd : null;

    setInputText((prev) => {
      if (insStart !== null && insEnd !== null) {
        return `${prev.slice(0, insStart)}${emoji}${prev.slice(insEnd)}`;
      }
      return prev + emoji;
    });

    if (activeConvId) sendTyping(activeConvId);
    setEmojiPickerOpen(false);

    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const emojiLen = [...emoji].length;
      if (insStart !== null) {
        const pos = insStart + emojiLen;
        try {
          el.setSelectionRange(pos, pos);
        } catch {
          /* ignore */
        }
      } else {
        try {
          el.setSelectionRange(el.value.length, el.value.length);
        } catch {
          /* ignore */
        }
      }
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 110)}px`;
    });
  }, [activeConvId, sendTyping]);

  const handleSelectConv = (conv) => {
    setActiveConvId(conv.id);
    navigate(`/chat/${conv.id}`);
    if (conv.unreadCount > 0) markRead(conv.id);
  };

  // Scroll up → load more
  const handleMessagesScroll = useCallback((e) => {
    if (e.target.scrollTop < 60 && hasMoreByConv[activeConvId] && !msgLoading) {
      const oldest = messages[0]?.id;
      if (oldest) loadMessages(activeConvId, oldest);
    }
  }, [activeConvId, hasMoreByConv, msgLoading, messages, loadMessages]);

  // Mesajlar arasına tarih ayırıcı ekle
  const messagesWithDates = useMemo(() => {
    const items = [];
    let lastDate = null;
    visibleMessages.forEach((msg) => {
      const date = new Date(msg.createdAt || msg.created_at);
      const dateStr = date.toLocaleDateString([], { month: 'long', day: 'numeric' });
      if (dateStr !== lastDate) {
        items.push({ type: 'date', id: `date_${dateStr}`, date: dateStr });
        lastDate = dateStr;
      }
      items.push(msg);
    });
    return items;
  }, [visibleMessages]);

  // Sidebar header card — dark glass
  const sidebarHeaderStyle = {
    borderRadius: 'var(--radius-xl)',
    border: '1px solid rgba(245,245,242,0.15)',
    background: 'rgba(11,11,16,0.6)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 20px 80px rgba(15,8,36,0.3)',
    padding: '20px 20px 18px',
    position: 'relative', overflow: 'hidden', flexShrink: 0,
  };

  return (
    <>
      {/* Typing animation keyframes */}
      <style>{`
        @keyframes chatTypingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: .4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        .chat-filter-pills {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .chat-filter-pills::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>

      <div style={{
        flex: 1, minHeight: 0,
        display: 'flex', padding: '16px 24px 20px',
        gap: 16, maxWidth: 1280, width: '100%', margin: '0 auto',
        overflow: 'hidden',
      }}>

        {/* ── Sidebar ── */}
        <aside style={{ width: 298, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>

          {/* Header card */}
          <div style={sidebarHeaderStyle}>
            <div style={{ position: 'absolute', top: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(124,92,252,0.2)', filter: 'blur(36px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(14,163,113,0.15)', filter: 'blur(28px)', pointerEvents: 'none' }} />

            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.2em', color: 'rgba(245,245,242,0.55)', marginBottom: 6, position: 'relative', zIndex: 1 }}>
              {t('chatSecureMessaging', 'Secure messaging')}
            </p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: '#f5f5f2', lineHeight: 1.1, letterSpacing: '-.02em', position: 'relative', zIndex: 1 }}>
              {t('chatPartnerLine1', 'Partner chat,')}<br /><em style={{ color: '#cdbfff', fontStyle: 'italic' }}>{t('chatPartnerLineEm', 'built for research.')}</em>
            </h2>

            {/* Search */}
            <div style={{ position: 'relative', marginTop: 14, zIndex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,245,242,0.38)', pointerEvents: 'none' }} />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={t('chatSearchConversations', 'Search conversations…')}
                style={{
                  width: '100%', padding: '9px 12px 9px 32px',
                  borderRadius: 999,
                  border: '1px solid rgba(245,245,242,0.14)',
                  background: 'rgba(245,245,242,0.07)',
                  color: '#f5f5f2', fontSize: 13, outline: 'none',
                  fontFamily: 'var(--font-sans)',
                }}
              />
            </div>

            {/* New buttons */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10, position: 'relative', zIndex: 1 }}>
              <button type="button" onClick={() => setShowDMModal(true)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '7px 12px', borderRadius: 999,
                background: '#f5f5f2', color: '#0f0f17',
                fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              }}>
                <Plus size={12} /> {t('chatNewMessage', 'New Message')}
              </button>
              <button type="button" onClick={() => setShowGroupModal(true)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '7px 12px', borderRadius: 999,
                background: 'transparent', color: '#f5f5f2',
                border: '1px solid rgba(245,245,242,0.2)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
                <Users size={12} /> {t('chatNewGroup', 'Group')}
              </button>
            </div>
          </div>

          {/* Filter pills — horizontal scroll without visible scrollbar (long i18n labels) */}
          <div
            className="chat-filter-pills"
            style={{
              display: 'flex',
              gap: 5,
              padding: '0 2px',
              flexShrink: 0,
              overflowX: 'auto',
              overscrollBehaviorX: 'contain',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {['all', 'direct', 'group', 'unread'].map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '6px 13px', borderRadius: 999,
                fontSize: 12, fontWeight: 500,
                background: filter === f ? 'var(--fg)' : 'transparent',
                color: filter === f ? 'var(--bg)' : 'var(--fg-muted)',
                border: `1px solid ${filter === f ? 'transparent' : 'var(--border)'}`,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}>
                {t(CHAT_FILTER_KEYS[f], f)}
              </button>
            ))}
          </div>

          {/* Conversation list */}
          <div style={{
            flex: 1, minHeight: 0, overflowY: 'auto',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-hair)',
            background: 'color-mix(in srgb, var(--bg-elev-1) 75%, transparent)',
            backdropFilter: 'blur(12px)',
            padding: 6,
          }}>
            {convLoading && (
              <div style={{ padding: 16, textAlign: 'center', fontSize: 13, color: 'var(--fg-subtle)' }}>
                {t('chatLoading', 'Loading…')}
              </div>
            )}
            {!convLoading && filteredConvs.length === 0 && (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--fg-muted)', marginBottom: 6 }}>{t('chatNoConversations', 'No conversations yet')}</div>
                <div style={{ fontSize: 13, color: 'var(--fg-subtle)' }}>{t('chatNoConversationsHint', 'Start one with a partner from the Board.')}</div>
              </div>
            )}
            {filteredConvs.map((conv) => (
              <ConvItem
                key={conv.id}
                conv={conv}
                isActive={String(conv.id) === String(activeConvId)}
                onClick={() => handleSelectConv(conv)}
                myUserId={myUserId}
                onlineUsers={onlineUsers}
              />
            ))}
          </div>
        </aside>

        {/* ── Main chat ── */}
        <main style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {activeConv ? (
            <div style={{
              flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-hair)',
              background: 'color-mix(in srgb, var(--bg-elev-1) 75%, transparent)',
              backdropFilter: 'blur(12px)',
              overflow: 'hidden',
            }}>

              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px',
                borderBottom: '1px solid var(--border-hair)',
                flexShrink: 0,
                background: 'color-mix(in srgb, var(--bg-elev-1) 85%, transparent)',
              }}>
                {activeConv.type === 'group'
                  ? <GroupAvatar size={36} />
                  : <div style={{ position: 'relative' }}>
                      <Avatar user={activeConv.participants?.[0]} size={36} online={onlineUsers[activeConv.participants?.[0]?.id]} />
                    </div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {activeConv.type === 'group' ? activeConv.name : displayName(activeConv.participants?.[0], t)}
                    {activeConv.type !== 'group' && activeConv.participants?.[0] && (
                      <RoleBadge role={activeConv.participants[0].role} />
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-subtle)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                    {activeConv.type !== 'group' && onlineUsers[activeConv.participants?.[0]?.id] ? (
                      <>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-emerald)', flexShrink: 0 }} />
                        <span style={{ color: 'var(--accent-emerald)' }}>{t('chatOnline', 'Online')}</span>
                        <span>·</span>
                      </>
                    ) : null}
                    <span>
                      {activeConv.participants?.[0]?.institution
                        || (activeConv.type === 'group'
                          ? t('chatMembersCount', '{count} members').replace(
                            '{count}',
                            String((activeConv.participants?.length || 0) + 1),
                          )
                          : '')}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', position: 'relative' }} ref={chatHeaderMenuRef}>
                  <button
                    type="button"
                    title={t('chatInfoPanel', 'Info')}
                    onClick={() => setShowInfo((v) => !v)}
                    style={{
                      width: 32, height: 32, borderRadius: 'var(--radius-md)',
                      background: showInfo ? 'var(--fg)' : 'transparent',
                      color: showInfo ? 'var(--bg)' : 'var(--fg-muted)',
                      border: `1px solid ${showInfo ? 'transparent' : 'var(--border)'}`,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Info size={14} />
                  </button>
                  {((activeConv.type === 'direct' && activeConv.participants?.[0])
                    || activeConv.type === 'group') && (
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        title={t('chatMoreOptions', 'More options')}
                        onClick={() => setChatMenuOpen((v) => !v)}
                        style={{
                          width: 32, height: 32, borderRadius: 'var(--radius-md)',
                          background: 'transparent',
                          color: 'var(--fg-muted)',
                          border: '1px solid var(--border)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                      >
                        <MoreVertical size={14} />
                      </button>
                      {chatMenuOpen && activeConv.type === 'direct' && activeConv.participants?.[0] && (
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            marginTop: 6,
                            zIndex: 60,
                            minWidth: 168,
                            padding: 6,
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-elev-1)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const oid = activeConv.participants[0].id;
                              if (blockedUserIds.includes(String(oid))) unblockUserId(oid);
                              else blockUserId(oid);
                              setChatMenuOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-sm)',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--fg)',
                              fontSize: 13,
                              cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                            }}
                          >
                            {blockedUserIds.includes(String(activeConv.participants[0].id))
                              ? t('chatUnblockUser', 'Unblock user')
                              : t('chatBlockUser', 'Block user')}
                          </button>
                        </div>
                      )}
                      {chatMenuOpen && activeConv.type === 'group' && (
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            marginTop: 6,
                            zIndex: 60,
                            minWidth: 200,
                            maxHeight: 220,
                            overflowY: 'auto',
                            padding: 6,
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-elev-1)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                          }}
                        >
                          {(activeConv.participants || [])
                            .filter((p) => String(p.id) !== String(myUserId))
                            .map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  if (blockedUserIds.includes(String(p.id))) unblockUserId(p.id);
                                  else blockUserId(p.id);
                                  setChatMenuOpen(false);
                                }}
                                style={{
                                  width: '100%',
                                  textAlign: 'left',
                                  padding: '8px 12px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: 'none',
                                  background: 'transparent',
                                  color: 'var(--fg)',
                                  fontSize: 12,
                                  cursor: 'pointer',
                                  fontFamily: 'var(--font-sans)',
                                }}
                              >
                                {blockedUserIds.includes(String(p.id))
                                  ? `${t('chatUnblockUser', 'Unblock user')} (${displayName(p, t)})`
                                  : `${t('chatBlockUser', 'Block user')} (${displayName(p, t)})`}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div
                style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 3 }}
                onScroll={handleMessagesScroll}
              >
                {msgLoading && messages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--fg-subtle)', fontSize: 13 }}>{t('chatLoading', 'Loading…')}</div>
                )}

                {/* MNDA system message */}
                <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
                  <span style={{ fontSize: 11, color: 'var(--fg-subtle)', background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 999, padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lock size={10} /> {t('chatEncryptedBadge', 'End-to-end encrypted · MNDA protected')}
                  </span>
                </div>

                {messagesWithDates.map((item, idx) => {
                  if (item.type === 'date') return <DateSep key={item.id} date={item.date} />;
                  const msg = item;
                  const isOwn = String(msg.senderId ?? msg.sender_id ?? msg.sender?.id) === String(myUserId);
                  const prev = messagesWithDates[idx - 1];
                  const prevMsg = prev && prev.type !== 'date' ? prev : null;
                  const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId || prevMsg.sender?.id !== msg.sender?.id;
                  const showSender = showAvatar;

                  return (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      showSender={showSender}
                      isGroup={activeConv.type === 'group'}
                    />
                  );
                })}

                {typing && <TypingIndicator user={typingUser} />}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{
                borderTop: '1px solid var(--border-hair)',
                padding: '12px 16px 14px', flexShrink: 0,
                background: 'color-mix(in srgb, var(--bg-elev-1) 85%, transparent)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <div ref={emojiPickerRef} style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      type="button"
                      title={t('chatEmoji', 'Emoji')}
                      onClick={() => setEmojiPickerOpen((open) => !open)}
                      aria-expanded={emojiPickerOpen}
                      aria-haspopup="dialog"
                      style={{
                        width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${emojiPickerOpen ? 'var(--fg)' : 'var(--border)'}`,
                        background: emojiPickerOpen ? 'var(--bg-inset)' : 'transparent',
                        color: 'var(--fg-muted)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Smile size={14} />
                    </button>
                    {emojiPickerOpen && (
                      <div
                        role="listbox"
                        style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: 0,
                          marginBottom: 8,
                          zIndex: 70,
                          padding: 10,
                          borderRadius: 'var(--radius-lg)',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-elev-1)',
                          boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(8, 1fr)',
                          gap: 2,
                          width: 288,
                          maxHeight: 200,
                          overflowY: 'auto',
                        }}
                      >
                        {CHAT_QUICK_EMOJIS.map((em) => (
                          <button
                            key={em}
                            type="button"
                            role="option"
                            onClick={() => insertEmoji(em)}
                            style={{
                              fontSize: 22,
                              lineHeight: 1,
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              padding: 6,
                              borderRadius: 'var(--radius-sm)',
                              transition: 'background 0.12s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--bg-inset)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={handleTyping}
                    onKeyDown={handleKeyDown}
                    placeholder={t('chatTypeMessage', 'Type a message…')}
                    rows={1}
                    style={{
                      flex: 1, minHeight: 38, maxHeight: 110,
                      padding: '9px 14px',
                      borderRadius: 'var(--radius-xl)',
                      border: '1px solid var(--border-strong)',
                      background: 'var(--bg-inset)', color: 'var(--fg)',
                      fontSize: 13.5, outline: 'none', resize: 'none', overflowY: 'auto',
                      lineHeight: 1.5, fontFamily: 'var(--font-sans)',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--fg)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border-strong)'; }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px';
                    }}
                  />

                  <button type="button" onClick={handleSend} disabled={!inputText.trim()} style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: inputText.trim() ? 'var(--fg)' : 'var(--bg-elev-2)',
                    color: inputText.trim() ? 'var(--bg)' : 'var(--fg-subtle)',
                    border: 'none', cursor: inputText.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s', flexShrink: 0,
                  }}>
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>

          ) : (
            // Empty state
            <div style={{
              flex: 1, borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-hair)',
              background: 'color-mix(in srgb, var(--bg-elev-1) 75%, transparent)',
              backdropFilter: 'blur(12px)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 14, padding: 40,
            }}>
              <div style={{ fontSize: 48, opacity: 0.3 }}>💬</div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--fg-muted)', margin: 0 }}>
                {t('chatEmptyTitleLine', 'Your conversations,')}<br /><em style={{ color: 'var(--accent-violet)', fontStyle: 'italic' }}>{t('chatEmptyTitleEm', 'here.')}</em>
              </h3>
              <p style={{ fontSize: 14, color: 'var(--fg-subtle)', textAlign: 'center', maxWidth: 280, margin: 0 }}>
                {t('chatEmptyDesc', 'Select a conversation or start a new one with a partner you met on the Board.')}
              </p>
              <button type="button" onClick={() => setShowDMModal(true)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 22px', borderRadius: 999,
                background: 'var(--fg)', color: 'var(--bg)',
                fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                marginTop: 4,
              }}>
                <Plus size={15} /> {t('chatNewMessage', 'New Message')}
              </button>
            </div>
          )}
        </main>

        {/* ── Info Panel ── */}
        <AnimatePresence>
          {showInfo && activeConv && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18 }}
            >
              <InfoPanel conv={activeConv} myUserId={myUserId} onlineUsers={onlineUsers} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showGroupModal && (
          <NewGroupModal
            onClose={() => setShowGroupModal(false)}
            onCreated={(conv) => {
              setActiveConvId(conv.id);
              navigate(`/chat/${conv.id}`);
            }}
          />
        )}
        {showDMModal && (
          <NewDMModal
            onClose={() => setShowDMModal(false)}
            onCreated={(conv) => {
              setActiveConvId(conv.id);
              navigate(`/chat/${conv.id}`);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

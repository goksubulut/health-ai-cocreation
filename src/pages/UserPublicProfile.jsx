import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, MapPin, Building2, Briefcase } from 'lucide-react';
import { getAuth } from '@/lib/auth';
import { useLocale } from '@/contexts/locale-context';

function roleLabel(role, t) {
  if (role === 'healthcare') return t('chatRoleHealthcare', 'Healthcare');
  if (role === 'engineer') return t('chatRoleEngineer', 'Engineer');
  if (role === 'admin') return 'Admin';
  return role || '—';
}

export default function UserPublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  const load = useCallback(async () => {
    if (!userId) return;
    const auth = getAuth();
    const headers = {};
    if (auth?.accessToken) headers.Authorization = `Bearer ${auth.accessToken}`;
    setLoading(true);
    setErr('');
    try {
      const res = await fetch(`/api/users/${userId}/public`, { headers });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || t('userPublicProfileNotFound', 'Profile could not be loaded.'));
      }
      const u = json.user;
      if (auth?.user?.id != null && String(auth.user.id) === String(userId)) {
        navigate('/profile', { replace: true });
        return;
      }
      setUser(u);
      setPosts(Array.isArray(json.posts) ? json.posts : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('userPublicProfileNotFound', 'Profile could not be loaded.'));
      setUser(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [userId, t, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const displayName = user
    ? [user.firstName ?? user.first_name, user.lastName ?? user.last_name].filter(Boolean).join(' ') || '—'
    : '';

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 max-w-4xl mx-auto">
      <Link
        to="/board"
        className="inline-flex items-center text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft size={16} className="mr-2" /> {t('userPublicProfileBack', 'Back')}
      </Link>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin" size={20} /> …
        </div>
      )}

      {!loading && err && (
        <p className="text-destructive text-sm">{err}</p>
      )}

      {!loading && !err && user && (
        <>
          <div className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-sm p-8 sm:p-10 mb-10">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">
              {displayName}
            </h1>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                {roleLabel(user.role, t)}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-1">
              {user.institution && (
                <div className="flex items-start gap-3 text-sm">
                  <Building2 className="shrink-0 mt-0.5 text-muted-foreground" size={18} />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {t('userPublicProfileInstitution', 'Institution')}
                    </div>
                    <div className="text-foreground font-medium">{user.institution}</div>
                  </div>
                </div>
              )}
              {(user.city || user.country) && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="shrink-0 mt-0.5 text-muted-foreground" size={18} />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {t('postFormLocationLabel', 'Location')}
                    </div>
                    <div className="text-foreground font-medium">
                      {[user.city, user.country].filter(Boolean).join(', ')}
                    </div>
                  </div>
                </div>
              )}
              {user.expertise && (
                <div className="flex items-start gap-3 text-sm">
                  <Briefcase className="shrink-0 mt-0.5 text-muted-foreground" size={18} />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {t('userPublicProfileExpertise', 'Expertise')}
                    </div>
                    <div className="text-foreground font-medium whitespace-pre-wrap">{user.expertise}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
              {t('userPublicProfilePosts', 'Active listings')}
            </h2>
            {posts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('userPublicProfileNoPosts', 'No active listings yet.')}</p>
            ) : (
              <ul className="space-y-3">
                {posts.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/post/${p.id}`}
                      className="block rounded-2xl border border-border/50 bg-background/55 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30"
                    >
                      <p className="font-medium text-foreground">{p.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {[p.domain, p.city].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

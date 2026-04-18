import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getAuth, getAuthChangedEventName } from '@/lib/auth';

const cardBackgrounds = [
  '/assets/mesh_1.png',
  '/assets/mesh_2.png',
  '/assets/mesh_3.png',
  '/assets/mesh_4.png',
  '/assets/mesh_5.png',
];

function tagsFromPost(p) {
  if (p.domain) {
    return p.domain
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 3);
  }
  return ['General'];
}

function Board() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('');
  const [expertiseFilter, setExpertiseFilter] = useState('');
  const [cityOptions, setCityOptions] = useState([]);
  const [expertiseOptions, setExpertiseOptions] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState('');

  const loadFacets = useCallback(async () => {
    const a = getAuth();
    if (!a?.accessToken) {
      setCityOptions([]);
      setExpertiseOptions([]);
      return;
    }
    try {
      const res = await fetch('/api/posts?limit=100', {
        headers: { Authorization: `Bearer ${a.accessToken}` },
      });
      const json = await res.json();
      if (!res.ok) return;
      const rows = Array.isArray(json.data) ? json.data : [];
      const cities = [
        ...new Set(
          rows
            .map((p) => (typeof p.city === 'string' ? p.city.trim() : ''))
            .filter(Boolean)
        ),
      ].sort((x, y) => x.localeCompare(y));
      const expertise = [
        ...new Set(
          rows
            .map((p) =>
              typeof p.required_expertise === 'string' ? p.required_expertise.trim() : ''
            )
            .filter(Boolean)
        ),
      ].sort((x, y) => x.localeCompare(y));
      setCityOptions(cities);
      setExpertiseOptions(expertise);
    } catch {
      setCityOptions([]);
      setExpertiseOptions([]);
    }
  }, []);

  const load = useCallback(async () => {
    const a = getAuth();
    if (!a?.accessToken) {
      setPosts([]);
      setLoading(false);
      setFetchErr('');
      return;
    }
    setLoading(true);
    setFetchErr('');
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (cityFilter.trim()) params.set('city', cityFilter.trim());
      if (expertiseFilter.trim()) params.set('expertise', expertiseFilter.trim());
      const res = await fetch(`/api/posts?${params.toString()}`, {
        headers: { Authorization: `Bearer ${a.accessToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load posts.');
      const rows = Array.isArray(json.data) ? json.data : [];
      const mapped = rows.map((p) => ({
        id: p.id,
        title: p.title,
        role: p.required_expertise || '—',
        city: typeof p.city === 'string' && p.city.trim() ? p.city.trim() : null,
        tags: tagsFromPost(p),
        isDiscreet: p.confidentiality === 'meeting_only',
        bg: cardBackgrounds[(Math.abs(p.id) % 5 + 5) % 5],
      }));
      setPosts(mapped);
    } catch (e) {
      setFetchErr(e instanceof Error ? e.message : 'Failed to load.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [cityFilter, expertiseFilter]);

  useEffect(() => {
    loadFacets();
  }, [loadFacets]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const ev = getAuthChangedEventName();
    const onAuth = () => {
      loadFacets();
      load();
    };
    window.addEventListener(ev, onAuth);
    return () => window.removeEventListener(ev, onAuth);
  }, [load, loadFacets]);

  const filterTags = useMemo(() => {
    const set = new Set();
    posts.forEach((p) => {
      if (p.tags[0]) set.add(p.tags[0]);
    });
    return [...set];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return posts.filter((p) => {
      const text = `${p.title} ${p.role} ${p.tags.join(' ')}`.toLowerCase();
      const searchOk = !q || text.includes(q);
      const filterOk =
        activeFilter === 'All' || p.tags.some((t) => t === activeFilter);
      return searchOk && filterOk;
    });
  }, [posts, searchTerm, activeFilter]);

  const authed = Boolean(getAuth()?.accessToken);

  return (
    <div className="min-h-[100dvh] pt-28 pb-20 px-6 lg:px-16 bg-background">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-serif text-5xl md:text-7xl font-bold tracking-tight mb-4"
            >
              Discover Projects
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-muted-foreground font-medium max-w-2xl"
            >
              Explore active listings from healthcare and engineering collaborators. Sign in to view
              details and send meeting requests.
            </motion.p>
          </div>
        </div>

        {!authed && (
          <div className="mb-10 rounded-2xl border border-border/60 bg-card/50 p-6 flex flex-wrap items-center gap-4">
            <p className="text-sm text-muted-foreground">Sign in to load live posts from the platform.</p>
            <Link to="/auth?mode=login" className="btn-primary text-sm">
              Sign in
            </Link>
          </div>
        )}

        {fetchErr && (
          <p className="mb-6 text-sm text-destructive">{fetchErr}</p>
        )}

        <div className="flex flex-col xl:flex-row xl:items-start gap-12">
          <aside className="xl:w-64 shrink-0 flex flex-col gap-10">
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2 flex w-full">
                Quick Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Keywords..."
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2 flex w-full">
                City
              </label>
              <ul className="space-y-3 font-medium text-sm">
                <li
                  className="flex items-center gap-3 cursor-pointer group select-none"
                  onClick={() => setCityFilter('')}
                >
                  <div
                    className={`w-5 h-5 shrink-0 rounded border flex items-center justify-center transition-colors ${
                      cityFilter === '' ? 'bg-primary border-primary' : 'border-border group-hover:border-primary'
                    }`}
                  >
                    {cityFilter === '' && (
                      <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    )}
                  </div>
                  <span className={cityFilter === '' ? 'text-primary font-bold' : 'text-foreground/80'}>All</span>
                </li>
                {cityOptions.map((c) => (
                  <li
                    key={c}
                    className="flex items-start gap-3 cursor-pointer group select-none"
                    onClick={() => setCityFilter(cityFilter === c ? '' : c)}
                  >
                    <div
                      className={`w-5 h-5 shrink-0 mt-0.5 rounded border flex items-center justify-center transition-colors ${
                        cityFilter === c ? 'bg-primary border-primary' : 'border-border group-hover:border-primary'
                      }`}
                    >
                      {cityFilter === c && (
                        <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`min-w-0 break-words leading-snug ${
                        cityFilter === c ? 'text-primary font-bold' : 'text-foreground/80 group-hover:text-foreground'
                      }`}
                    >
                      {c}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2 flex w-full">
                Expertise
              </label>
              <ul className="space-y-3 font-medium text-sm">
                <li
                  className="flex items-center gap-3 cursor-pointer group select-none"
                  onClick={() => setExpertiseFilter('')}
                >
                  <div
                    className={`w-5 h-5 shrink-0 rounded border flex items-center justify-center transition-colors ${
                      expertiseFilter === '' ? 'bg-primary border-primary' : 'border-border group-hover:border-primary'
                    }`}
                  >
                    {expertiseFilter === '' && (
                      <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    )}
                  </div>
                  <span
                    className={expertiseFilter === '' ? 'text-primary font-bold' : 'text-foreground/80'}
                  >
                    All
                  </span>
                </li>
                {expertiseOptions.map((ex) => (
                  <li
                    key={ex}
                    className="flex items-start gap-3 cursor-pointer group select-none"
                    onClick={() => setExpertiseFilter(expertiseFilter === ex ? '' : ex)}
                  >
                    <div
                      className={`w-5 h-5 shrink-0 mt-0.5 rounded border flex items-center justify-center transition-colors ${
                        expertiseFilter === ex ? 'bg-primary border-primary' : 'border-border group-hover:border-primary'
                      }`}
                    >
                      {expertiseFilter === ex && (
                        <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`min-w-0 break-words leading-snug ${
                        expertiseFilter === ex ? 'text-primary font-bold' : 'text-foreground/80 group-hover:text-foreground'
                      }`}
                    >
                      {ex}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2 flex w-full">
                Field / domain
              </label>
              <ul className="space-y-3 font-medium text-sm">
                <li
                  className="flex items-center gap-3 cursor-pointer group select-none"
                  onClick={() => setActiveFilter('All')}
                >
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      activeFilter === 'All' ? 'bg-primary border-primary' : 'border-border group-hover:border-primary'
                    }`}
                  >
                    {activeFilter === 'All' && (
                      <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    )}
                  </div>
                  <span className={activeFilter === 'All' ? 'text-primary font-bold' : 'text-foreground/80'}>All</span>
                </li>
                {filterTags.map((tag) => (
                  <li
                    key={tag}
                    className="flex items-center gap-3 cursor-pointer group select-none"
                    onClick={() => setActiveFilter(activeFilter === tag ? 'All' : tag)}
                  >
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        activeFilter === tag ? 'bg-primary border-primary' : 'border-border group-hover:border-primary'
                      }`}
                    >
                      {activeFilter === tag && (
                        <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={
                        activeFilter === tag ? 'text-primary font-bold' : 'text-foreground/80 group-hover:text-foreground'
                      }
                    >
                      {tag}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-8 content-start items-start">
            {loading && authed ? (
              <p className="col-span-full flex items-center gap-2 text-muted-foreground">
                <Loader2 className="animate-spin" size={18} /> Loading posts…
              </p>
            ) : !authed ? (
              <p className="col-span-full text-sm text-muted-foreground">Sign in to see projects.</p>
            ) : filteredPosts.length === 0 ? (
              <p className="col-span-full text-sm text-muted-foreground">
                No active posts match your filters.
              </p>
            ) : (
              <AnimatePresence>
                {filteredPosts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    className="relative group w-full aspect-[16/9] rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.6, ease: 'easeOut' }}
                  >
                    <div className="absolute inset-0 z-0 bg-black">
                      <img
                        src={post.bg}
                        alt=""
                        className="w-full h-full object-cover opacity-90 dark:opacity-70 saturate-150 contrast-125 mix-blend-screen transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />
                    </div>

                    <div className="relative z-10 w-full h-full flex flex-col justify-between p-5 lg:p-6 text-white pb-4">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          {post.isDiscreet && (
                            <div className="mb-2 inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-2 py-1 font-mono text-[8px] font-bold text-red-300 border border-red-500/20 uppercase tracking-widest">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> NDA Required
                            </div>
                          )}
                          <h3
                            className="font-sans text-lg font-bold leading-tight tracking-tight drop-shadow-md pr-1"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {post.title}
                          </h3>
                        </div>
                      </div>

                      <div>
                        <div className="flex flex-wrap gap-1.5 mb-2 h-[26px] overflow-hidden">
                          {post.tags.map((tag, ti) => (
                            <span
                              key={`${post.id}-t-${ti}`}
                              className="bg-white/10 backdrop-blur-md border border-white/20 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest truncate max-w-[140px] inline-block"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between border-t border-white/20 pt-3">
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] lg:text-[10px] uppercase text-white/60 font-bold tracking-widest mb-0.5">
                              Seeking
                            </span>
                            <span className="text-[13px] lg:text-sm font-semibold truncate max-w-[140px]">{post.role}</span>
                            {post.city && (
                              <span className="text-[9px] lg:text-[10px] uppercase text-white/45 font-bold tracking-widest mt-1 truncate max-w-[160px]">
                                {post.city}
                              </span>
                            )}
                          </div>
                          <Link
                            to={`/post/${post.id}`}
                            className="bg-white text-black hover:bg-zinc-200 transition-colors rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider shadow-lg shrink-0"
                          >
                            Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Board;

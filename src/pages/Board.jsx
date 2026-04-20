import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Loader2, Search, X, SlidersHorizontal, MapPin, Cpu, Tag } from 'lucide-react';
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

function FilterSection({ label, icon: Icon, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-border/40">
        <Icon size={12} className="text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function FilterOption({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2.5 text-left rounded-lg px-2.5 py-2 text-sm transition-all duration-150',
        active
          ? 'bg-foreground text-primary-foreground font-semibold'
          : 'text-foreground/70 hover:text-foreground hover:bg-muted/60 font-medium',
      ].join(' ')}
    >
      <span
        className={[
          'shrink-0 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors',
          active ? 'bg-primary-foreground border-primary-foreground' : 'border-border/60',
        ].join(' ')}
      >
        {active && (
          <svg className="w-2.5 h-2.5 text-foreground" fill="currentColor" viewBox="0 0 20 20">
            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
          </svg>
        )}
      </span>
      <span className="truncate leading-snug">{label}</span>
    </button>
  );
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

  useEffect(() => { loadFacets(); }, [loadFacets]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ev = getAuthChangedEventName();
    const onAuth = () => { loadFacets(); load(); };
    window.addEventListener(ev, onAuth);
    return () => window.removeEventListener(ev, onAuth);
  }, [load, loadFacets]);

  const filterTags = useMemo(() => {
    const set = new Set();
    posts.forEach((p) => { if (p.tags[0]) set.add(p.tags[0]); });
    return [...set];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return posts.filter((p) => {
      const text = `${p.title} ${p.role} ${p.tags.join(' ')}`.toLowerCase();
      const searchOk = !q || text.includes(q);
      const filterOk = activeFilter === 'All' || p.tags.some((t) => t === activeFilter);
      return searchOk && filterOk;
    });
  }, [posts, searchTerm, activeFilter]);

  const authed = Boolean(getAuth()?.accessToken);

  const activeFilterCount = [
    searchTerm.trim() ? 1 : 0,
    cityFilter ? 1 : 0,
    expertiseFilter ? 1 : 0,
    activeFilter !== 'All' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAll = () => {
    setSearchTerm('');
    setCityFilter('');
    setExpertiseFilter('');
    setActiveFilter('All');
  };

  return (
    <div className="min-h-[100dvh] pt-28 pb-20 bg-background relative overflow-hidden">
      {/* Subtle dot-grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      <div className="px-6 lg:px-16 relative">
        <div className="max-w-[1600px] mx-auto">

          {/* ── Editorial Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-border/50">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-muted-foreground/50 inline-block" />
                  Health AI Platform
                  <span className="w-4 h-px bg-muted-foreground/50 inline-block" />
                </p>
                <h1 className="font-serif text-5xl md:text-7xl lg:text-[5.5rem] leading-none tracking-tight">
                  Discover
                  <br />
                  <span className="text-muted-foreground/40">Projects</span>
                </h1>
              </div>

              <div className="flex flex-col items-start md:items-end gap-2 pb-1">
                {!loading && authed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-right"
                  >
                    <p className="font-serif text-4xl md:text-5xl text-foreground tabular-nums">
                      {filteredPosts.length}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      active listing{filteredPosts.length !== 1 ? 's' : ''}
                      {activeFilterCount > 0 ? ' matching filters' : ' available'}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-4 text-sm text-muted-foreground max-w-2xl leading-relaxed"
            >
              Explore active listings from healthcare and engineering collaborators.
              Sign in to view details and send meeting requests.
            </motion.p>
          </motion.div>

          {/* Auth warning */}
          {!authed && (
            <div className="mb-10 rounded-2xl border border-border/60 bg-card/50 p-5 flex flex-wrap items-center gap-4">
              <p className="text-sm text-muted-foreground">Sign in to load live posts from the platform.</p>
              <Link to="/auth?mode=login" className="btn-primary text-sm py-2 px-5">
                Sign in
              </Link>
            </div>
          )}

          {fetchErr && (
            <p className="mb-6 text-sm text-destructive">{fetchErr}</p>
          )}

          <div className="flex flex-col xl:flex-row xl:items-start gap-10">

            {/* ── Filter Sidebar ── */}
            <motion.aside
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 }}
              className="xl:w-60 shrink-0 xl:sticky xl:top-28"
            >
              <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md overflow-hidden">
                {/* Sidebar header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-widest text-foreground">
                      Filters
                    </span>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X size={10} /> Clear {activeFilterCount}
                    </button>
                  )}
                </div>

                <div className="p-4 space-y-6">
                  {/* Search */}
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search keywords…"
                      className="w-full bg-background/80 border border-border/60 rounded-xl pl-8 pr-3 py-2.5 text-sm outline-none focus:border-foreground/40 transition-colors placeholder:text-muted-foreground/50"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* City */}
                  <FilterSection label="City" icon={MapPin}>
                    <div className="space-y-0.5">
                      <FilterOption
                        label="All cities"
                        active={cityFilter === ''}
                        onClick={() => setCityFilter('')}
                      />
                      {cityOptions.map((c) => (
                        <FilterOption
                          key={c}
                          label={c}
                          active={cityFilter === c}
                          onClick={() => setCityFilter(cityFilter === c ? '' : c)}
                        />
                      ))}
                    </div>
                  </FilterSection>

                  {/* Expertise */}
                  <FilterSection label="Expertise" icon={Cpu}>
                    <div className="space-y-0.5">
                      <FilterOption
                        label="All expertise"
                        active={expertiseFilter === ''}
                        onClick={() => setExpertiseFilter('')}
                      />
                      {expertiseOptions.map((ex) => (
                        <FilterOption
                          key={ex}
                          label={ex}
                          active={expertiseFilter === ex}
                          onClick={() => setExpertiseFilter(expertiseFilter === ex ? '' : ex)}
                        />
                      ))}
                    </div>
                  </FilterSection>

                  {/* Domain */}
                  <FilterSection label="Field / Domain" icon={Tag}>
                    <div className="space-y-0.5">
                      <FilterOption
                        label="All fields"
                        active={activeFilter === 'All'}
                        onClick={() => setActiveFilter('All')}
                      />
                      {filterTags.map((tag) => (
                        <FilterOption
                          key={tag}
                          label={tag}
                          active={activeFilter === tag}
                          onClick={() => setActiveFilter(activeFilter === tag ? 'All' : tag)}
                        />
                      ))}
                    </div>
                  </FilterSection>
                </div>
              </div>
            </motion.aside>

            {/* ── Project Grid ── */}
            <div className="flex-1 min-w-0">
              {/* Active filter chips */}
              {activeFilterCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap gap-2 mb-6"
                >
                  {searchTerm.trim() && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium">
                      "{searchTerm.trim()}"
                      <button type="button" onClick={() => setSearchTerm('')} className="text-muted-foreground hover:text-foreground">
                        <X size={10} />
                      </button>
                    </span>
                  )}
                  {cityFilter && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium">
                      <MapPin size={9} /> {cityFilter}
                      <button type="button" onClick={() => setCityFilter('')} className="text-muted-foreground hover:text-foreground">
                        <X size={10} />
                      </button>
                    </span>
                  )}
                  {expertiseFilter && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium">
                      <Cpu size={9} /> {expertiseFilter}
                      <button type="button" onClick={() => setExpertiseFilter('')} className="text-muted-foreground hover:text-foreground">
                        <X size={10} />
                      </button>
                    </span>
                  )}
                  {activeFilter !== 'All' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium">
                      <Tag size={9} /> {activeFilter}
                      <button type="button" onClick={() => setActiveFilter('All')} className="text-muted-foreground hover:text-foreground">
                        <X size={10} />
                      </button>
                    </span>
                  )}
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 content-start items-start">
                {loading && authed ? (
                  <p className="col-span-full flex items-center gap-2.5 text-muted-foreground py-10">
                    <Loader2 className="animate-spin" size={18} /> Loading listings…
                  </p>
                ) : !authed ? (
                  <p className="col-span-full text-sm text-muted-foreground py-10">
                    Sign in to see projects.
                  </p>
                ) : filteredPosts.length === 0 ? (
                  <div className="col-span-full py-16 text-center">
                    <p className="text-sm font-medium text-foreground mb-1">No listings found</p>
                    <p className="text-xs text-muted-foreground mb-4">Try adjusting your filters or search term.</p>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={clearAll}
                        className="text-xs font-semibold text-foreground underline underline-offset-2 hover:no-underline"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                ) : (
                  <AnimatePresence>
                    {filteredPosts.map((post, i) => (
                      <motion.div
                        key={post.id}
                        className="relative group w-full aspect-[16/9] rounded-[1.75rem] overflow-hidden shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_48px_rgba(0,0,0,0.22)]"
                        initial={{ opacity: 0, scale: 0.96, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: i * 0.045, duration: 0.55, ease: 'easeOut' }}
                      >
                        {/* Background image */}
                        <div className="absolute inset-0 z-0 bg-black">
                          <img
                            src={post.bg}
                            alt=""
                            className="w-full h-full object-cover opacity-90 dark:opacity-70 saturate-150 contrast-125 mix-blend-screen transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/20" />
                        </div>

                        {/* Index badge */}
                        <div className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-white/60 tabular-nums">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 w-full h-full flex flex-col justify-between p-5 lg:p-6 text-white">
                          <div>
                            {post.isDiscreet && (
                              <div className="mb-2.5 inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1 font-mono text-[8px] font-bold text-red-300 border border-red-500/25 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                NDA Required
                              </div>
                            )}
                            <h3
                              className="font-sans text-[17px] font-bold leading-tight tracking-tight drop-shadow-sm"
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

                          <div>
                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5 mb-3 h-[22px] overflow-hidden">
                              {post.tags.map((tag, ti) => (
                                <span
                                  key={`${post.id}-t-${ti}`}
                                  className="bg-white/[0.12] backdrop-blur-md border border-white/15 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest truncate max-w-[130px] inline-block"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>

                            {/* Footer row */}
                            <div className="flex items-end justify-between border-t border-white/15 pt-3 gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-[9px] uppercase text-white/50 font-bold tracking-widest mb-0.5">
                                  Seeking
                                </p>
                                <p className="text-[13px] font-semibold truncate leading-tight">
                                  {post.role}
                                </p>
                                {post.city && (
                                  <p className="text-[9px] uppercase text-white/40 font-bold tracking-widest mt-1 truncate">
                                    {post.city}
                                  </p>
                                )}
                              </div>
                              <Link
                                to={`/post/${post.id}`}
                                className="shrink-0 bg-white text-black hover:bg-white/90 transition-colors rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider shadow-md"
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
      </div>
    </div>
  );
}

export default Board;

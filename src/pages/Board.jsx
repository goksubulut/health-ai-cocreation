import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X, SlidersHorizontal, MapPin, Cpu, Tag, Heart } from 'lucide-react';
import ThreeDImageGallery from '@/components/ui/3d-image-gallery';
import { boardListings } from '@/lib/showcaseListings';
import { getAuth, getAuthChangedEventName } from '@/lib/auth';

const BOARD_FAVORITES_KEY = 'health-ai-cocreation:board-favorites';
const BOARD_VIEW_MODE_KEY = 'health-ai-cocreation:board-view-mode';

function readStoredFavorites() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(BOARD_FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id) => typeof id === 'string');
  } catch {
    return [];
  }
}

/**
 * Maps GET /api/posts row to the discover card model (aligned with showcase entries).
 * @param {Record<string, unknown>} p
 */
function mapApiPostToBoardListing(p) {
  const rawId = p.id;
  const idNum = typeof rawId === 'number' ? rawId : parseInt(String(rawId), 10);
  const domainRaw = typeof p.domain === 'string' ? p.domain.trim() : '';
  const domainTags = domainRaw
    ? domainRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const expertise =
    typeof p.required_expertise === 'string' && p.required_expertise.trim()
      ? p.required_expertise.trim()
      : 'Collaborator';
  const tags = domainTags.length > 0 ? domainTags : [expertise];
  const desc = typeof p.description === 'string' ? p.description : '';
  const title =
    typeof p.title === 'string' && p.title.trim() ? p.title.trim() : 'Untitled listing';
  const cityRaw = typeof p.city === 'string' ? p.city.trim() : '';
  const meshIdx = Number.isFinite(idNum) && idNum > 0 ? ((idNum - 1) % 5) + 1 : 1;
  const summary = desc.length > 260 ? `${desc.slice(0, 257)}…` : desc || title;
  const distanceKm = Number.isFinite(idNum)
    ? ((Math.abs(idNum) * 17) % 500) / 100 + 0.5
    : 2.0;

  return {
    id: rawId,
    title,
    role: expertise,
    city: cityRaw,
    tags,
    distanceKm,
    summary,
    imageUrl: `/assets/mesh_${meshIdx}.png`,
    isMock: false,
  };
}

function readStoredViewMode() {
  if (typeof window === 'undefined') return 'nearby';
  try {
    const raw = window.localStorage.getItem(BOARD_VIEW_MODE_KEY);
    if (raw === 'all' || raw === 'nearby') return raw;
    return 'nearby';
  } catch {
    return 'nearby';
  }
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
  const navigate = useNavigate();
  const auth = getAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('');
  const [expertiseFilter, setExpertiseFilter] = useState('');
  const [viewMode, setViewMode] = useState(readStoredViewMode);
  const [liveListings, setLiveListings] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveErr, setLiveErr] = useState('');
  const [favoriteIds, setFavoriteIds] = useState(readStoredFavorites);

  const loadLivePosts = async () => {
    const token = getAuth()?.accessToken;
    if (!token) {
      setLiveListings([]);
      setLiveLoading(false);
      setLiveErr('');
      return;
    }
    setLiveLoading(true);
    setLiveErr('');
    try {
      const res = await fetch('/api/posts?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof json.message === 'string' ? json.message : 'Failed to load listings.'
        );
      }
      const rows = Array.isArray(json.data) ? json.data : [];
      setLiveListings(
        rows
          .filter((p) => ['active', 'meeting_scheduled'].includes(p.status))
          .map(mapApiPostToBoardListing)
      );
    } catch (e) {
      setLiveErr(e instanceof Error ? e.message : 'Failed to load listings.');
      setLiveListings([]);
    } finally {
      setLiveLoading(false);
    }
  };

  useEffect(() => {
    loadLivePosts();
    const ev = getAuthChangedEventName();
    window.addEventListener(ev, loadLivePosts);
    return () => window.removeEventListener(ev, loadLivePosts);
  }, []);

  const posts = useMemo(
    () => [...liveListings, ...boardListings.map((p) => ({ ...p, isMock: true }))],
    [liveListings]
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(BOARD_FAVORITES_KEY, JSON.stringify(favoriteIds));
    } catch {
      /* ignore quota / private mode */
    }
  }, [favoriteIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(BOARD_VIEW_MODE_KEY, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  const cityOptions = useMemo(
    () =>
      [...new Set(posts.map((p) => (typeof p.city === 'string' ? p.city.trim() : '')).filter(Boolean))]
        .sort((x, y) => x.localeCompare(y)),
    [posts]
  );
  const expertiseOptions = useMemo(
    () =>
      [...new Set(posts.map((p) => (typeof p.role === 'string' ? p.role.trim() : '')).filter(Boolean))]
        .sort((x, y) => x.localeCompare(y)),
    [posts]
  );

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
      const cityOk = !cityFilter || p.city === cityFilter;
      const expertiseOk = !expertiseFilter || p.role === expertiseFilter;
      return searchOk && filterOk && cityOk && expertiseOk;
    });
  }, [posts, searchTerm, activeFilter, cityFilter, expertiseFilter]);
  const orderedPostsByDistance = useMemo(
    () => [...filteredPosts].sort((a, b) => a.distanceKm - b.distanceKm),
    [filteredPosts]
  );
  const favoriteListings = useMemo(
    () => orderedPostsByDistance.filter((post) => favoriteIds.includes(String(post.id))),
    [orderedPostsByDistance, favoriteIds]
  );

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

  const toggleFavorite = (listingId) => {
    setFavoriteIds((prev) =>
      prev.includes(listingId) ? prev.filter((id) => id !== listingId) : [...prev, listingId]
    );
  };

  return (
    <div className="min-h-[100dvh] pt-20 pb-14 bg-background relative overflow-hidden">
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
            className="mb-7"
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-4 border-b border-border/50">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-muted-foreground/50 inline-block" />
                  Health AI Platform
                  <span className="w-4 h-px bg-muted-foreground/50 inline-block" />
                </p>
                <h1 className="font-serif text-4xl md:text-6xl lg:text-[4.6rem] leading-none tracking-tight">
                  Discover
                  <br />
                  <span className="text-muted-foreground/40">Projects</span>
                </h1>
              </div>

              <div className="flex flex-col items-start md:items-end gap-2 pb-1">
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
              </div>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-3 text-sm text-muted-foreground max-w-2xl leading-relaxed"
            >
              Explore listing cards in a spatial discover view centered on your location. Live posts are
              loaded from the platform; curated showcase cards are always available.
            </motion.p>
            {liveErr ? (
              <p className="mt-2 text-sm text-destructive" role="alert">
                {liveErr}
              </p>
            ) : null}
            {!auth?.accessToken ? (
              <p className="mt-2 text-xs text-muted-foreground max-w-2xl">
                <Link to="/auth" className="font-medium text-foreground underline underline-offset-2">
                  Sign in
                </Link>{' '}
                to load active listings from the database.
              </p>
            ) : null}
            {auth?.accessToken && liveLoading ? (
              <p className="mt-2 text-xs text-muted-foreground">Loading live listings…</p>
            ) : null}
          </motion.div>

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

            {/* ── Discover 3D View ── */}
            <div className="flex-1 min-w-0">
              <div className="mb-4 rounded-2xl border border-border/50 bg-card/40 p-3.5 backdrop-blur-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Favorites ({favoriteListings.length})
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex rounded-lg border border-border/60 bg-background/60 p-1">
                      <button
                        type="button"
                        onClick={() => setViewMode('nearby')}
                        className={[
                          'px-3 py-1.5 text-xs rounded-md transition-colors',
                          viewMode === 'nearby'
                            ? 'bg-foreground text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                        ].join(' ')}
                      >
                        Show Nearby
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('all')}
                        className={[
                          'px-3 py-1.5 text-xs rounded-md transition-colors',
                          viewMode === 'all'
                            ? 'bg-foreground text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                        ].join(' ')}
                      >
                        Show All
                      </button>
                    </div>
                    {favoriteListings.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFavoriteIds([])}
                        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Clear favorites
                      </button>
                    )}
                  </div>
                </div>
                {favoriteListings.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Click a listing card and use the heart button to add favorites.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {favoriteListings.map((post) => (
                      <button
                        key={`fav-${post.id}`}
                        type="button"
                        className="rounded-full border border-border/60 px-3 py-1 text-xs hover:bg-muted/60 transition-colors"
                        onClick={() => navigate(`/post/${post.id}`)}
                      >
                        {post.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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

              <div className="rounded-2xl border border-border/50 bg-card/40 p-4 md:p-5 backdrop-blur-sm">
                {filteredPosts.length === 0 ? (
                  <div className="py-16 text-center">
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
                ) : viewMode === 'nearby' ? (
                  <ThreeDImageGallery
                    cards={orderedPostsByDistance.map((post) => ({
                      id: String(post.id),
                      title: post.title,
                      city: post.city,
                      distanceKm: post.distanceKm,
                      category: post.role,
                      summary: post.summary,
                      imageUrl: post.imageUrl,
                    }))}
                    title="Discover Space"
                    subtitle="The center sphere represents your location. Cards orbit around it for a dense discover overview."
                    onOpenDetail={(listing) => navigate(`/post/${listing.id}`)}
                    favoriteIds={favoriteIds}
                    onToggleFavorite={toggleFavorite}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {orderedPostsByDistance.map((post) => {
                      const isFavorite = favoriteIds.includes(String(post.id));
                      return (
                        <div
                          key={`all-${post.id}`}
                          role="button"
                          tabIndex={0}
                          className="rounded-xl border border-border/60 bg-background/70 p-3 transition-colors hover:border-foreground/25 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          onClick={() => navigate(`/post/${post.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/post/${post.id}`);
                            }
                          }}
                        >
                          <div className="relative">
                            <span
                              className={[
                                'absolute top-2 left-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                post.isMock
                                  ? 'bg-muted/90 text-muted-foreground'
                                  : 'bg-emerald-600/90 text-white',
                              ].join(' ')}
                            >
                              {post.isMock ? 'Showcase' : 'Live'}
                            </span>
                            <img
                              src={post.imageUrl}
                              alt={post.title}
                              className="h-36 w-full rounded-lg object-cover pointer-events-none"
                              loading="lazy"
                            />
                          </div>
                          <div className="mt-2.5">
                            <p className="text-sm font-semibold truncate">{post.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {post.city ? `${post.city} • ` : ''}
                              {post.role}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {post.distanceKm.toFixed(1)} km
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(String(post.id));
                                }}
                                className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-xs hover:bg-muted/60"
                              >
                                <Heart size={12} fill={isFavorite ? 'currentColor' : 'none'} />
                                {isFavorite ? 'Saved' : 'Save'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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

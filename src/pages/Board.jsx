import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal, MapPin, Cpu, Tag, Heart, Bookmark } from 'lucide-react';
import { boardListings } from '@/lib/showcaseListings';
import { getAuth, getAuthChangedEventName } from '@/lib/auth';
import { BoardGridSkeleton } from '@/components/ui/skeleton';
import { NoResults, NoPosts } from '@/components/ui/empty-state';
import MatchScoreRing from '@/components/ui/match-score-ring';
import { calculateProjectMatchScore } from '@/lib/matchScore';
import { useToast } from '@/components/ui/toast';
import { useLocale } from '@/contexts/locale-context';

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
  const matchScore = Number.isFinite(idNum) ? 100 - (Math.abs(idNum * 13) % 45) : 85;

  return {
    id: rawId,
    title,
    role: expertise,
    city: cityRaw,
    tags,
    matchScore,
    imageUrl: `/assets/mesh_${meshIdx}.png`,
    isMock: false,
    description: desc,
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

function Board() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const auth = getAuth();
  const { toast } = useToast();
  const { locale, t } = useLocale();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') ?? '');
  const [activeFilter, setActiveFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('');
  const [expertiseFilter, setExpertiseFilter] = useState('');
  const [viewMode, setViewMode] = useState(readStoredViewMode);
  const [liveListings, setLiveListings] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveErr, setLiveErr] = useState('');
  const [favoriteIds, setFavoriteIds] = useState(readStoredFavorites);
  const [bookmarkIds, setBookmarkIds] = useState([]);

  const loadBookmarks = async () => {
    const token = getAuth()?.accessToken;
    if (!token) { setBookmarkIds([]); return; }
    try {
      const res = await fetch('/api/bookmarks', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setBookmarkIds(json.data.map((b) => String(b.postId ?? b.post_id ?? b.id)));
      }
    } catch { /* silent */ }
  };

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
    loadBookmarks();
    const ev = getAuthChangedEventName();
    const syncAll = () => { loadLivePosts(); loadBookmarks(); };
    window.addEventListener(ev, syncAll);
    return () => window.removeEventListener(ev, syncAll);
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

  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setSearchTerm(q);
  }, [searchParams]);

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
    const q = searchTerm.trim().toLocaleLowerCase('tr');
    return posts.filter((p) => {
      const text = `${p.title} ${p.role} ${p.tags.join(' ')}`.toLocaleLowerCase('tr');
      const searchOk = !q || text.includes(q);
      const filterOk = activeFilter === 'All' ? true 
                     : activeFilter === 'Favorites' ? bookmarkIds.includes(String(p.id))
                     : p.tags.some((t) => t === activeFilter);
      const cityOk = !cityFilter || p.city === cityFilter;
      const expertiseOk = !expertiseFilter || p.role === expertiseFilter;
      return searchOk && filterOk && cityOk && expertiseOk;
    });
  }, [posts, searchTerm, activeFilter, cityFilter, expertiseFilter, bookmarkIds]);
  const orderedPosts = useMemo(
    () => [...filteredPosts].sort((a, b) => b.matchScore - a.matchScore),
    [filteredPosts]
  );
  const favoriteListings = useMemo(
    () => orderedPosts.filter((post) => bookmarkIds.includes(String(post.id))),
    [orderedPosts, bookmarkIds]
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

  const toggleBookmark = async (postId, isMock) => {
    const strId = String(postId);
    const isBookmarked = bookmarkIds.includes(strId);
    // Optimistic update
    setBookmarkIds((prev) =>
      isBookmarked ? prev.filter((id) => id !== strId) : [...prev, strId]
    );
    if (!isMock && auth?.accessToken) {
      try {
        if (isBookmarked) {
          const res = await fetch(`/api/bookmarks/${postId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${auth.accessToken}` },
          });
          if (!res.ok) throw new Error();
          toast({ title: t('toastRemovedFromSaved', 'Removed from saved'), variant: 'info' });
        } else {
          const res = await fetch('/api/bookmarks', {
            method: 'POST',
            headers: { Authorization: `Bearer ${auth.accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId }),
          });
          if (!res.ok) throw new Error();
          toast({ title: t('toastListingSaved', 'Listing saved'), variant: 'success' });
        }
      } catch {
        // Revert optimistic update on error
        setBookmarkIds((prev) =>
          isBookmarked ? [...prev, strId] : prev.filter((id) => id !== strId)
        );
        toast({
          title: t('toastSaveFailedTitle', 'Error'),
          description: t('toastSaveFailedDesc', 'Save action failed'),
          variant: 'error',
        });
      }
    }
  };

  return (
    <section className="page" data-screen-label="01 Discover">
      <div className="hero">
        <div className="hero-mesh" style={{ backgroundImage: 'url("/assets/mesh_2.png")' }}></div>
        <div className="hero-inner">
          <div>
            <span className="hero-eyebrow">{t('discoverHeroEyebrow', 'Health AI platform')}</span>
            <h1 style={{ marginTop: '16px' }}>
              {t('discoverHeroTitleLine1', 'Research worth')}
              <br />
              <em>{t('discoverHeroTitleEm', 'doing together.')}</em>
            </h1>
            <p>{t('discoverHeroDesc', 'Browse live clinical-AI collaborations from Mayo, Kaiser, Stanford and 60+ partner institutions. Match scores use your profile and past work.')}</p>
            <div className="hero-ctas">
              {auth?.accessToken ? (
                <Link to="/post/new" className="btn btn-on-dark">{t('matchPostProject', 'Post a project')}</Link>
              ) : (
                <Link to="/auth?mode=register" className="btn btn-on-dark">{t('register', 'Register')}</Link>
              )}
              <Link to="/how-matching-works" className="btn btn-ghost-on-dark">{t('discoverHowMatchingCta', 'How matching works →')}</Link>
            </div>
          </div>
          <div className="hero-kpi text-[13px] leading-relaxed">
            <div className="flex-between py-[14px] border-b border-white/12">
              <span>{t('discoverKpiLiveProjects', 'Live projects')}</span><span className="hero-kpi-value">{posts.length}</span>
            </div>
            <div className="flex-between py-[14px] border-b border-white/12">
              <span>{t('discoverKpiPartnerInstitutions', 'Partner institutions')}</span><span className="hero-kpi-value">64</span>
            </div>
            <div className="flex-between py-[14px]">
              <span>{t('discoverKpiMatchesThisWeek', 'Matches made this week')}</span><span className="hero-kpi-value hero-kpi-value-accent">{favoriteListings.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section-head w-full">
        <div className="readability-fade-panel">
          <div className="eyebrow-wrap" style={{ marginBottom: '10px' }}>
            <span className="hair"></span>
            <span className="eyebrow">{auth?.accessToken ? t('forYouBasedOnProfile', 'For you · based on your profile') : t('privateListings', 'Private listings')}</span>
          </div>
          <h2>{auth?.accessToken ? t('projectsMatchedToYourWork', 'Projects matched to your work') : t('discoverHowMatchingWorks', 'Discover how matching works')}</h2>
        </div>
        {auth?.accessToken && (
        <div className="sortby flex items-center gap-4 flex-wrap">
          <div className="relative">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
             <input
               type="text"
               value={searchTerm}
               onChange={(e) => {
                 const nextValue = e.target.value;
                 setSearchTerm(nextValue);
                 const nextParams = new URLSearchParams(searchParams);
                 const trimmed = nextValue.trim();
                 if (trimmed) {
                   nextParams.set('q', trimmed);
                 } else {
                   nextParams.delete('q');
                 }
                 setSearchParams(nextParams, { replace: true });
               }}
              placeholder={t('commandPaletteSearchPlaceholder', 'Search pages, find listings…')}
               className="h-9 w-48 rounded-full border bg-background pl-9 pr-3 text-xs"
             />
          </div>
          <span className="hidden sm:inline text-white/80">{t('discoverSortedByMatch', 'Sorted by match score')}</span>
        </div>
        )}
      </div>

      {auth?.accessToken && (
      <div className="filterbar">
        <span className={`filter ${activeFilter === 'All' ? 'active' : ''}`} onClick={() => setActiveFilter('All')}>
          <span className="pip"></span>{t('discoverFilterTopMatches', 'Top matches')}
        </span>
        {filterTags.slice(0, 5).map(tag => (
           <span key={tag} className={`filter ${activeFilter === tag ? 'active' : ''}`} onClick={() => setActiveFilter(tag)}>{tag}</span>
        ))}
        <span className={`filter ${activeFilter === 'Favorites' ? 'active' : ''}`} onClick={() => setActiveFilter('Favorites')}>
           {t('discoverFilterSaved', 'Saved')}{' '}
           <Heart size={12} className={`inline ml-1 ${activeFilter === 'Favorites' ? 'fill-current' : ''}`} />
        </span>
        <span className="filterbar-spacer"></span>
        <span className="sortby">{orderedPosts.length} of {posts.length}</span>
      </div>
      )}

      <div className="grid-listings mb-10" data-tour="discover-board">
        {!auth?.accessToken ? (
          <div className="col-span-full rounded-2xl border border-border/70 bg-card/70 p-8 text-center">
            <h3 className="font-serif text-3xl text-foreground">{t('discoverMembersOnlyTitle', 'Listings are members-only')}</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              {t('discoverMembersOnlyDesc', 'You can view platform overview publicly, but project listings stay private to protect partner data and collaboration details.')}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to="/auth?mode=register" className="btn-primary">{t('discoverCreateFreeAccount', 'Create free account')}</Link>
              <Link to="/auth?mode=login" className="btn-secondary">{t('signIn', 'Sign in')}</Link>
            </div>
          </div>
        ) : liveLoading ? (
          <BoardGridSkeleton count={6} />
        ) : orderedPosts.length === 0 && posts.length === 0 ? (
          <NoPosts canCreate={Boolean(auth?.accessToken)} />
        ) : orderedPosts.length === 0 ? (
          <NoResults query={searchTerm} onClear={clearAll} />
        ) : (
          <>
            <div className="grid-listings-inner col-span-full w-full">
              {orderedPosts.map((post, idx) => {
                const isBookmarked = bookmarkIds.includes(String(post.id));
                const isFav = bookmarkIds.includes(String(post.id));
                // Login gate: blur cards beyond index 2 for guests
                const isGated = !auth?.accessToken && idx >= 3;

                return (
                  <div
                    key={post.id}
                    className="listing-card"
                    style={isGated ? { filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.7 } : {}}
                    onClick={() => !isGated && navigate(`/post/${post.id}`)}
                  >
                    <div className="listing-img" style={{ backgroundImage: `url("${post.imageUrl}")` }} />
                    <div className="listing-body">
                      <div className="listing-tags">
                        {post.tags.slice(0, 2).map((t) => (
                          <span key={t} className="listing-tag">{t}</span>
                        ))}
                      </div>
                      <h3 className="listing-title">{post.title}</h3>
                      <div className="listing-meta">
                        {post.city && <span><MapPin size={11} className="inline mr-1" />{post.city}</span>}
                        <span><Tag size={11} className="inline mr-1" />{post.role}</span>
                      </div>
                      <div className="listing-preview">
                        <p>{post.description || 'No additional details provided.'}</p>
                      </div>
                    </div>
                    <div className="listing-footer">
                      <div className="listing-score">
                        <Cpu size={12} />
                        <span>{post.matchScore}% match</span>
                      </div>
                      {auth?.accessToken && (
                        <button
                          className={`listing-bookmark ${isBookmarked ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleBookmark(post.id, post.isMock); }}
                          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                        >
                          <Heart size={14} className={isBookmarked ? 'fill-current' : ''} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Login gate overlay — shown when guest sees more than 3 cards */}
            {!auth?.accessToken && orderedPosts.length > 3 && (
              <div
                className="col-span-full w-full"
                style={{
                  marginTop: '-120px',
                  position: 'relative',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '40px 24px 32px',
                  background: 'linear-gradient(to bottom, transparent 0%, var(--bg) 30%)',
                }}
              >
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: '0 0 8px', color: 'var(--fg)' }}>
                  {orderedPosts.length - 3}+ more projects waiting
                </p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'var(--fg-subtle)', margin: '0 0 24px', maxWidth: '360px', lineHeight: 1.6 }}>
                  Join the network to see all listings, get match scores based on your profile, and send collaboration requests.
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Link to="/auth?mode=register" className="btn-primary">Join for free</Link>
                  <Link to="/auth?mode=login" className="btn-secondary">Sign in</Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default Board;

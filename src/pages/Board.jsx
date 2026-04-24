import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal, MapPin, Cpu, Tag, Heart } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') ?? '');
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
                     : activeFilter === 'Favorites' ? favoriteIds.includes(String(p.id))
                     : p.tags.some((t) => t === activeFilter);
      const cityOk = !cityFilter || p.city === cityFilter;
      const expertiseOk = !expertiseFilter || p.role === expertiseFilter;
      return searchOk && filterOk && cityOk && expertiseOk;
    });
  }, [posts, searchTerm, activeFilter, cityFilter, expertiseFilter, favoriteIds]);
  const orderedPosts = useMemo(
    () => [...filteredPosts].sort((a, b) => b.matchScore - a.matchScore),
    [filteredPosts]
  );
  const favoriteListings = useMemo(
    () => orderedPosts.filter((post) => favoriteIds.includes(String(post.id))),
    [orderedPosts, favoriteIds]
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
    <section className="page" data-screen-label="01 Discover">
      <div className="hero">
        <div className="hero-mesh" style={{ backgroundImage: 'url("/assets/mesh_2.png")' }}></div>
        <div className="hero-inner">
          <div>
            <span className="hero-eyebrow">Health AI platform</span>
            <h1 style={{ marginTop: '16px' }}>Research worth<br/><em>doing together.</em></h1>
            <p>Browse live clinical-AI collaborations from Mayo, Kaiser, Stanford and 60+ partner institutions. Match scores use your profile and past work.</p>
            <div className="hero-ctas">
              {auth?.accessToken ? (
                <Link to="/post/new" className="btn btn-on-dark">Post a project</Link>
              ) : (
                <Link to="/auth?mode=register" className="btn btn-on-dark">Join network</Link>
              )}
              <Link to="/how-matching-works" className="btn btn-ghost-on-dark">How matching works →</Link>
            </div>
          </div>
          <div className="hero-kpi text-[13px] leading-relaxed">
            <div className="flex-between py-[14px] border-b border-white/12">
              <span>Live projects</span><span className="hero-kpi-value">{posts.length}</span>
            </div>
            <div className="flex-between py-[14px] border-b border-white/12">
              <span>Partner institutions</span><span className="hero-kpi-value">64</span>
            </div>
            <div className="flex-between py-[14px]">
              <span>Matches made this week</span><span className="hero-kpi-value hero-kpi-value-accent">{favoriteListings.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section-head w-full">
        <div className="readability-fade-panel">
          <div className="eyebrow-wrap" style={{ marginBottom: '10px' }}>
            <span className="hair"></span>
            <span className="eyebrow">{auth?.accessToken ? 'For you · based on your profile' : 'Trending collaborations'}</span>
          </div>
          <h2>Projects <em>matched</em> to your work</h2>
        </div>
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
               placeholder="Search projects..."
               className="h-9 w-48 rounded-full border bg-background pl-9 pr-3 text-xs"
             />
          </div>
          <span className="hidden sm:inline text-white/80">Sorted by <strong className="text-white">match score</strong></span>
        </div>
      </div>

      <div className="filterbar">
        <span className={`filter ${activeFilter === 'All' ? 'active' : ''}`} onClick={() => setActiveFilter('All')}>
          <span className="pip"></span>Top matches
        </span>
        {filterTags.slice(0, 5).map(tag => (
           <span key={tag} className={`filter ${activeFilter === tag ? 'active' : ''}`} onClick={() => setActiveFilter(tag)}>{tag}</span>
        ))}
        <span className={`filter ${activeFilter === 'Favorites' ? 'active' : ''}`} onClick={() => setActiveFilter('Favorites')}>
           Saved <Heart size={12} className={`inline ml-1 ${activeFilter === 'Favorites' ? 'fill-current' : ''}`} />
        </span>
        <span className="filterbar-spacer"></span>
        <span className="sortby">{orderedPosts.length} of {posts.length}</span>
      </div>

      <div className="grid-listings mb-10">
        {orderedPosts.map(post => {
           const isFav = favoriteIds.includes(String(post.id));
           const matchScore = Number.isFinite(post.matchScore) ? post.matchScore : 68;
           const isHigh = matchScore > 80;
           const isMed = matchScore > 60;
           return (
             <article key={post.id} className="listing cursor-pointer transition-transform hover:-translate-y-1" onClick={() => navigate(`/post/${post.id}`)}>
               <div className="listing-hero" style={{ backgroundImage: `url('${post.imageUrl}')` }}>
                 <button
                   type="button"
                   onClick={(e) => { e.stopPropagation(); toggleFavorite(String(post.id)); }}
                   className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-white/60 dark:bg-black/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:scale-110 transition-all z-10"
                 >
                   <Heart size={16} fill={isFav ? 'currentColor' : 'none'} strokeWidth={isFav ? 1.5 : 2} className={isFav ? "text-[#E63946]" : "text-black dark:text-white"} />
                 </button>
                 <span className={`absolute top-3 left-3 text-[11px] font-bold px-2 py-0.5 rounded-full z-10 bg-white/70 dark:bg-black/70 backdrop-blur border border-white/30 dark:border-black/30 w-max ${isHigh ? 'text-emerald-700 dark:text-emerald-400' : isMed ? 'text-amber-700 dark:text-amber-400' : 'text-zinc-700 dark:text-zinc-400'}`}>
                   {matchScore}% Match
                 </span>
               </div>
               <div className="listing-body">
                 <div className="listing-org">{post.city || 'Remote Collaboration'}</div>
                 <h3 className="listing-title">{post.title}</h3>
                 <div className="listing-tags">
                   {post.tags.slice(0, 4).map((tag) => (
                     <span key={tag} className="tag">{tag}</span>
                   ))}
                 </div>
               </div>
               <div className="listing-foot">
                 <span className="meta">{post.role} needed</span>
                 <span className="price">
                   View <Tag size={12} className="inline ml-1 mb-0.5" />
                 </span>
               </div>
             </article>
           )
        })}
      </div>
    </section>
  );
}

export default Board;

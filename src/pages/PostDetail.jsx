import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  ArrowLeft,
  Send,
  MapPin,
  Target,
  CheckCircle2,
  Loader2,
  CalendarClock,
  Bookmark,
} from 'lucide-react';
import { getAuth, getAuthChangedEventName } from '@/lib/auth';
import { boardListings } from '@/lib/showcaseListings';
import MatchScoreRing from '@/components/ui/match-score-ring';
import { calculateProjectMatchScore } from '@/lib/matchScore';
import { useToast } from '@/components/ui/toast';

const STAGE_LABELS = {
  idea: 'Idea',
  concept_validation: 'Concept validation',
  prototype: 'Prototype',
  pilot: 'Pilot',
  pre_deployment: 'Pre-deployment',
};

const STATUS_SHORT_LABELS = {
  draft: 'Draft',
  active: 'Active',
  meeting_scheduled: 'Meeting scheduled',
  partner_found: 'Partner found',
  expired: 'Expired',
  removed_by_admin: 'Removed',
};

const STATUS_BADGE_STYLES = {
  draft: 'bg-zinc-600/90 text-white',
  active: 'bg-emerald-600/90 text-white',
  meeting_scheduled: 'bg-blue-600/90 text-white',
  partner_found: 'bg-purple-600/90 text-white',
  expired: 'bg-red-600/90 text-white',
  removed_by_admin: 'bg-red-950/90 text-red-100',
};

const MOCK_STAGE_MAP = {
  Planning: 'idea',
  Research: 'concept_validation',
  Prototyping: 'prototype',
  Validation: 'pilot',
  Testing: 'pre_deployment',
};

function createMockPost(mockPost) {
  if (!mockPost) return null;
  return {
    id: mockPost.id,
    title: mockPost.title,
    domain: Array.isArray(mockPost.tags) ? mockPost.tags.join(', ') : '',
    required_expertise: mockPost.role,
    project_stage: MOCK_STAGE_MAP[mockPost.stage] || 'prototype',
    city: mockPost.city,
    country: 'Turkey',
    description:
      mockPost.description ||
      mockPost.summary ||
      'This discover listing is presented as a curated showcase concept.',
    confidentiality: 'open',
    status: 'active',
    user_id: null,
    owner: {
      first_name: 'Discover',
      last_name: 'Showcase',
    },
    isMock: true,
  };
}

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState('');
  const [interestSent, setInterestSent] = useState(false);
  const [flowStep, setFlowStep] = useState('interest');
  const [createdMeetingId, setCreatedMeetingId] = useState(null);
  const [slotInputs, setSlotInputs] = useState(['']);
  const [slotBusy, setSlotBusy] = useState(false);
  const [hasActiveRequest, setHasActiveRequest] = useState(false);
  const [activeRequestStatus, setActiveRequestStatus] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { toast } = useToast();
  const mockSource = boardListings.find((item) => String(item.id) === String(id)) || null;
  const isMockPost = Boolean(mockSource);

  const postIdNum = parseInt(id, 10);
  const meshIdx =
    Number.isFinite(postIdNum) && postIdNum > 0 ? ((postIdNum - 1) % 5) + 1 : 1;
  const meshImage = `/assets/mesh_${meshIdx}.png`;

  const loadPost = useCallback(async () => {
    const auth = getAuth();
    if (isMockPost) {
      setPost(createMockPost(mockSource));
      setLoadErr('');
      setLoading(false);
      return;
    }
    if (!auth?.accessToken || !id) {
      setPost(null);
      setLoadErr(!auth ? 'Please sign in to view this post.' : '');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadErr('');
    try {
      const res = await fetch(`/api/posts/${id}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to load post.');
      }
      setPost(json.data);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Failed to load post.');
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [id, isMockPost, mockSource]);

  useEffect(() => {
    loadPost();
    const auth = getAuth();
    if (auth?.accessToken && !isMockPost && id) {
      fetch(`/api/bookmarks/status/${id}`, { headers: { Authorization: `Bearer ${auth.accessToken}` } })
        .then((r) => r.json())
        .then((json) => { if (json?.bookmarked != null) setIsBookmarked(Boolean(json.bookmarked)); })
        .catch(() => {});
    }
    const ev = getAuthChangedEventName();
    window.addEventListener(ev, loadPost);
    return () => window.removeEventListener(ev, loadPost);
  }, [loadPost, isMockPost, id]);

  const handleToggleBookmark = async () => {
    const auth = getAuth();
    if (!auth?.accessToken || isMockPost) return;
    const next = !isBookmarked;
    setIsBookmarked(next);
    try {
      if (next) {
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { Authorization: `Bearer ${auth.accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: parseInt(id, 10) }),
        });
        if (!res.ok) throw new Error();
        toast({ title: 'İlan kaydedildi', variant: 'success' });
      } else {
        const res = await fetch(`/api/bookmarks/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        });
        if (!res.ok) throw new Error();
        toast({ title: 'Kaydedilenlerden çıkarıldı', variant: 'info' });
      }
    } catch {
      setIsBookmarked(!next); // revert
      toast({ title: 'Hata', description: 'Kaydetme işlemi başarısız', variant: 'error' });
    }
  };

  useEffect(() => {
    if (isMockPost) {
      setHasActiveRequest(false);
      setActiveRequestStatus('');
      return;
    }
    const auth = getAuth();
    if (!auth?.accessToken || !id) {
      setHasActiveRequest(false);
      setActiveRequestStatus('');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/meetings?type=sent', {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !Array.isArray(json.data)) return;

        const active = json.data.find(
          (m) =>
            String(m.post_id) === String(id) &&
            ['pending', 'accepted', 'scheduled'].includes(m.status)
        );
        if (!cancelled) {
          setHasActiveRequest(Boolean(active));
          setActiveRequestStatus(active?.status || '');
        }
      } catch {
        if (!cancelled) {
          setHasActiveRequest(false);
          setActiveRequestStatus('');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, interestSent, flowStep, isMockPost]);

  const auth = getAuth();
  const uid = auth?.user?.id;
  const isOwner = post && uid != null && post.user_id === uid;
  const isMeetingOnly = post?.confidentiality === 'meeting_only';
  const canAccessMeetingFlow =
    post &&
    ['active', 'meeting_scheduled'].includes(post.status) &&
    !isOwner &&
    uid != null &&
    !post.isMock;
  const canStartRequest = canAccessMeetingFlow && !hasActiveRequest;

  const ownerDisplay = post?.owner
    ? `${post.owner.first_name || ''} ${post.owner.last_name || ''}`.trim() || 'Author'
    : 'Author';

  const tags = post?.domain
    ? post.domain.split(/[,;]/).map((t) => t.trim()).filter(Boolean).slice(0, 4)
    : [];

  const handleInterest = async () => {
    if (!Number.isFinite(postIdNum) || postIdNum < 1) {
      setSubmitErr('Invalid post.');
      return;
    }
    if (!canStartRequest || !auth?.accessToken) return;
    if (isMeetingOnly && !ndaAccepted) {
      setSubmitErr('Please review and agree to the NDA terms before proposing time slots.');
      return;
    }
    setSubmitting(true);
    setSubmitErr('');
    try {
      const body = {
        post_id: postIdNum,
        message: message.trim() || undefined,
      };
      if (isMeetingOnly) {
        body.nda_accepted = true;
      }
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json.error || json.message || 'Could not send meeting request.';
        throw new Error(msg);
      }
      const mid = json.data?.id;
      if (mid == null) {
        throw new Error('Meeting created but no id returned.');
      }
      setCreatedMeetingId(mid);
      setInterestSent(true);
      setFlowStep('slots');
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : 'Request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitProposedSlots = async () => {
    if (!auth?.accessToken || createdMeetingId == null) return;
    const slots = slotInputs
      .map((s) => s.trim())
      .filter(Boolean)
      .map((raw) => {
        const dt = new Date(raw);
        if (Number.isNaN(dt.getTime())) return null;
        return { slot_datetime: dt.toISOString() };
      })
      .filter(Boolean);
    if (slots.length === 0) {
      setSubmitErr('Add at least one valid date and time.');
      return;
    }
    setSlotBusy(true);
    setSubmitErr('');
    try {
      const res = await fetch(`/api/meetings/${createdMeetingId}/slots`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slots }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json.error || json.message || 'Could not save time slots.';
        throw new Error(msg);
      }
      setFlowStep('success');
      setTimeout(() => {
        navigate('/meetings?tab=outgoing');
      }, 1600);
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : 'Could not save time slots.');
    } finally {
      setSlotBusy(false);
    }
  };

  if (!isMockPost && !getAuth()?.accessToken && !loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-6 max-w-6xl mx-auto">
        <Link
          to="/board"
          className="inline-flex items-center text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Discovery
        </Link>
        <p className="text-muted-foreground mb-4">{loadErr || 'Sign in to view posts and send meeting requests.'}</p>
        <Link to="/auth?mode=login" className="btn-primary inline-flex">
          Sign in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-6 max-w-6xl mx-auto flex items-center gap-2 text-muted-foreground">
        <Loader2 className="animate-spin" size={20} /> Loading post…
      </div>
    );
  }

  if (loadErr || !post) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-6 max-w-6xl mx-auto">
        <Link
          to="/board"
          className="inline-flex items-center text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Discovery
        </Link>
        <p className="text-destructive">{loadErr || 'Post not found.'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to="/board"
          className="inline-flex items-center text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Discovery
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <motion.div
          className="lg:col-span-8 flex flex-col gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative w-full h-[300px] sm:h-[350px] rounded-[2rem] overflow-hidden border border-border/50 shadow-2xl group flex flex-col justify-end">
            <div className="absolute inset-0 bg-black">
              <img
                src={meshImage}
                alt=""
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
            {/* MatchScoreRing — top right */}
            {getAuth()?.user && (
              <div className="absolute top-4 right-4 z-20">
                {(() => {
                  const ms = calculateProjectMatchScore(getAuth().user, post);
                  return <MatchScoreRing score={ms.score} signals={ms.signals ?? {}} size={60} />;
                })()}
              </div>
            )}
            {/* Bookmark button — top left */}
            {getAuth()?.accessToken && !post.isMock && (
              <button
                type="button"
                onClick={handleToggleBookmark}
                className="absolute top-4 left-4 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/20 hover:scale-110 transition-all"
                title={isBookmarked ? 'Kaydedilenlerden çıkar' : 'Kaydet'}
              >
                <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} className={isBookmarked ? 'text-violet-400' : 'text-white'} />
              </button>
            )}
            <div className="relative z-10 p-8 sm:p-10 text-white">
              <div className="flex flex-wrap gap-2 mb-4">
                {!post.isMock && post.status && (
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm ${
                      STATUS_BADGE_STYLES[post.status] || 'bg-white/15 text-white'
                    }`}
                  >
                    {STATUS_SHORT_LABELS[post.status] || post.status}
                  </span>
                )}
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white shadow-sm"
                  >
                    {tag}
                  </span>
                ))}
                {isMeetingOnly && (
                  <span className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-red-500/20 px-3 py-1.5 rounded-full font-mono text-xs font-bold text-red-300 uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Confidential
                  </span>
                )}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight drop-shadow-xl text-white leading-tight">
                {post.title}
              </h1>
            </div>
          </div>

          <motion.div
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 sm:p-10 shadow-sm"
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 pb-8 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Target size={24} />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Expertise
                  </div>
                  <div className="font-medium text-foreground">
                    {post.required_expertise || '—'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Project stage
                  </div>
                  <div className="font-medium text-foreground">
                    {STAGE_LABELS[post.project_stage] || post.project_stage || '—'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <MapPin size={24} />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Location
                  </div>
                  <div className="font-medium text-foreground">
                    {[post.city, post.country].filter(Boolean).join(', ') || '—'}
                  </div>
                </div>
              </div>
            </div>

            <div className="prose prose-zinc dark:prose-invert max-w-none">
              <h3 className="font-serif text-2xl font-bold text-foreground mb-4">Project overview</h3>
              <p className="text-muted-foreground text-lg leading-relaxed font-mono tracking-tight whitespace-pre-wrap">
                {post.description}
              </p>
            </div>

            {isMeetingOnly && (
              <div className="mt-10 p-6 rounded-2xl bg-zinc-900/5 dark:bg-zinc-900/50 border border-zinc-900/10 dark:border-white/10 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-16 h-16 shrink-0 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 dark:text-red-400">
                  <ShieldAlert size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">Confidential information</h4>
                  <p className="text-sm text-muted-foreground">
                    Full technical detail may be limited until NDA acceptance. Authorized access is granted
                    after you submit a meeting request with NDA agreement.
                  </p>
                </div>
              </div>
            )}

            {post.isMock && (
              <div className="mt-10 p-6 rounded-2xl border border-sky-500/20 bg-sky-500/10 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-16 h-16 shrink-0 rounded-full bg-sky-500/12 flex items-center justify-center text-sky-600 dark:text-sky-300">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">Showcase listing preview</h4>
                  <p className="text-sm text-muted-foreground">
                    This item comes from the discover showcase set, so meeting request actions are intentionally disabled.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          className="lg:col-span-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div
            className="sticky top-28 bg-card backdrop-blur-xl border border-border shadow-xl rounded-[2rem] p-8"
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="mb-8">
              <h3 className="font-sans font-bold text-2xl mb-2 text-foreground tracking-tight">
                {flowStep === 'slots' || flowStep === 'success'
                  ? 'Propose meeting times'
                  : 'Express interest'}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {flowStep === 'slots' || flowStep === 'success' ? (
                  <>
                    Add up to five time options for{' '}
                    <strong className="text-foreground">{ownerDisplay}</strong>. They will be notified after
                    you save.
                  </>
                ) : (
                  <>
                    Initiate contact with <strong className="text-foreground">{ownerDisplay}</strong> to
                    propose a technical review meeting.
                  </>
                )}
              </p>
            </div>

            {!['active', 'meeting_scheduled'].includes(post.status) && (
              <p
                className={[
                  'mb-4 text-sm',
                  post.status === 'expired'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-amber-600 dark:text-amber-400',
                ].join(' ')}
              >
                {post.status === 'expired'
                  ? isOwner
                    ? 'This listing has expired and is no longer visible in Discovery. It remains in your post history.'
                    : 'This listing has expired and is no longer visible in Discovery or accepting meeting requests.'
                  : `This post is not accepting new meeting requests (${post.status}).`}
              </p>
            )}

            {post.isMock && (
              <p className="mb-4 text-sm text-muted-foreground">
                This is a discover showcase detail page. Meeting flow is available only for live platform posts.
              </p>
            )}

            {isOwner && (
              <p className="mb-4 text-sm text-muted-foreground">This is your post — you cannot request a meeting on it.</p>
            )}

            {flowStep === 'interest' && isMeetingOnly && canStartRequest && (
              <div className="mb-6 bg-background rounded-xl border border-border p-5">
                <label className="flex items-start gap-4 cursor-pointer group">
                  <div className="relative mt-1">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={ndaAccepted}
                      onChange={(e) => setNdaAccepted(e.target.checked)}
                    />
                    <div
                      className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${
                        ndaAccepted ? 'bg-primary border-primary' : 'bg-transparent border-border group-hover:border-primary'
                      }`}
                    >
                      {ndaAccepted && (
                        <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground leading-snug select-none">
                    I digitally sign and agree to the{' '}
                    <a
                      href="/legal/mnda"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:opacity-80"
                    >
                      Mutual Non-Disclosure Agreement (MNDA)
                    </a>{' '}
                    required for confidential posts.
                  </span>
                </label>
              </div>
            )}

            {flowStep === 'interest' && canStartRequest && (
              <div className="mb-6">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Briefly introduce yourself or your interest…"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={submitting || interestSent}
                />
              </div>
            )}

            {flowStep === 'slots' && canAccessMeetingFlow && (
              <div className="mb-6 space-y-3">
                <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-background/80 p-3 text-xs text-muted-foreground">
                  <CalendarClock className="shrink-0 mt-0.5 text-primary" size={16} />
                  <span>
                    You can list up to five slots in total. Use &quot;Add another slot&quot; for more options,
                    then save with Propose slots.
                  </span>
                </div>
                {slotInputs.map((val, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="datetime-local"
                      value={val}
                      onChange={(e) => {
                        const next = [...slotInputs];
                        next[i] = e.target.value;
                        setSlotInputs(next);
                      }}
                      className="flex h-11 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                    {slotInputs.length > 1 && (
                      <button
                        type="button"
                        className="px-3 text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => setSlotInputs(slotInputs.filter((_, j) => j !== i))}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {slotInputs.filter(Boolean).length < 5 && (
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                    onClick={() => setSlotInputs([...slotInputs, ''])}
                  >
                    + Add another slot
                  </button>
                )}
              </div>
            )}

            {flowStep === 'success' && (
              <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={18} />
                Time slots saved. Redirecting to your outgoing requests…
              </div>
            )}

            {submitErr && (
              <p className="mb-4 text-sm text-destructive">{submitErr}</p>
            )}

            {flowStep === 'interest' && (
              <button
                type="button"
                className={`w-full relative overflow-hidden rounded-full py-4 px-6 text-sm font-bold uppercase tracking-widest shadow-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                  interestSent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary text-primary-foreground hover:opacity-90 hover:shadow-primary/25 disabled:opacity-50'
                }`}
                onClick={handleInterest}
                disabled={submitting || interestSent || !canStartRequest || !['active', 'meeting_scheduled'].includes(post.status)}
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} /> Sending…
                  </>
                ) : (
                  <>
                    Transmit proposal <Send size={16} />
                  </>
                )}
              </button>
            )}

            {flowStep === 'interest' && hasActiveRequest && (
              <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                You already have an active meeting request for this post
                {activeRequestStatus ? ` (${activeRequestStatus})` : ''}. You can create a new proposal
                after this request is cancelled, declined, or completed.
              </p>
            )}

            {flowStep === 'slots' && (
              <button
                type="button"
                className="w-full relative overflow-hidden rounded-full py-4 px-6 text-sm font-bold uppercase tracking-widest shadow-lg transition-all duration-300 flex items-center justify-center gap-3 bg-primary text-primary-foreground hover:opacity-90 hover:shadow-primary/25 disabled:opacity-50"
                onClick={submitProposedSlots}
                disabled={slotBusy || !canAccessMeetingFlow || !['active', 'meeting_scheduled'].includes(post.status)}
              >
                {slotBusy ? (
                  <>
                    <Loader2 className="animate-spin" size={16} /> Saving…
                  </>
                ) : (
                  <>
                    Propose slots <CalendarClock size={16} />
                  </>
                )}
              </button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default PostDetail;

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
} from 'lucide-react';
import { getAuth, getAuthChangedEventName } from '@/lib/auth';

const STAGE_LABELS = {
  idea: 'Idea',
  concept_validation: 'Concept validation',
  prototype: 'Prototype',
  pilot: 'Pilot',
  pre_deployment: 'Pre-deployment',
};

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

  const postIdNum = parseInt(id, 10);
  const meshIdx =
    Number.isFinite(postIdNum) && postIdNum > 0 ? ((postIdNum - 1) % 5) + 1 : 1;
  const meshImage = `/assets/mesh_${meshIdx}.png`;

  const loadPost = useCallback(async () => {
    const auth = getAuth();
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
  }, [id]);

  useEffect(() => {
    loadPost();
    const ev = getAuthChangedEventName();
    window.addEventListener(ev, loadPost);
    return () => window.removeEventListener(ev, loadPost);
  }, [loadPost]);

  const auth = getAuth();
  const uid = auth?.user?.id;
  const isOwner = post && uid != null && post.user_id === uid;
  const isMeetingOnly = post?.confidentiality === 'meeting_only';
  const canRequest =
    post &&
    post.status === 'active' &&
    !isOwner &&
    uid != null;

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
    if (!canRequest || !auth?.accessToken) return;
    if (isMeetingOnly && !ndaAccepted) {
      setSubmitErr('Please review and agree to the NDA terms to proceed.');
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
      setInterestSent(true);
      setTimeout(() => {
        navigate('/meetings?tab=outgoing');
      }, 1200);
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : 'Request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!getAuth()?.accessToken && !loading) {
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
            <div className="relative z-10 p-8 sm:p-10 text-white">
              <div className="flex flex-wrap gap-2 mb-4">
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
                Express interest
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Initiate contact with <strong className="text-foreground">{ownerDisplay}</strong> to propose
                a technical review meeting.
              </p>
            </div>

            {post.status !== 'active' && (
              <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
                This post is not accepting new meeting requests ({post.status}).
              </p>
            )}

            {isOwner && (
              <p className="mb-4 text-sm text-muted-foreground">This is your post — you cannot request a meeting on it.</p>
            )}

            {isMeetingOnly && canRequest && (
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
                    <span className="text-primary underline underline-offset-2">
                      Mutual Non-Disclosure Agreement (MNDA)
                    </span>{' '}
                    required for confidential posts.
                  </span>
                </label>
              </div>
            )}

            {canRequest && (
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
                  disabled={interestSent || submitting}
                />
              </div>
            )}

            {submitErr && (
              <p className="mb-4 text-sm text-destructive">{submitErr}</p>
            )}

            <button
              type="button"
              className={`w-full relative overflow-hidden rounded-full py-4 px-6 text-sm font-bold uppercase tracking-widest shadow-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                interestSent
                  ? 'bg-green-500 text-white cursor-default'
                  : 'bg-primary text-primary-foreground hover:opacity-90 hover:shadow-primary/25 disabled:opacity-50'
              }`}
              onClick={handleInterest}
              disabled={interestSent || submitting || !canRequest || post.status !== 'active'}
            >
              {interestSent ? (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 size={18} /> Request sent — redirecting…
                </motion.div>
              ) : submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Sending…
                </>
              ) : (
                <>
                  Transmit proposal <Send size={16} />
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default PostDetail;

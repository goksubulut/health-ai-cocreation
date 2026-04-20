import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { AnimatePresence, motion } from 'framer-motion';
import * as React from 'react';
import { cn } from '@/lib/utils';

const RATING_ITEMS = [
  { id: 'very-sad', label: 'Terrible', emoji: '😭' },
  { id: 'sad', label: 'Bad', emoji: '😕' },
  { id: 'neutral', label: 'Okay', emoji: '😐' },
  { id: 'happy', label: 'Amazing', emoji: '🤩' },
];

interface FeedbackWidgetProps {
  onSubmit?: (data: { rating: string; message: string; email: string }) => Promise<void> | void;
  onClose?: () => void;
  className?: string;
}

export function FeedbackWidget({ onSubmit, onClose, className }: FeedbackWidgetProps) {
  const [rating, setRating] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !message.trim()) return;
    setSending(true);
    try {
      await onSubmit?.({ rating, message: message.trim(), email: email.trim() });
      setRating('');
      setMessage('');
      setEmail('');
      onClose?.();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cn('w-full max-w-[420px] rounded-2xl border border-border/70 bg-card p-4 shadow-2xl', className)}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Share Feedback</p>
        <button type="button" onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
          Close
        </button>
      </div>

      {/* Animated cloud object only (transparent/no card background) */}
      <div className={cn('mb-4', rating && 'mb-10')}>
        <ToggleGroup.Root
          type="single"
          value={rating}
          onValueChange={(v) => setRating(v)}
          className="relative flex items-center justify-center gap-2 rounded-full border border-border/60 bg-gradient-to-r from-transparent via-primary/5 to-transparent px-2 py-2"
        >
          {RATING_ITEMS.map((item) => (
            <ToggleGroup.Item key={item.id} value={item.id} asChild>
              <button
                type="button"
                title={item.label}
                className={cn(
                  'group relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-xl transition-all duration-300 hover:scale-105',
                  rating === item.id
                    ? 'scale-110 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.55),0_0_22px_-6px_hsl(var(--primary))] bg-primary/10'
                    : 'text-muted-foreground hover:bg-accent/60'
                )}
              >
                <motion.span
                  animate={rating === item.id ? { y: [0, -3, 0], scale: [1, 1.08, 1] } : { y: 0, scale: 1 }}
                  transition={{ duration: 0.45 }}
                >
                  {item.emoji}
                </motion.span>
                {rating === item.id && (
                  <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-primary/40 bg-background/95 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary shadow-sm">
                    {item.label}
                  </span>
                )}
              </button>
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@institution.edu"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/70"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Message</label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what worked and what can be improved..."
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/70"
            required
          />
        </div>
        <button
          type="submit"
          disabled={!rating || !message.trim() || sending}
          className="btn-primary w-full justify-center disabled:pointer-events-none disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send Feedback'}
        </button>
      </form>
    </div>
  );
}

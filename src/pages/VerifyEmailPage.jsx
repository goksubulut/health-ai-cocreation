import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

/**
 * E-postadaki bağlantı: FRONTEND_URL/verify-email/:token
 * Backend: GET /api/auth/verify-email/:token (proxy ile)
 */
export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrMsg('Invalid link.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/auth/verify-email/${encodeURIComponent(token)}`);
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setErrMsg(json.message || 'Verification failed.');
          setStatus('error');
          return;
        }
        setStatus('success');
      } catch {
        if (!cancelled) {
          setErrMsg('Could not reach the server.');
          setStatus('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-16">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="animate-spin" size={32} />
          <p className="text-sm">Verifying your email…</p>
        </div>
      )}
      {status === 'success' && (
        <div className="max-w-md text-center space-y-4">
          <CheckCircle2 className="mx-auto text-emerald-500" size={48} />
          <h1 className="font-serif text-2xl font-bold text-foreground">Email verified</h1>
          <p className="text-muted-foreground text-sm">
            You can sign in with your email and password.
          </p>
          <Link to="/auth?mode=login" className="inline-flex btn-primary px-6 py-3 rounded-full text-sm font-semibold">
            Sign in
          </Link>
        </div>
      )}
      {status === 'error' && (
        <div className="max-w-md text-center space-y-4">
          <XCircle className="mx-auto text-destructive" size={48} />
          <h1 className="font-serif text-2xl font-bold text-foreground">Verification failed</h1>
          <p className="text-destructive text-sm">{errMsg}</p>
          <Link to="/auth?mode=register" className="inline-flex text-primary underline text-sm">
            Back to registration
          </Link>
        </div>
      )}
    </div>
  );
}

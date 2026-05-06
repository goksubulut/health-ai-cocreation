import React from 'react';
import { useNavigate } from 'react-router-dom';
import MotionButton from '@/components/ui/motion-button';
import { ScannerCardStream } from '../components/ui/scanner-card-stream';
import { getAuth, getDashboardPathByRole } from '@/lib/auth';

function LandingPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const ctaLabel = auth ? "Dashboard" : "Get Started";
  const ctaPath = auth ? getDashboardPathByRole(auth.user?.role) : '/auth?mode=register';

  return (
    /*
     * The outer div deliberately has no bg — GrainGradientBackground (fixed, z:-10)
     * renders behind everything.  We only need to mask the top and bottom edges
     * where the scanner stream bleeds into the nav / page body.
     */
    <div className="bg-background" style={{ position: 'relative', overflow: 'hidden' }}>
      <section
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '100dvh',
          overflow: 'hidden',
        }}
      >
        <ScannerCardStream />

        {/* Bottom mask: fades out into the rest of the page */}
        <div
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '180px',
            background: 'linear-gradient(to top, var(--bg-elev-1) 0%, transparent 100%)',
            zIndex: 30,
          }}
        />

        {/* CTA */}
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40,
          }}
        >
          <MotionButton
            label={ctaLabel}
            classes="shadow-2xl shadow-primary/20 border border-border/60"
            onClick={() => navigate(ctaPath)}
          />
        </div>
      </section>
    </div>
  );
}

export default LandingPage;

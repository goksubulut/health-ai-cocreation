import React from 'react';
import { useNavigate } from 'react-router-dom';
import MotionButton from '@/components/ui/motion-button';
import { ScannerCardStream } from '../components/ui/scanner-card-stream';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-background">
      <section className="relative h-[100dvh] w-full overflow-hidden">
        <ScannerCardStream />

        <div className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-b from-transparent via-transparent to-background/80" />
        <div className="absolute bottom-10 left-1/2 z-40 -translate-x-1/2">
          <MotionButton
            label="Get Started"
            classes="shadow-2xl shadow-primary/20 border border-border/60"
            onClick={() => navigate('/auth?mode=register')}
          />
        </div>
      </section>
    </div>
  );
}

export default LandingPage;

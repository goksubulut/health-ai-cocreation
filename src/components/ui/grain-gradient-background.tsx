"use client";

import React, { useEffect, useState } from 'react';
import { GrainGradient } from '@paper-design/shaders-react';
import { useTheme } from 'next-themes';
import { useAccessibility } from '@/contexts/accessibility-context';

export default function GrainGradientBackground({ className = "" }) {
  const { resolvedTheme } = useTheme();
  const { preferences } = useAccessibility();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const colors = ["#24201A", "#3F2548", "#35369C", "#7C679E", "#C8C793"];

  if (!mounted) {
    return <div className={`fixed inset-0 w-full h-full pointer-events-none ${className}`} style={{ zIndex: -10 }} />;
  }

  return (
    <div className={`grain-gradient-root fixed inset-0 w-full h-full pointer-events-none ${className}`} style={{ zIndex: -10 }}>
      <div className="grain-gradient-animate absolute inset-0" />
      <GrainGradient
        colors={colors}
        grain={0.0}
        softness={preferences.reduceMotion ? 1 : 0.9}
        intensity={preferences.reduceMotion ? 0.32 : 0.6}
        swirl={preferences.reduceMotion ? 0.05 : 0.55}
        speed={preferences.reduceMotion ? 0 : 0.9}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

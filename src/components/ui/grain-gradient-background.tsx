"use client";

import React, { useEffect, useState } from 'react';
import { GrainGradient } from '@paper-design/shaders-react';
import { useTheme } from 'next-themes';

export default function GrainGradientBackground({ className = "" }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const colors = ["#24201A", "#3F2548", "#35369C", "#7C679E", "#C8C793"];

  if (!mounted) {
    return <div className={`fixed inset-0 w-full h-full pointer-events-none ${className}`} style={{ zIndex: -10 }} />;
  }

  return (
    <div className={`fixed inset-0 w-full h-full pointer-events-none ${className}`} style={{ zIndex: -10 }}>
      <GrainGradient
        colors={colors}
        grain={0.0}
        softness={0.9}
        intensity={0.6}
        swirl={0.4}
        speed={0.3}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

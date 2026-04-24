import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { FeedbackWidget } from '@/components/ui/feedback-widget';
import { Header } from '@/components/ui/header-3';
import GrainGradientBackground from '@/components/ui/grain-gradient-background';
import {
  clearAuth,
  getAuth,
  getAuthChangedEventName,
  getDashboardPathByRole,
} from '@/lib/auth';

function Layout() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [auth, setAuthState] = useState(() => getAuth());
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    const prevPath = sessionStorage.getItem('healthai_prev_pathname');
    const currentPath = location.pathname;
    const prevWasHelp = Boolean(prevPath && prevPath.startsWith('/help'));
    const currentIsHelp = currentPath.startsWith('/help');

    if (prevWasHelp && !currentIsHelp) {
      setFeedbackOpen(true);
    }

    sessionStorage.setItem('healthai_prev_pathname', currentPath);
  }, [location.pathname]);

  useEffect(() => {
    const syncAuth = () => setAuthState(getAuth());
    window.addEventListener(getAuthChangedEventName(), syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener(getAuthChangedEventName(), syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  const isAuthenticated = Boolean(auth);
  const dashboardPath = auth ? getDashboardPathByRole(auth.user.role) : '/auth?mode=login';

  return (
    <div className="min-h-[100dvh] flex flex-col relative">
      <GrainGradientBackground />
      <Header
        isAuthenticated={isAuthenticated}
        dashboardPath={dashboardPath}
        profilePath="/profile"
        onSignOut={() => {
          clearAuth();
          window.location.href = '/auth?mode=login';
        }}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />
      <Outlet />
      <button
        type="button"
        onClick={() => setFeedbackOpen((v) => !v)}
        className="fixed bottom-5 left-5 z-[70] inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/95 px-4 py-2 text-sm font-semibold text-foreground shadow-lg backdrop-blur-md transition-colors hover:border-primary/60 hover:text-primary"
      >
        <MessageCircle size={16} />
        Feedback
      </button>
      {feedbackOpen && (
        <div className="fixed bottom-20 left-4 z-[80] sm:left-5">
          <FeedbackWidget
            onClose={() => setFeedbackOpen(false)}
            onSubmit={(data) => {
              // Placeholder handler until backend endpoint is added.
              console.log('Feedback submitted:', data);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default Layout;

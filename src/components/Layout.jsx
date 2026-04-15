import React, { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ArrowRight, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  clearAuth,
  getAuth,
  getAuthChangedEventName,
  getDashboardPathByRole,
} from '@/lib/auth';

function Layout() {
  const { theme, setTheme } = useTheme();
  const [auth, setAuthState] = useState(() => getAuth());
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
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-8 py-5 bg-background/60 backdrop-blur-md border-b border-border/40 page-navigation-overlay">
        <Link to="/" className="font-serif text-2xl font-bold tracking-tight">
          HEALTH<span className="italic text-primary">AI</span>
        </Link>
        <ul className="flex items-center gap-6">
          {isAuthenticated && (
            <li>
              <Link
                to={dashboardPath}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
            </li>
          )}
          <li>
            <Link to="/board" className="text-sm font-medium hover:text-primary transition-colors">Discover</Link>
          </li>
          {isAuthenticated ? (
            <>
              <li>
                <Link
                  to="/profile"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Profile
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    clearAuth();
                    window.location.href = '/auth?mode=login';
                  }}
                  className="btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                >
                  Sign Out
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/auth?mode=login" className="text-sm font-medium hover:text-primary transition-colors">Sign In</Link>
              </li>
              <li>
                <Link to="/auth?mode=register" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
                  Register <ArrowRight size={16} />
                </Link>
              </li>
            </>
          )}
          <li>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-card shadow-sm border border-border text-foreground transition-colors hover:bg-accent hover:text-accent-foreground ml-2"
            >
              {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
            </button>
          </li>
        </ul>
      </nav>
      {/* Outlet manages its own padding now instead of a global padding block. Layout is pure shell. */}
      <Outlet />
    </div>
  );
}

export default Layout;

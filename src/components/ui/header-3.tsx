'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { CircleHelp, LogOut, Moon, Settings, Sun, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

type HeaderProps = {
  isAuthenticated: boolean;
  dashboardPath: string;
  profilePath: string;
  userInitials?: string;
  onSignOut: () => void;
  theme: string | undefined;
  onToggleTheme: () => void;
};

export function Header({
  isAuthenticated,
  dashboardPath,
  profilePath,
  userInitials,
  onSignOut,
  theme,
  onToggleTheme,
}: HeaderProps) {
  const [open, setOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const menuOpenTimeoutRef = React.useRef<number | null>(null);
  const menuCloseTimeoutRef = React.useRef<number | null>(null);
  const profileMenuRef = React.useRef<HTMLDivElement | null>(null);
  const profileTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const location = useLocation();

  React.useEffect(() => {
    return () => {
      if (menuOpenTimeoutRef.current) {
        window.clearTimeout(menuOpenTimeoutRef.current);
      }
      if (menuCloseTimeoutRef.current) {
        window.clearTimeout(menuCloseTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  React.useEffect(() => {
    if (!profileMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!profileMenuRef.current?.contains(target) && !profileTriggerRef.current?.contains(target)) {
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [profileMenuOpen]);

  const openProfileMenu = React.useCallback(() => {
    if (menuCloseTimeoutRef.current) {
      window.clearTimeout(menuCloseTimeoutRef.current);
      menuCloseTimeoutRef.current = null;
    }
    if (menuOpenTimeoutRef.current) {
      window.clearTimeout(menuOpenTimeoutRef.current);
    }
    menuOpenTimeoutRef.current = window.setTimeout(() => {
      setProfileMenuOpen(true);
    }, 60);
  }, []);

  const closeProfileMenu = React.useCallback(() => {
    if (menuOpenTimeoutRef.current) {
      window.clearTimeout(menuOpenTimeoutRef.current);
      menuOpenTimeoutRef.current = null;
    }
    if (menuCloseTimeoutRef.current) {
      window.clearTimeout(menuCloseTimeoutRef.current);
    }
    menuCloseTimeoutRef.current = window.setTimeout(() => {
      setProfileMenuOpen(false);
    }, 140);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6 lg:px-8">
      <nav className="nav mx-auto w-full max-w-[1280px]">
        <div className="nav-left">
          <Link to="/" className="wordmark-sm text-foreground">
            HEALTH<em>AI</em>
          </Link>
          <div className="nav-links hidden md:flex">
            {isAuthenticated ? (
              <>
                <Link to="/board" className={cn("nav-link", location.pathname === '/board' && "active")}>Discover</Link>
                <Link to={dashboardPath} className={cn("nav-link", location.pathname.includes('/dashboard') && "active")}>Dashboard</Link>
              </>
            ) : (
              <>
                <Link to="/board" className={cn("nav-link", location.pathname === '/board' && "active")}>Discover</Link>
              </>
            )}
            
            <NavigationMenu className="md:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-[13px] font-medium text-muted-foreground h-auto p-0 px-3 hover:bg-transparent hover:text-foreground">Help</NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-background p-2 w-[240px] border border-border/70 rounded-xl shadow-lg">
                    <ul className="grid w-[240px] gap-1 rounded-md bg-popover shadow">
                      <HelpLink href="/help/faq" title="FAQ" description="Questions & answers." />
                      <HelpLink href="/help/troubleshooting" title="Issues" description="Troubleshooting." />
                      <HelpLink href="/help/contact-support" title="Support" description="Contact us." />
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        <div className="nav-right hidden md:flex">
          {isAuthenticated ? (
            <>
              <button type="button" onClick={onToggleTheme} className="opacity-70 hover:opacity-100 px-2 text-foreground">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <div
                className="relative"
                onMouseEnter={openProfileMenu}
                onMouseLeave={closeProfileMenu}
              >
                <button
                  ref={profileTriggerRef}
                  type="button"
                  className="avatar"
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                  aria-controls="profile-menu-panel"
                  onFocus={openProfileMenu}
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                >
                  {userInitials || '??'}
                </button>
                {profileMenuOpen ? (
                  <div
                    id="profile-menu-panel"
                    ref={profileMenuRef}
                    className="profile-menu-panel absolute right-0 top-[calc(100%+10px)] z-50 w-56 rounded-xl border border-border/70 bg-popover/95 p-1.5 shadow-lg backdrop-blur-md"
                    role="menu"
                    onMouseEnter={openProfileMenu}
                    onMouseLeave={closeProfileMenu}
                  >
                    <div className="px-2 py-1.5 text-xs uppercase tracking-[0.16em] text-muted-foreground">Account</div>
                    <Link to={profilePath} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent" role="menuitem" onClick={() => setProfileMenuOpen(false)}>
                      <User size={14} strokeWidth={1.5} /> Profile
                    </Link>
                    <button type="button" className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent" role="menuitem">
                      <Settings size={14} strokeWidth={1.5} /> Settings
                    </button>
                    <div className="my-1 h-px bg-border/70"></div>
                    <button type="button" onClick={onSignOut} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent" role="menuitem">
                      <LogOut size={14} strokeWidth={1.5} /> Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <button type="button" onClick={onToggleTheme} className="opacity-70 hover:opacity-100 px-2 text-foreground">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <Link to="/auth?mode=login" className="btn btn-ghost px-4 py-1.5 text-[13px] min-h-[32px]">Sign In</Link>
              <Link to="/auth?mode=register" className="btn btn-primary px-4 py-1.5 text-[13px] min-h-[32px]">Register</Link>
            </>
          )}
        </div>

        <Button
          size="icon"
          variant="outline"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          <MenuToggleIcon open={open} className="size-5" duration={300} />
        </Button>
      </nav>

      <MobileMenu open={open} className="flex flex-col gap-3 overflow-y-auto">
        <div className="rounded-xl border border-border/60 bg-card/70 p-2">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Need Help?
          </p>
          <MobileLink to="/help/faq" onClick={() => setOpen(false)}>
            <CircleHelp size={16} /> FAQ
          </MobileLink>
          <MobileLink to="/help/troubleshooting" onClick={() => setOpen(false)}>
            Troubleshooting
          </MobileLink>
          <MobileLink to="/help/contact-support" onClick={() => setOpen(false)}>
            Contact & Support
          </MobileLink>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/70 p-2">
          {isAuthenticated ? (
            <>
              <MobileLink to={dashboardPath} onClick={() => setOpen(false)}>Dashboard</MobileLink>
              <MobileLink to="/board" onClick={() => setOpen(false)}>Discover</MobileLink>
              <MobileLink to={profilePath} onClick={() => setOpen(false)}>Profile</MobileLink>
              <button
                type="button"
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-accent"
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <MobileLink to="/board" onClick={() => setOpen(false)}>Discover</MobileLink>
              <MobileLink to="/auth?mode=login" onClick={() => setOpen(false)}>Sign In</MobileLink>
              <MobileLink to="/auth?mode=register" onClick={() => setOpen(false)}>Register</MobileLink>
            </>
          )}
          <button
            type="button"
            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-accent"
            onClick={() => {
              setOpen(false);
              onToggleTheme();
            }}
          >
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </MobileMenu>
    </header>
  );
}

function HelpLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={href}
          className="group flex flex-col rounded-md p-3 transition-colors hover:bg-accent focus:bg-accent"
        >
          <span className="text-sm font-semibold text-foreground group-hover:text-accent-foreground">{title}</span>
          <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/90">{description}</span>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

function MobileLink({
  to,
  onClick,
  children,
}: {
  to: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
      {children}
    </Link>
  );
}

type MobileMenuProps = React.ComponentProps<'div'> & {
  open: boolean;
};

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
  if (!open || typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 top-16 z-40 border-y bg-background/95 p-4 backdrop-blur-lg md:hidden">
      <div className={cn('size-full', className)} {...props}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

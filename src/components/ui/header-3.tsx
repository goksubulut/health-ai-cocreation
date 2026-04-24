'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { Check, CircleHelp, Globe, LogOut, Moon, Settings, Sun, User } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type HeaderProps = {
  isAuthenticated: boolean;
  dashboardPath: string;
  profilePath: string;
  onSignOut: () => void;
  theme: string | undefined;
  onToggleTheme: () => void;
};

export function Header({
  isAuthenticated,
  dashboardPath,
  profilePath,
  onSignOut,
  theme,
  onToggleTheme,
}: HeaderProps) {
  const [open, setOpen] = React.useState(false);
  const [language, setLanguage] = React.useState<'tr' | 'en'>('tr');
  const scrolled = useScroll(10);
  const location = useLocation();

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
                <Link to={profilePath} className={cn("nav-link", location.pathname.includes('/profile') && "active")}>Profile</Link>
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
              <div className="search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <span>Search projects…</span>
                <span className="kbd">⌘K</span>
              </div>
              <button type="button" onClick={onToggleTheme} className="opacity-70 hover:opacity-100 px-2">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button type="button" onClick={onSignOut} className="opacity-70 hover:opacity-100 flex items-center pr-2">
                <LogOut size={16} />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="avatar">
                    U
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl border-border/70 bg-popover/95 backdrop-blur-md">
                  <DropdownMenuLabel className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Account</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link to={profilePath} className="flex items-center gap-2">
                      <User size={14} strokeWidth={1.5} /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings size={14} strokeWidth={1.5} className="mr-2" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Language</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setLanguage('tr')}>
                    <Globe size={14} strokeWidth={1.5} className="mr-2" /> Turkish
                    {language === 'tr' ? <Check size={14} className="ml-auto" /> : null}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('en')}>
                    <Globe size={14} strokeWidth={1.5} className="mr-2" /> English
                    {language === 'en' ? <Check size={14} className="ml-auto" /> : null}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onSignOut}>
                    <LogOut size={14} strokeWidth={1.5} className="mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <div className="search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <span>Search…</span>
                <span className="kbd">⌘K</span>
              </div>
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

function useScroll(threshold: number) {
  const [scrolled, setScrolled] = React.useState(false);

  const onScroll = React.useCallback(() => {
    setScrolled(window.scrollY > threshold);
  }, [threshold]);

  React.useEffect(() => {
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  React.useEffect(() => {
    onScroll();
  }, [onScroll]);

  return scrolled;
}

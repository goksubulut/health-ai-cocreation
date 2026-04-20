'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { CircleHelp, LogOut, Moon, Sun, User } from 'lucide-react';
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
  const scrolled = useScroll(10);

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cn('sticky top-0 z-50 w-full border-b border-transparent', {
        'bg-background/95 supports-[backdrop-filter]:bg-background/60 border-border backdrop-blur-lg': scrolled,
      })}
    >
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-serif text-2xl font-bold tracking-tight">
            HEALTH<span className="italic text-primary">AI</span>
          </Link>
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">Need Help?</NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background p-2">
                  <ul className="grid w-[320px] gap-1 rounded-md border bg-popover p-2 shadow">
                    <HelpLink href="/help/faq" title="FAQ" description="Common questions and detailed answers." />
                    <HelpLink
                      href="/help/troubleshooting"
                      title="Troubleshooting"
                      description="Problems, possible causes, and fixes."
                    />
                    <HelpLink
                      href="/help/contact-support"
                      title="Contact & Support"
                      description="Support channels and escalation points."
                    />
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" asChild>
                <Link to={dashboardPath}>Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/board">Discover</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to={profilePath}>
                  <User size={16} /> Profile
                </Link>
              </Button>
              <Button variant="outline" onClick={onSignOut}>
                <LogOut size={16} /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/board">Discover</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/auth?mode=login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/auth?mode=register">Register</Link>
              </Button>
            </>
          )}
          <Button size="icon" variant="outline" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
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
          className="flex flex-col rounded-md p-3 transition-colors hover:bg-accent focus:bg-accent"
        >
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
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

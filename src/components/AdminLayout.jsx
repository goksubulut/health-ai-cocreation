import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Activity, ArrowLeft, ChartColumn } from 'lucide-react';
import { getAuth, getDashboardPathByRole } from '@/lib/auth';

export default function AdminLayout() {
  const auth = getAuth();
  const backHref =
    auth?.user?.role && auth.user.role !== 'admin'
      ? getDashboardPathByRole(auth.user.role)
      : '/';

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-border/50 bg-card/30 backdrop-blur-xl">
        <div className="h-20 flex items-center px-6 border-b border-border/50">
          <span className="font-serif text-xl font-bold tracking-tight text-primary">
            HEALTH<span className="text-foreground">AI</span>
            <span className="ml-2 text-xs uppercase tracking-widest text-muted-foreground font-sans">Admin</span>
          </span>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`
            }
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/posts"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`
            }
          >
            <FileText size={18} />
            Posts
          </NavLink>
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`
            }
          >
            <Users size={18} />
            Users
          </NavLink>
          <NavLink
            to="/admin/stats"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`
            }
          >
            <ChartColumn size={18} />
            Stats
          </NavLink>
          <NavLink
            to="/admin/logs"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`
            }
          >
            <Activity size={18} />
            Logs
          </NavLink>
        </nav>

        <div className="p-4 border-t border-border/50">
          <Link
            to={backHref}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
          >
            <ArrowLeft size={16} />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex-1 p-8 lg:p-12 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

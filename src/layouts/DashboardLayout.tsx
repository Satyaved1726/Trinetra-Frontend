import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Bell,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Shield,
  Sun,
  X
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

const sidebarLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/complaints', icon: FileText, label: 'Complaints' },
  { to: '/admin/reports', icon: FileText, label: 'Reports' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' }
];

export interface DashboardOutletContext {
  adminSearchQuery: string;
  setAdminSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

function SidebarNav({ collapsed, onLinkClick }: { collapsed?: boolean; onLinkClick?: () => void }) {
  const { logout } = useAuth();

  return (
    <>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onLinkClick}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => { logout(); onLinkClick?.(); }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );
}

export function DashboardLayout() {
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:flex flex-col bg-slate-900 text-white overflow-hidden shrink-0"
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-white/10 overflow-hidden">
          <Link to="/admin/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  key="logo-text"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="font-display font-bold text-base tracking-[0.2em] whitespace-nowrap overflow-hidden"
                >
                  TRINETRA
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        <SidebarNav collapsed={collapsed} />
      </motion.aside>

      {/* Main content column */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Navbar */}
        <header className="h-16 flex items-center gap-3 px-4 border-b border-border bg-card shrink-0">
          {/* Desktop collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed((v) => !v)}
            aria-label="Toggle sidebar"
          >
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ChevronLeft className="h-5 w-5" />
            </motion.div>
          </Button>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search */}
          <div className="flex-1 max-w-sm hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                value={adminSearchQuery}
                onChange={(event) => setAdminSearchQuery(event.target.value)}
                className="w-full bg-muted rounded-xl pl-9 pr-4 py-2 text-sm border border-transparent outline-none focus:border-primary/40 focus:ring-2 focus:ring-ring/30 transition"
                placeholder="Search complaints..."
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 bg-rose-500 rounded-full" />
            </Button>

            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold ml-1 shrink-0">
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet context={{ adminSearchQuery, setAdminSearchQuery }} />
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="mobile-sidebar"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-50 flex flex-col"
            >
              <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-display font-bold text-base tracking-[0.2em]">TRINETRA</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-white hover:bg-white/10"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <SidebarNav onLinkClick={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

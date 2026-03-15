import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Moon, Shield, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/submit-complaint', label: 'Submit Complaint', end: false },
  { to: '/track-complaint', label: 'Track Complaint', end: false }
];

export function AppLayout() {
  const { isAuthenticated, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Brand */}
            <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold tracking-[0.2em] text-foreground hidden sm:inline">
                TRINETRA
              </span>
            </NavLink>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn(
                      'px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              {isAuthenticated ? (
                <Button asChild size="sm">
                  <NavLink to={role === 'EMPLOYEE' ? '/employee/dashboard' : '/admin/dashboard'}>
                    Dashboard
                  </NavLink>
                </Button>
              ) : null}

              {!isAuthenticated ? (
                <Button asChild size="sm" variant="default">
                  <NavLink to="/auth/login">Login</NavLink>
                </Button>
              ) : null}
            </div>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden border-t border-border"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex py-2.5 px-3 rounded-xl text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                <div className="pt-2 flex flex-wrap gap-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { toggleTheme(); setMenuOpen(false); }}
                    className="text-muted-foreground"
                  >
                    {theme === 'dark' ? (
                      <><Sun className="h-4 w-4 mr-2" />Light mode</>
                    ) : (
                      <><Moon className="h-4 w-4 mr-2" />Dark mode</>
                    )}
                  </Button>
                  {isAuthenticated ? (
                    <Button asChild size="sm" onClick={() => setMenuOpen(false)}>
                      <NavLink to={role === 'EMPLOYEE' ? '/employee/dashboard' : '/admin/dashboard'}>
                        Dashboard
                      </NavLink>
                    </Button>
                  ) : null}

                  {!isAuthenticated ? (
                    <Button asChild size="sm" onClick={() => setMenuOpen(false)}>
                      <NavLink to="/auth/login">Login</NavLink>
                    </Button>
                  ) : null}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <Outlet />
    </div>
  );
}

// In src/components/Navigation.tsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, User, LogIn, UserPlus, Menu, X, Brain, Trophy, Award, LogOut, Zap } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Navigation items for authenticated users
const authNavItems = [
  { path: '/flashcards', icon: Brain, label: 'Flashcards', color: 'group-hover:text-violet-400' },
  { path: '/quiz', icon: Trophy, label: 'Quiz', color: 'group-hover:text-cyan-400' },
  { path: '/progress', icon: Award, label: 'Progress', color: 'group-hover:text-amber-400' },
  { path: '/dashboard', icon: User, label: 'Dashboard', color: 'group-hover:text-violet-400' },
] as const;

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Add scroll shadow to navbar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Animate mobile menu in with anime.js
  useEffect(() => {
    if (!isMobileMenuOpen || !mobileMenuRef.current) return;
    (async () => {
      try {
        const anime = (await import('animejs')).default;
        anime({
          targets: mobileMenuRef.current,
          translateY: [-12, 0],
          opacity: [0, 1],
          duration: 300,
          easing: 'easeOutCubic',
        });
        anime({
          targets: mobileMenuRef.current?.querySelectorAll('a, button'),
          translateX: [-16, 0],
          opacity: [0, 1],
          delay: anime.stagger(60, { start: 80 }),
          duration: 280,
          easing: 'easeOutExpo',
        });
      } catch { /* anime not loaded yet */ }
    })();
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-black/40 backdrop-blur-2xl border-b border-white/10 shadow-[0_1px_24px_rgba(124,58,237,0.08)]'
          : 'bg-transparent backdrop-blur-lg border-b border-white/5'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <div className="flex items-center">
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden mr-2 text-foreground/70 hover:text-foreground hover:bg-white/5"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center space-x-2.5 group">
              <div className="relative p-2 rounded-xl bg-gradient-primary transition-all duration-300 group-hover:scale-105">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span
                className="text-xl font-bold text-foreground hidden sm:block font-display"
              >
                SkillSculptor
              </span>
              <span
                className="text-xl font-bold text-foreground sm:hidden font-display"
              >
                SS
              </span>
            </Link>
          </div>

          {/* ── Desktop Navigation ── */}
          <div className="hidden md:flex items-center space-x-1">
            {isAuthenticated ? (
              <>
                {authNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'group relative flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'text-foreground bg-white/8'
                          : 'text-foreground/60 hover:text-foreground hover:bg-white/5'
                      )}
                    >
                      <Icon className={cn('w-4 h-4 transition-colors duration-200', item.color)} />
                      <span>{item.label}</span>
                      {/* Animated underline */}
                      <span
                        className={cn(
                          'absolute bottom-0.5 left-3 right-3 h-px bg-gradient-primary transition-all duration-300',
                          isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                        )}
                        style={{ transformOrigin: 'left' }}
                      />
                    </Link>
                  );
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-3 text-foreground/60 hover:text-foreground hover:bg-white/5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </Button>
              </>
            ) : !isAuthPage ? (
              <>
                <Button variant="ghost" size="sm" asChild className="text-foreground/70 hover:text-foreground hover:bg-white/5">
                  <Link to="/login" className="flex items-center space-x-1.5 px-3">
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="bg-gradient-primary hover:opacity-90 border-0 shadow-neon-sm ml-1"
                >
                  <Link to="/signup" className="flex items-center space-x-1.5 px-4">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Get Started</span>
                  </Link>
                </Button>
              </>
            ) : null}
            <ThemeToggle className="ml-1" />
          </div>

          {/* Mobile right side */}
          <div className="md:hidden flex items-center space-x-1">
            <ThemeToggle />
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-foreground/60 hover:text-foreground hover:bg-white/5"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Dropdown ── */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden bg-black/50 backdrop-blur-2xl border-t border-white/10"
          style={{ opacity: 0 }}
        >
          <div className="px-3 pt-3 pb-4 space-y-1">
            {isAuthenticated ? (
              authNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center px-3 py-2.5 rounded-xl text-base font-medium transition-all duration-150',
                      location.pathname.startsWith(item.path)
                        ? 'bg-white/10 text-foreground border border-white/10'
                        : 'text-foreground/70 hover:bg-white/5 hover:text-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5 mr-3 text-violet-400" />
                    {item.label}
                  </Link>
                );
              })
            ) : !isAuthPage ? (
              <>
                <Link
                  to="/login"
                  className="flex items-center px-3 py-2.5 rounded-xl text-base font-medium text-foreground/70 hover:bg-white/5 hover:text-foreground transition-all"
                >
                  <LogIn className="w-5 h-5 mr-3 text-cyan-400" />
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center px-3 py-2.5 rounded-xl text-base font-medium bg-gradient-primary text-white hover:opacity-90 transition-all"
                >
                  <Zap className="w-5 h-5 mr-3" />
                  Get Started Free
                </Link>
              </>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
}
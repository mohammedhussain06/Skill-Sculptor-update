// In src/components/Navigation.tsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, User, LogIn, UserPlus, Menu, X, Brain, Trophy, Award, LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Navigation items for authenticated users
const authNavItems = [
  { path: '/flashcards', icon: Brain, label: 'Flashcards' },
  { path: '/quiz', icon: Trophy, label: 'Quiz' },
  { path: '/progress', icon: Award, label: 'Progress' },
  { path: '/dashboard', icon: User, label: 'Dashboard' },
] as const;

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden mr-2"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            
            <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center space-x-2 group">
              <div className="p-2 rounded-lg bg-gradient-primary group-hover:shadow-glow transition-all duration-300">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:block">SkillSculptor</span>
              <span className="text-xl font-bold gradient-text sm:hidden">SS</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {isAuthenticated ? (
              <>
                {authNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button 
                      key={item.path} 
                      variant="ghost" 
                      size="sm" 
                      asChild
                      className={cn(
                        'flex items-center space-x-1.5 px-3',
                        location.pathname.startsWith(item.path) && 'bg-accent/50'
                      )}
                    >
                      <Link to={item.path}>
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    </Button>
                  );
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-3"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </Button>
              </>
            ) : !isAuthPage ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login" className="flex items-center space-x-1.5 px-3">
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </Link>
                </Button>
                <Button size="sm" asChild className="bg-gradient-primary hover:opacity-90 border-0">
                  <Link to="/signup" className="flex items-center space-x-1.5 px-3">
                    <UserPlus className="w-4 h-4" />
                    <span>Get Started</span>
                  </Link>
                </Button>
              </>
            ) : null}
            <ThemeToggle className="ml-1" />
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <ThemeToggle />
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="ml-1"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && isAuthenticated && (
        <div className="md:hidden bg-card/95 backdrop-blur-sm border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {authNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-md text-base font-medium',
                    location.pathname.startsWith(item.path)
                      ? 'bg-accent/50 text-foreground'
                      : 'text-foreground/80 hover:bg-accent/50 hover:text-foreground'
                  )}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
// In src/hooks/useRequireAuth.ts
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function useRequireAuth() {
  const { isAuthenticated, setShowAuthModal, setRedirectAfterAuth } = useAuth();
  const navigate = useNavigate();

  const requireAuth = (action: () => void, redirectPath?: string) => {
    if (isAuthenticated) {
      action();
    } else {
      if (redirectPath) {
        setRedirectAfterAuth(redirectPath);
      }
      setShowAuthModal(true);
    }
  };

  const requireAuthNavigate = (path: string) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      setRedirectAfterAuth(path);
      setShowAuthModal(true);
    }
  };

  return { requireAuth, requireAuthNavigate, isAuthenticated };
}
// In AuthModal.tsx
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

export function AuthModal() {
  const { showAuthModal, setShowAuthModal } = useAuth();

  return (
    <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">Sign In Required</DialogTitle>
          <DialogDescription className="text-center text-base">
            Please sign in or create an account to access this feature.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 mt-6">
          <Button asChild className="w-full bg-gradient-primary hover:opacity-90">
            <Link to="/login" onClick={() => setShowAuthModal(false)}>
              Sign In
            </Link>
          </Button>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          <Button variant="outline" asChild className="w-full">
            <Link to="/signup" onClick={() => setShowAuthModal(false)}>
              Create an account
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
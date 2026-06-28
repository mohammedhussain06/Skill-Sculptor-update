// In src/pages/LoginPage.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import API from '../../api/axios';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, redirectAfterAuth, setRedirectAfterAuth } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      const { data } = await API.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      // Log the user in
      login(data.token, data.user);
      
      // Redirect to the originally requested page, or dashboard by default
      const target = redirectAfterAuth || '/dashboard';
      setRedirectAfterAuth(null);
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });

      // Elegant zoom-out transition before redirecting
      try {
        const anime = (await import('animejs')).default;
        anime({
          targets: '.login-container',
          scale: [1, 0.95],
          opacity: [1, 0],
          translateY: [0, -12],
          duration: 400,
          easing: 'easeInQuad',
          complete: () => {
            navigate(target);
          }
        });
      } catch {
        navigate(target);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to log in',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md px-4 sm:px-6 py-8 animate-fadeInUp login-container">
        {/* Header with icon and title */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 p-4 rounded-2xl bg-gradient-primary w-16 h-16 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Welcome Back
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Enter your email and password to sign in</p>
        </div>
          
        {/* Form Card */}
        <Card className="border-0 glass-card bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Sign In</CardTitle>
            <CardDescription className="text-muted-foreground text-xs sm:text-sm">Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80 text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground focus-ring"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground/80 text-sm font-medium">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:underline hover:text-primary-hover transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground focus-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 border-0 shadow-neon-sm font-semibold h-11 mt-2" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <p className="mt-6 text-center text-xs sm:text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="underline underline-offset-4 text-primary hover:text-primary-hover font-semibold transition-colors"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
// In src/pages/SignupPage.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import API from '../../api/axios';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, redirectAfterAuth, setRedirectAfterAuth } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const { data } = await API.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      // Log the user in after successful signup
      login(data.token, data.user);
      
      // Redirect to the originally requested page, or query-form by default
      const target = redirectAfterAuth || '/query-form';
      navigate(target);
      setRedirectAfterAuth(null);
      
      toast({
        title: 'Welcome to SkillSculptor!',
        description: 'Your account has been created successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-background via-background/95 to-background relative overflow-hidden">
      {/* Full-width gradient background with subtle glows */}
      <div className="absolute inset-0 z-0">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/15 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/15 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md px-4 sm:px-6 py-8">
        {/* Header with icon and title */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 p-4 rounded-full bg-gradient-primary w-20 h-20 flex items-center justify-center shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Create Your Account</h1>
          <p className="text-base text-white/80">Start your learning journey with SkillSculptor</p>
          </div>
          
        {/* Form Card */}
        <Card className="border-0 shadow-lg bg-card/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white">Sign Up</CardTitle>
            <CardDescription className="text-white/70">Enter your details to create your account</CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
              <Input
                id="username"
                name="username"
                placeholder="johndoe"
                required
                value={formData.username}
                onChange={handleInputChange}
                    className="pl-10 bg-muted/50 border-border/50 text-white placeholder:text-muted-foreground"
              />
                </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
              <Input
                id="email"
                name="email"
                type="email"
                    placeholder="Enter your email"
                required
                value={formData.email}
                onChange={handleInputChange}
                    className="pl-10 bg-muted/50 border-border/50 text-white placeholder:text-muted-foreground"
              />
                </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
              <Input
                id="password"
                name="password"
                    type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={formData.password}
                onChange={handleInputChange}
                    className="pl-10 pr-10 bg-muted/50 border-border/50 text-white placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-white z-10"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Enter your confirm password"
                required
                minLength={6}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                    className="pl-10 pr-10 bg-muted/50 border-border/50 text-white placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-white z-10"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
            </div>
            
              <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 border-0" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          
            <p className="mt-6 text-center text-sm text-white/70">
            Already have an account?{' '}
            <Link
              to="/login"
                className="underline underline-offset-4 hover:text-primary text-primary"
            >
              Login
            </Link>
          </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
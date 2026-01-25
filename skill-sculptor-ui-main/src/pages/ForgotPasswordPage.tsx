import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Sparkles, ArrowRight } from 'lucide-react';
import API from '../../api/axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await API.post('/auth/forgot-password', { email });
      if (data?.resetUrl) {
        setDevResetUrl(data.resetUrl);
      } else {
        setDevResetUrl(null);
      }
      toast({ title: 'Check your email', description: 'If the email exists, we sent a reset link.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-gradient-primary shadow-glow">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold">Forgot Password</h2>
            <p className="mt-2 text-muted-foreground">We’ll email you a link to reset it</p>
          </div>

          <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
              <CardDescription className="text-center">Enter your account email</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="pl-10 focus-ring" required />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 border-0" size="lg" disabled={isLoading}>
                  {isLoading ? 'Sending...' : (<><span>Send Reset Link</span><ArrowRight className="ml-2 h-4 w-4" /></>)}
                </Button>
              </form>

              {devResetUrl && (
                <div className="mt-6 p-4 rounded-lg border border-muted-darker bg-muted/20">
                  <p className="text-sm font-medium mb-2">Developer shortcut</p>
                  <p className="text-sm text-muted-foreground mb-2">Open the reset link directly (shown only in development).</p>
                  <a href={devResetUrl} className="text-sm text-primary hover:text-primary-hover break-all">{devResetUrl}</a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



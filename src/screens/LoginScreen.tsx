import { useState } from 'react';
import { Hotel, Eye, EyeOff, LogIn, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '../supabase'
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { UserRole } from '@/types';

interface LoginScreenProps {
  onLogin: (email: string, password: string, role?: UserRole) => boolean;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('fdo')
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    
  try {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    setError('Invalid email or password');
    return;
  }

  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .single();

  if (roleError || !roleData) {
    setError('No role assigned');
    return;
  }

  onLogin(email, password, roleData.role as UserRole);

} catch (err) {
  setError('Login failed. Please try again.');
} finally {
  setIsLoading(false);
}
  };

  const handleDemoMode = (role: 'staff' | 'hk_staff') => {
    const demoEmails: Record<'staff' | 'hk_staff', string> = {
      'staff': 'staff@hsh.com',
      'hk_staff': 'hk@hsh.com'
    };
    setEmail(demoEmails[role]);
    setPassword(role);
    setSelectedRole(role);
    setIsLoading(true);
    
    setTimeout(() => {
      try {
        onLogin(demoEmails[role], role, role);
      } catch (err) {
        setError('Demo mode failed. Please try again.');
        setIsLoading(false);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Hotel className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            HSH Cash Log
          </CardTitle>
          <CardDescription className="text-gray-600">
            Home Stay Hotel
          </CardDescription>
          <p className="text-sm text-gray-500 mt-2">
            Digital Cash Logbook + Room Status
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="text-sm">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Login As</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('staff')}
                  className={`p-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                    selectedRole === 'staff'
                      ? 'bg-blue-500 border-blue-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  FDO Staff
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('hk_staff')}
                  className={`p-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                    selectedRole === 'hk_staff'
                      ? 'bg-orange-500 border-orange-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
                  }`}
                >
                  HK Staff
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 text-lg pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 p-2"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-bold"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Logging in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Login
                </span>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Quick Demo</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleDemoMode('staff')}
              variant="outline"
              className="h-12 text-sm font-semibold border-2 border-blue-500 text-blue-700 hover:bg-blue-50"
              disabled={isLoading}
            >
              <Play className="w-4 h-4 mr-1" />
              FDO
            </Button>
            <Button
              onClick={() => handleDemoMode('hk_staff')}
              variant="outline"
              className="h-12 text-sm font-semibold border-2 border-orange-500 text-orange-700 hover:bg-orange-50"
              disabled={isLoading}
            >
              <Play className="w-4 h-4 mr-1" />
              HK
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 space-y-1 pt-2">
            <p className="font-medium">Demo credentials:</p>
            <p><strong>staff@hsh.com</strong> / <strong>staff</strong> (FDO)</p>
            <p><strong>hk@hsh.com</strong> / <strong>hk_staff</strong> (HK Staff)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, GraduationCap, Users, BookOpen, Mail, Lock, User } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'teacher', 'student'], {
    required_error: 'Please select a role',
  }),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return defaultMessage;
}

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: undefined,
    },
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'An error occurred during sign in'));
    } finally {
      setLoading(false);
    }
  };

  const onSignupSubmit = async (data: SignupFormData) => {
    setLoading(true);
    try {
      // 1. Sign up the user
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: data.role,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // 2. Insert into profiles
      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: authData.user.id,
            email: authData.user.email,
            full_name: data.fullName,
            role: data.role,
          },
        ]);

        if (profileError) {
          console.error("Profile creation error:", profileError);
          // Ignore error, might already exist if trigger is setup
        }
        
        toast.success(`Account created! You are logged in as a ${data.role}.`);
        navigate('/dashboard');
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'An error occurred during sign up'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="icon-accent mx-auto h-12 w-12">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            KIRI School Management
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account or create a new one
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Access your school management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email address</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      {...loginForm.register('email')}
                      disabled={loading}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      {...loginForm.register('password')}
                      disabled={loading}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
                    ) : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      {...signupForm.register('fullName')}
                      disabled={loading}
                    />
                    {signupForm.formState.errors.fullName && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email address</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      {...signupForm.register('email')}
                      disabled={loading}
                    />
                    {signupForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      {...signupForm.register('password')}
                      disabled={loading}
                    />
                    {signupForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select onValueChange={(value) => signupForm.setValue('role', value as 'admin' | 'teacher' | 'student')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center">
                            <Users className="mr-2 h-4 w-4" />
                            Administrator
                          </div>
                        </SelectItem>
                        <SelectItem value="teacher">
                          <div className="flex items-center">
                            <BookOpen className="mr-2 h-4 w-4" />
                            Teacher
                          </div>
                        </SelectItem>
                        <SelectItem value="student">
                          <div className="flex items-center">
                            <GraduationCap className="mr-2 h-4 w-4" />
                            Student
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {signupForm.formState.errors.role && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.role.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
                    ) : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500">
          <p>This is a demonstration system. You can choose your role during sign up to test different features.</p>
        </div>
      </div>
    </div>
  );
}

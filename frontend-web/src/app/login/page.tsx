'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Alert, AlertDescription } from '@/components/ui/Alert';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, loginError, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/memos');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      await login(data);
    } catch (error) {
      // Error is handled by auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Welcome back
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your Memo Maker account
          </CardDescription>
        </CardHeader>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {loginError && (
                <Alert variant="destructive">
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}

              <FormField
                name="email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />

              <FormField
                name="password"
                label="Password"
                type="password"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Sign in
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="text-primary font-medium hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
}

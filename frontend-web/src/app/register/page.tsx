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

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register, registerError, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const methods = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/memos');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      await register({
        name: data.name,
        email: data.email,
        password: data.password,
      });
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
            Create an account
          </CardTitle>
          <CardDescription className="text-center">
            Get started with Memo Maker for free
          </CardDescription>
        </CardHeader>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {registerError && (
                <Alert variant="destructive">
                  <AlertDescription>{registerError}</AlertDescription>
                </Alert>
              )}

              <FormField
                name="name"
                label="Full Name"
                type="text"
                placeholder="John Doe"
                required
                autoComplete="name"
              />

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
                placeholder="Create a strong password"
                required
                autoComplete="new-password"
              />

              <FormField
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
              />

              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters and contain uppercase,
                lowercase, and numbers.
              </p>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Create account
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
}

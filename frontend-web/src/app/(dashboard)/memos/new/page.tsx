'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';

const createMemoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  date: z.string().optional(),
  participants: z.string().optional(),
});

type CreateMemoFormData = z.infer<typeof createMemoSchema>;

export default function NewMemoPage() {
  const router = useRouter();
  const [audioFile, setAudioFile] = React.useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [currentStep, setCurrentStep] = React.useState<'form' | 'uploading' | 'complete'>('form');
  const [error, setError] = React.useState<string | null>(null);

  const methods = useForm<CreateMemoFormData>({
    resolver: zodResolver(createMemoSchema),
    defaultValues: {
      title: '',
      date: new Date().toISOString().split('T')[0],
      participants: '',
    },
  });

  const createMemoMutation = useMutation({
    mutationFn: async (data: CreateMemoFormData) => {
      setError(null);
      const participants = data.participants
        ? data.participants.split(',').map((p) => p.trim()).filter(Boolean)
        : [];

      const response = await apiClient.createMemo({
        title: data.title,
        date: data.date ? new Date(data.date).toISOString() : undefined,
        participants,
      });

      return response.memo;
    },
  });

  const uploadAudioMutation = useMutation({
    mutationFn: async ({ memoId, file }: { memoId: string; file: File }) => {
      setCurrentStep('uploading');
      setUploadProgress(0);

      // Simulate upload progress (in a real app, you'd use XHR with progress events)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      try {
        const response = await apiClient.uploadAudio(memoId, file);
        clearInterval(progressInterval);
        setUploadProgress(100);
        return response;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      setCurrentStep('complete');
      setTimeout(() => {
        router.push(`/memos/${variables.memoId}`);
      }, 1500);
    },
    onError: (error: any) => {
      setCurrentStep('form');
      setError(error.message || 'Failed to upload audio. Please try again.');
    },
  });

  const onSubmit = async (data: CreateMemoFormData) => {
    if (!audioFile) {
      setError('Please select an audio file to upload');
      return;
    }

    try {
      const memo = await createMemoMutation.mutateAsync(data);
      await uploadAudioMutation.mutateAsync({ memoId: memo.id, file: audioFile });
    } catch (error: any) {
      setError(error.message || 'Failed to create memo. Please try again.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mp4'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|mp4)$/i)) {
        setError('Please select a valid audio file (MP3, WAV, M4A)');
        return;
      }

      // Validate file size (100MB max)
      if (file.size > 100 * 1024 * 1024) {
        setError('File size must be less than 100MB');
        return;
      }

      setAudioFile(file);
      setError(null);
    }
  };

  if (currentStep === 'uploading' || currentStep === 'complete') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6 text-center">
              {currentStep === 'uploading' && (
                <>
                  <Spinner size="lg" className="mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Uploading audio...</h3>
                    <p className="text-sm text-muted-foreground">
                      Please wait while we upload and process your audio file
                    </p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
                </>
              )}

              {currentStep === 'complete' && (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-3xl">✓</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Upload complete!</h3>
                    <p className="text-sm text-muted-foreground">
                      Your memo is being processed. Redirecting...
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create New Memo</h1>
        <p className="text-muted-foreground mt-1">
          Upload a meeting recording to generate a structured memo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Memo Details</CardTitle>
          <CardDescription>
            Provide basic information about your meeting
          </CardDescription>
        </CardHeader>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                name="title"
                label="Title"
                placeholder="e.g., Weekly Team Sync - Jan 15"
                required
              />

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  {...methods.register('date')}
                />
              </div>

              <FormField
                name="participants"
                label="Participants"
                placeholder="John Doe, Jane Smith, Bob Johnson"
                description="Comma-separated list of meeting participants"
              />

              <div className="space-y-2">
                <Label htmlFor="audio" required>
                  Audio File
                </Label>
                <Input
                  id="audio"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                />
                {audioFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Supported formats: MP3, WAV, M4A (Max 100MB)
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/memos')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={createMemoMutation.isPending}
                disabled={!audioFile || createMemoMutation.isPending}
              >
                Create Memo
              </Button>
            </CardFooter>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
}

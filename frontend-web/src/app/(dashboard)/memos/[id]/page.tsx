'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { formatDate, formatDuration } from '@/lib/utils';

function getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'info' | 'destructive' {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'FAILED':
      return 'destructive';
    case 'UPLOADING':
      return 'info';
    case 'TRANSCRIBING':
    case 'GENERATING':
      return 'warning';
    default:
      return 'default';
  }
}

function getPriorityColor(priority?: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high':
      return 'text-red-600';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
      return 'text-blue-600';
    default:
      return 'text-muted-foreground';
  }
}

export default function MemoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memoId = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['memo', memoId],
    queryFn: async () => {
      const response = await apiClient.getMemo(memoId);
      return response.memo;
    },
    refetchInterval: (data) => {
      // Auto-refresh if memo is still processing
      if (data && ['UPLOADING', 'TRANSCRIBING', 'GENERATING'].includes(data.status)) {
        return 5000; // Poll every 5 seconds
      }
      return false;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading memo</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load memo. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  const memo = data;
  const isProcessing = ['UPLOADING', 'TRANSCRIBING', 'GENERATING'].includes(memo.status);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/memos')}
            >
              ← Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{memo.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{formatDate(memo.date)}</span>
            {memo.duration && <span>• {formatDuration(memo.duration)}</span>}
            <Badge variant={getStatusVariant(memo.status)}>{memo.status}</Badge>
          </div>
        </div>
      </div>

      {memo.participants.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Participants</h3>
          <div className="flex flex-wrap gap-2">
            {memo.participants.map((participant, idx) => (
              <Badge key={idx} variant="outline">
                {participant}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {isProcessing && (
        <Alert variant="info">
          <AlertDescription className="flex items-center gap-2">
            <Spinner size="sm" />
            <span>
              {memo.status === 'UPLOADING' && 'Uploading audio...'}
              {memo.status === 'TRANSCRIBING' && 'Transcribing audio...'}
              {memo.status === 'GENERATING' && 'Generating memo content...'}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {memo.status === 'FAILED' && memo.errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>Processing Failed</AlertTitle>
          <AlertDescription>{memo.errorMessage}</AlertDescription>
        </Alert>
      )}

      {memo.memoContent && memo.status === 'COMPLETED' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{memo.memoContent.summary}</p>
            </CardContent>
          </Card>

          {memo.memoContent.keyPoints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Key Points</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {memo.memoContent.keyPoints.map((point, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {memo.memoContent.actionItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Action Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {memo.memoContent.actionItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
                      <input
                        type="checkbox"
                        className="mt-1"
                        aria-label="Mark as complete"
                      />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{item.task}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {item.owner && <span>Owner: {item.owner}</span>}
                          {item.dueDate && <span>Due: {formatDate(item.dueDate)}</span>}
                          {item.priority && (
                            <span className={getPriorityColor(item.priority)}>
                              {item.priority.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {memo.memoContent.decisions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Decisions Made</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {memo.memoContent.decisions.map((decision, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>{decision}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {memo.memoContent.nextSteps && memo.memoContent.nextSteps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {memo.memoContent.nextSteps.map((step, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-1">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {memo.transcript && (
        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {memo.transcript.segments.length > 0 ? (
                memo.transcript.segments.map((segment) => (
                  <div key={segment.id} className="flex gap-3">
                    <span className="text-xs text-muted-foreground font-mono min-w-[60px]">
                      {Math.floor(segment.start / 60)}:{String(Math.floor(segment.start % 60)).padStart(2, '0')}
                    </span>
                    <p className="text-sm flex-1">{segment.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {memo.transcript.text}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

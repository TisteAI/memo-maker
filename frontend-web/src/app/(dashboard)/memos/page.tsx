'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { MemoCard } from '@/components/memos/MemoCard';
import { Spinner } from '@/components/ui/Spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import type { MemoStatus } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const statusFilters: Array<{ label: string; value: MemoStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Processing', value: 'GENERATING' },
  { label: 'Transcribing', value: 'TRANSCRIBING' },
  { label: 'Uploading', value: 'UPLOADING' },
  { label: 'Failed', value: 'FAILED' },
];

export default function MemosPage() {
  const [statusFilter, setStatusFilter] = React.useState<MemoStatus | 'all'>('all');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['memos', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      return apiClient.listMemos(params);
    },
    refetchInterval: (data) => {
      // Auto-refresh if there are any memos in processing state
      const hasProcessing = data?.memos.some(
        (memo) => ['UPLOADING', 'TRANSCRIBING', 'GENERATING'].includes(memo.status)
      );
      return hasProcessing ? 5000 : false; // Poll every 5 seconds if processing
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading memos</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load memos. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  const memos = data?.memos || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Memos</h1>
          <p className="text-muted-foreground mt-1">
            {memos.length === 0
              ? 'Create your first memo to get started'
              : `${memos.length} memo${memos.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Filter:</span>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                statusFilter === filter.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {memos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg">
          <div className="text-center space-y-3">
            <h3 className="text-lg font-semibold">No memos found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {statusFilter === 'all'
                ? 'Get started by creating your first memo from a meeting recording.'
                : `No memos with status: ${statusFilter}`}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {memos.map((memo) => (
            <MemoCard key={memo.id} memo={memo} />
          ))}
        </div>
      )}
    </div>
  );
}

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Memo } from '@/lib/api/types';
import { formatDate, formatDuration, getStatusColor, getStatusText } from '@/lib/utils';

export interface MemoCardProps {
  memo: Memo;
}

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

export function MemoCard({ memo }: MemoCardProps) {
  return (
    <Link href={`/memos/${memo.id}`}>
      <Card className="transition-shadow hover:shadow-md cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg">{memo.title}</CardTitle>
              <CardDescription>
                {formatDate(memo.date)}
                {memo.duration && ` • ${formatDuration(memo.duration)}`}
              </CardDescription>
            </div>
            <Badge variant={getStatusVariant(memo.status)}>
              {getStatusText(memo.status)}
            </Badge>
          </div>
        </CardHeader>

        {(memo.participants.length > 0 || memo.memoContent?.keyPoints) && (
          <CardContent>
            {memo.participants.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Participants</p>
                <div className="flex flex-wrap gap-1">
                  {memo.participants.map((participant, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {participant}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {memo.memoContent?.summary && memo.status === 'COMPLETED' && (
              <div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {memo.memoContent.summary}
                </p>
              </div>
            )}

            {memo.errorMessage && memo.status === 'FAILED' && (
              <div>
                <p className="text-sm text-destructive">
                  {memo.errorMessage}
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </Link>
  );
}

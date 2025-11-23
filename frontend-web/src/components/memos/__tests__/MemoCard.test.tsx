import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoCard } from '../MemoCard';
import { mockMemo } from '@/tests/helpers';

describe('MemoCard', () => {
  it('renders memo title and date', () => {
    render(<MemoCard memo={mockMemo} />);

    expect(screen.getByText('Test Meeting')).toBeInTheDocument();
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  it('shows completed status badge', () => {
    render(<MemoCard memo={mockMemo} />);

    // getStatusText converts 'COMPLETED' to 'Completed'
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('displays participants', () => {
    render(<MemoCard memo={mockMemo} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows summary for completed memos', () => {
    render(<MemoCard memo={mockMemo} />);

    expect(screen.getByText(/This is a test meeting summary/)).toBeInTheDocument();
  });

  it('shows processing status for transcribing memos', () => {
    const processingMemo = {
      ...mockMemo,
      status: 'TRANSCRIBING' as const,
      memoContent: null,
    };

    render(<MemoCard memo={processingMemo} />);

    // getStatusText converts 'TRANSCRIBING' to 'Transcribing'
    expect(screen.getByText('Transcribing')).toBeInTheDocument();
    expect(screen.queryByText(/summary/)).not.toBeInTheDocument();
  });

  it('shows error message for failed memos', () => {
    const failedMemo = {
      ...mockMemo,
      status: 'FAILED' as const,
      errorMessage: 'Transcription failed',
      memoContent: null,
    };

    render(<MemoCard memo={failedMemo} />);

    // getStatusText converts 'FAILED' to 'Failed'
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Transcription failed')).toBeInTheDocument();
  });

  it('renders as link to memo detail page', () => {
    render(<MemoCard memo={mockMemo} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/memos/memo-1');
  });

  it('shows duration when available', () => {
    render(<MemoCard memo={mockMemo} />);

    // formatDuration converts 1800 seconds to "30m 0s"
    expect(screen.getByText(/30m 0s/)).toBeInTheDocument();
  });

  it('handles memos without participants', () => {
    const memoWithoutParticipants = {
      ...mockMemo,
      participants: [],
    };

    render(<MemoCard memo={memoWithoutParticipants} />);

    expect(screen.queryByText('Participants')).not.toBeInTheDocument();
  });
});

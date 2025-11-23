import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'UPLOADING':
      return 'bg-blue-500';
    case 'TRANSCRIBING':
      return 'bg-yellow-500';
    case 'GENERATING':
      return 'bg-purple-500';
    case 'COMPLETED':
      return 'bg-green-500';
    case 'FAILED':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'UPLOADING':
      return 'Uploading';
    case 'TRANSCRIBING':
      return 'Transcribing';
    case 'GENERATING':
      return 'Generating Memo';
    case 'COMPLETED':
      return 'Completed';
    case 'FAILED':
      return 'Failed';
    default:
      return status;
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

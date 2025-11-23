import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../Card';

describe('Card', () => {
  it('renders card with all sections', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card content goes here</CardContent>
        <CardFooter>Card footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card content goes here')).toBeInTheDocument();
    expect(screen.getByText('Card footer')).toBeInTheDocument();
  });

  it('applies base card styling', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('rounded-lg', 'border', 'bg-card');
  });

  it('applies custom className to card', () => {
    render(<Card className="custom-card">Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('custom-card');
  });

  it('renders CardTitle as h3', () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByText('Title');
    expect(title.tagName).toBe('H3');
    expect(title).toHaveClass('text-2xl', 'font-semibold');
  });

  it('renders CardDescription with muted text', () => {
    render(<CardDescription>Description</CardDescription>);
    const description = screen.getByText('Description');
    expect(description).toHaveClass('text-muted-foreground');
  });

  it('can render card without all sections', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Simple Card</CardTitle>
        </CardHeader>
      </Card>
    );

    expect(screen.getByText('Simple Card')).toBeInTheDocument();
  });
});

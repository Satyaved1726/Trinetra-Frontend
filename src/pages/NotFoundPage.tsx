import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[65vh] items-center justify-center">
      <Card className="max-w-xl text-center">
        <CardContent className="space-y-6 p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">404</p>
          <div className="space-y-3">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-950">Page not found</h1>
            <p className="text-base text-slate-600">The page you requested does not exist in the React application.</p>
          </div>
          <Button asChild size="lg">
            <Link to="/">Return home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
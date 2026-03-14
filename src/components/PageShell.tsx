import type { PropsWithChildren, ReactNode } from 'react';

import { cn } from '@/utils/cn';

interface PageShellProps extends PropsWithChildren {
  eyebrow?: string;
  title: string;
  description: string;
  aside?: ReactNode;
  className?: string;
}

export function PageShell({ eyebrow, title, description, aside, className, children }: PageShellProps) {
  return (
    <section className={cn('grid gap-8 xl:grid-cols-[1fr_340px]', className)}>
      <div className="space-y-8">
        <div className="space-y-4">
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{eyebrow}</p> : null}
          <div className="space-y-3">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">{title}</h1>
            <p className="max-w-2xl text-base text-slate-600 sm:text-lg">{description}</p>
          </div>
        </div>
        {children}
      </div>
      {aside ? <div className="space-y-6">{aside}</div> : null}
    </section>
  );
}
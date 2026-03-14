import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  tone: 'slate' | 'amber' | 'emerald' | 'rose';
}

const toneMap = {
  slate: 'from-slate-100 via-white to-slate-50 text-slate-700',
  amber: 'from-amber-100 via-white to-amber-50 text-amber-700',
  emerald: 'from-emerald-100 via-white to-emerald-50 text-emerald-700',
  rose: 'from-rose-100 via-white to-rose-50 text-rose-700'
} as const;

export function StatCard({ title, value, description, icon: Icon, tone }: StatCardProps) {
  return (
    <Card className={`overflow-hidden bg-gradient-to-br ${toneMap[tone]}`}>
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
          <div className="mt-3 text-4xl font-bold tracking-tight">{value}</div>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <div className="rounded-full bg-white/80 p-3 shadow-sm">
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}
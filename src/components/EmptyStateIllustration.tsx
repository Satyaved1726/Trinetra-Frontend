import { Inbox } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateIllustrationProps {
  title: string;
  description: string;
}

export function EmptyStateIllustration({ title, description }: EmptyStateIllustrationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/50 px-6 py-10 text-center backdrop-blur-sm"
    >
      <div className="relative mb-4">
        <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-xl" />
        <div className="relative rounded-full border border-border/70 bg-background/80 p-4">
          <Inbox className="h-7 w-7 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}

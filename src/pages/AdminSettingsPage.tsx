import { motion } from 'framer-motion';
import { BellRing, RefreshCcw, Save, Settings2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const SETTINGS_KEY = 'trinetra_admin_settings';

interface AdminSettings {
  emailNotifications: boolean;
  browserAlerts: boolean;
  autoRefresh: boolean;
  autoRefreshMinutes: number;
  requireEvidence: boolean;
  escalationNotes: string;
  notificationEmail: string;
}

const defaultSettings: AdminSettings = {
  emailNotifications: true,
  browserAlerts: true,
  autoRefresh: false,
  autoRefreshMinutes: 5,
  requireEvidence: false,
  escalationNotes: 'Escalate harassment and discrimination complaints within 24 hours.',
  notificationEmail: 'ops@trinetra.local'
};

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>(() => {
    const stored = window.localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      return defaultSettings;
    }

    try {
      return { ...defaultSettings, ...(JSON.parse(stored) as Partial<AdminSettings>) };
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Settings</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">Operations Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Store admin-facing preferences locally for notifications, refresh cadence, and complaint handling defaults.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Notification and Review Defaults</h2>
              <p className="text-xs text-muted-foreground">These preferences are persisted in local storage.</p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
              <div>
                <p className="font-medium text-foreground">Email notifications</p>
                <p className="text-sm text-muted-foreground">Send complaint activity summaries to the operations inbox.</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings((current) => ({ ...current, emailNotifications: checked }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
              <div>
                <p className="font-medium text-foreground">Browser alerts</p>
                <p className="text-sm text-muted-foreground">Display toast-style alerts for new complaint activity in the admin UI.</p>
              </div>
              <Switch
                checked={settings.browserAlerts}
                onCheckedChange={(checked) => setSettings((current) => ({ ...current, browserAlerts: checked }))}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notification inbox</label>
                <Input
                  type="email"
                  value={settings.notificationEmail}
                  onChange={(event) => setSettings((current) => ({ ...current, notificationEmail: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Auto-refresh</label>
                <div className="flex h-12 items-center gap-3 rounded-2xl border border-border bg-background px-4">
                  <Switch
                    checked={settings.autoRefresh}
                    onCheckedChange={(checked) => setSettings((current) => ({ ...current, autoRefresh: checked }))}
                  />
                  <span className="text-sm text-foreground">Enabled</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Refresh minutes</label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={String(settings.autoRefreshMinutes)}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      autoRefreshMinutes: Math.max(1, Number(event.target.value) || 1)
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">Require evidence for serious cases</p>
                  <p className="text-sm text-muted-foreground">Frontend recommendation for reporters before submission.</p>
                </div>
                <Switch
                  checked={settings.requireEvidence}
                  onCheckedChange={(checked) => setSettings((current) => ({ ...current, requireEvidence: checked }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Escalation notes</label>
              <Textarea
                value={settings.escalationNotes}
                onChange={(event) => setSettings((current) => ({ ...current, escalationNotes: event.target.value }))}
              />
            </div>

            <Button
              onClick={() => toast.success('Admin settings saved locally.')}
              className="w-full sm:w-auto"
            >
              <Save className="mr-2 h-4 w-4" />
              Save settings
            </Button>
          </div>
        </div>

        <motion.aside initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Notification posture</h2>
                <p className="text-xs text-muted-foreground">Email and browser alert defaults for the admin UI.</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <RefreshCcw className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Refresh cadence</h2>
                <p className="text-xs text-muted-foreground">Current interval: every {settings.autoRefreshMinutes} minute(s).</p>
              </div>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
import { type Variants, motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle,
  Eye,
  FileUp,
  Lock,
  Shield,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Shield,
    title: 'Anonymous Reporting',
    description: 'Submit complaints without revealing your identity. Your privacy is fully protected throughout the process.'
  },
  {
    icon: Eye,
    title: 'Real-time Tracking',
    description: 'Monitor your complaint with a unique tracking ID. Stay informed at every stage from submission to resolution.'
  },
  {
    icon: Lock,
    title: 'Secure & Encrypted',
    description: 'Enterprise-grade JWT authentication protects the admin dashboard. All data is encrypted in transit.'
  },
  {
    icon: Zap,
    title: 'Fast Resolution',
    description: 'Streamlined admin workflows ensure complaints are triaged, reviewed, and resolved without delays.'
  },
  {
    icon: FileUp,
    title: 'Evidence Upload',
    description: 'Attach screenshots, documents, or PDFs directly to your complaint for a stronger case.'
  },
  {
    icon: CheckCircle,
    title: 'Transparent Process',
    description: 'Status updates keep you informed from submission through review, resolution, or closure.'
  }
];

const steps = [
  {
    step: '01',
    title: 'Submit Your Complaint',
    description: 'Fill in the secure form with details of your concern. Optionally attach evidence files.'
  },
  {
    step: '02',
    title: 'Receive Tracking ID',
    description: 'A unique tracking ID is issued immediately after a successful submission.'
  },
  {
    step: '03',
    title: 'Admin Review',
    description: 'The admin team reviews your complaint and updates the status in real time.'
  },
  {
    step: '04',
    title: 'Resolution',
    description: 'Track progress and receive the final resolution or follow-up notification.'
  }
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

export function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex items-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-600/25 blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-[80px]" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-4xl"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm font-medium mb-8"
            >
              <Shield className="h-4 w-4" />
              Secure Workplace Reporting Platform
            </motion.span>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
              Report. Track.{' '}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                Resolve.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed">
              TRINETRA provides a secure, transparent platform for workplace complaint management. Submit confidentially, track in real-time, and ensure every voice is heard.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="text-base px-8 h-12 shadow-lg shadow-blue-600/25">
                <Link to="/submit-complaint">
                  Submit Complaint
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-base px-8 h-12 border-white/20 text-white bg-white/5 hover:bg-white/10 hover:border-white/30"
              >
                <Link to="/track-complaint">Track Complaint</Link>
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap gap-6 text-slate-400 text-sm">
              {['100% Secure', 'Anonymous option', 'Real-time updates', 'Evidence upload'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600"
        >
          <div className="h-10 w-6 rounded-full border-2 border-slate-600 flex items-start justify-center p-1">
            <div className="w-1.5 h-2.5 bg-slate-500 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ── Stats strip ── */}
      <section className="py-14 bg-background border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { value: '24/7', label: 'Available' },
              { value: '100%', label: 'Secure' },
              { value: 'JWT', label: 'Protected' },
              { value: 'Fast', label: 'Resolution' }
            ].map((stat) => (
              <motion.div key={stat.label} variants={itemVariants}>
                <p className="text-4xl font-display font-extrabold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">Features</p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-foreground mb-4">
              Everything you need to manage workplace complaints
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built with security, transparency, and operational efficiency in mind.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-card-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">Process</p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-foreground mb-4">How it works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A simple, transparent process from submission to resolution.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {steps.map((step) => (
              <motion.div key={step.step} variants={itemVariants} className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 shrink-0">
                  <span className="font-display font-bold text-primary text-xl">{step.step}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Security assurance ── */}
      <section className="py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">Security</p>
              <h2 className="font-display text-4xl font-bold tracking-tight text-foreground mb-6">
                Your data is safe with us
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                TRINETRA uses industry-standard JWT authentication and secure Spring Boot API endpoints. Admin access is strictly controlled and all submissions are encrypted in transit.
              </p>
              <ul className="space-y-3">
                {[
                  'JWT-based admin authentication',
                  'Anonymous submission option',
                  'Encrypted evidence storage',
                  'Protected admin dashboard',
                  'Automatic session expiry'
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 p-8 text-white"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold">Security Status</p>
                  <p className="text-xs text-slate-400">All systems operational</p>
                </div>
              </div>
              <div className="space-y-4">
                {['Authentication', 'Data Encryption', 'API Security', 'Access Control'].map((item) => (
                  <div key={item} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-300">{item}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-28 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full" />
                      </div>
                      <span className="text-xs text-emerald-400 shrink-0">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-gradient-to-br from-primary to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold tracking-tight text-white mb-6">
              Ready to file a complaint?
            </h2>
            <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
              Join a secure, transparent reporting system that ensures every voice is heard and acted upon.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="text-base px-8 h-12 font-semibold">
                <Link to="/submit-complaint">
                  Submit Complaint
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-base px-8 h-12 border-white/30 text-white bg-white/5 hover:bg-white/15 hover:border-white/40"
              >
                <Link to="/track-complaint">Track Complaint</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 bg-background border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-display font-bold tracking-[0.2em] text-foreground text-sm">TRINETRA</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Secure workplace reporting platform · Built with integrity
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

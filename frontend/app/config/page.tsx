'use client';

import { ConfigForm } from '@/components/ConfigForm';

export default function ConfigPage() {
  return (
    <>
      <div className="circuit-background" />
      <div className="min-h-screen flex flex-col items-center px-4 py-8 relative z-10">
        <div className="max-w-4xl w-full text-center mx-auto flex flex-col items-center">
          {/* Header */}
          <div className="text-center mb-8">
            <h1
              className="text-4xl font-bold uppercase tracking-wider mb-2 font-sans"
              style={{
                background: 'linear-gradient(45deg, var(--primary), var(--secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Supabase Configuration
            </h1>
            <p
              className="font-mono text-sm"
              style={{ color: 'var(--muted-foreground)', marginBottom: '20px' }}
            >
              Configure your production-ready Supabase instance
            </p>
          </div>

          {/* Config Form */}
          <ConfigForm />

          {/* Navigation (moved below stack) */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="text-sm font-mono hover:opacity-70 transition-opacity"
              style={{ color: 'var(--primary)' }}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

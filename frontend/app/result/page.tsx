'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Server, AlertTriangle } from 'lucide-react';
import { FileDisplay } from '@/components/FileDisplay';
import { DeploymentModal } from '@/components/DeploymentModal';
import type { GenerateResponse } from '@/lib/types';

export default function ResultPage() {
  const [configData, setConfigData] = useState<GenerateResponse | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedConfig = sessionStorage.getItem('generated_config');
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);
        setConfigData(parsed);
      } catch (error) {
        console.error('Failed to parse stored config:', error);
        router.push('/');
      }
    } else {
      // No stored config, redirect to home
      router.push('/');
    }
  }, [router]);

  if (!configData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground font-mono">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="circuit-background" />
      <div className="min-h-screen px-4 py-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold uppercase tracking-wider mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Configuration Generated Successfully!
            </h1>
            <p className="text-muted-foreground font-mono mb-6">
              Your Supabase configuration files are ready for deployment
            </p>
          </motion.div>

          {/* Security Warning */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/10 border border-primary text-primary p-4 rounded-lg mb-8 flex items-start gap-3"
          >
            <AlertTriangle size={24} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold font-mono text-sm mb-1">⚠️ Security Notice:</p>
              <p className="font-mono text-sm">
                Save these files immediately and store them securely. The generated secrets are 
                cryptographically secure and cannot be recovered if lost.
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <button
              onClick={() => router.push('/')}
              className="holographic-button secondary flex items-center gap-2 justify-center"
            >
              <ArrowLeft size={18} />
              Generate Another
            </button>
            <motion.button
              onClick={() => setShowDeployModal(true)}
              className="holographic-button flex items-center gap-2 justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Server size={18} />
              Deploy to VPS
            </motion.button>
          </motion.div>

          {/* Configuration Files */}
          <div className="space-y-8">
            <FileDisplay
              filename=".env"
              content={configData.envContent}
              description="Environment variables for your Supabase instance"
            />
            
            <FileDisplay
              filename="docker-compose.yml"
              content={configData.composeContent}
              description="Docker Compose configuration with all Supabase services"
            />

            <FileDisplay
              filename="docker-compose.override.yml"
              content={configData.overrideContent}
              description="Optional overrides merged automatically by Docker Compose (ports, volumes, dev-only tweaks)"
            />

            {configData.pgvectorSqlContent && (
              <FileDisplay
                filename="01-pgvector.sql"
                content={configData.pgvectorSqlContent}
                description="Initialization SQL to enable the pgvector extension and an example table"
              />
            )}

            {configData.vectorConfigContent && (
              <FileDisplay
                filename="volumes/logs/vector.yml"
                content={configData.vectorConfigContent}
                description="Sample Vector config to collect Docker logs and forward to sinks (console, Logflare)"
              />
            )}
          </div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 form-container"
          >
            <h3 className="text-primary text-xl font-bold uppercase tracking-wide mb-4">
              📋 Next Steps
            </h3>
            <div className="space-y-3 font-mono text-sm text-muted-foreground">
              <p>1. <span className="text-foreground">Download or copy</span> both configuration files</p>
              <p>2. <span className="text-foreground">Create a project directory</span> on your server</p>
              <p>3. <span className="text-foreground">Upload the files</span> to your server</p>
              <p>4. <span className="text-foreground">Install Docker & Docker Compose</span> if not already installed</p>
              <p>5. <span className="text-foreground">Run:</span> <code className="px-2 py-1 rounded text-primary" style={{backgroundColor: 'var(--input)'}}>docker-compose up -d</code></p>
              <p>6. <span className="text-foreground">Access Supabase Studio</span> at <code className="px-2 py-1 rounded text-primary" style={{backgroundColor: 'var(--input)'}}>http://your-server:3000</code></p>
            </div>
          </motion.div>

          {/* Configuration Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 grid md:grid-cols-2 gap-6"
          >
            <div className="form-container">
              <h3 className="text-primary text-lg font-bold uppercase mb-3">🔧 Configuration Details</h3>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project:</span>
                  <span className="text-foreground">{configData.config.project_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Domain:</span>
                  <span className="text-foreground">{configData.config.domain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-foreground">{configData.config.email}</span>
                </div>
              </div>
            </div>

            <div className="form-container">
              <h3 className="text-primary text-lg font-bold uppercase mb-3">🌐 Access Information</h3>
              <div className="space-y-2 font-mono text-sm">
                <div>
                  <span className="text-muted-foreground">Studio Dashboard:</span>
                  <br />
                  <span className="text-primary">http://your-server:3000</span>
                </div>
                <div>
                  <span className="text-muted-foreground">API Endpoint:</span>
                  <br />
                  <span className="text-primary">http://your-server:8000</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Database:</span>
                  <br />
                  <span className="text-primary">your-server:5432</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Useful Commands */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mt-8 form-container"
          >
            <h3 className="text-primary text-xl font-bold uppercase tracking-wide mb-4">
              💻 Useful Commands
            </h3>
            <div className="grid md:grid-cols-2 gap-4 font-mono text-sm">
              <div>
                <p className="text-muted-foreground mb-2">View logs:</p>
                <code className="px-3 py-2 rounded block text-primary" style={{backgroundColor: 'var(--input)'}}>
                  docker-compose logs -f [service_name]
                </code>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">Restart services:</p>
                <code className="px-3 py-2 rounded block text-primary" style={{backgroundColor: 'var(--input)'}}>
                  docker-compose restart
                </code>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">Stop services:</p>
                <code className="px-3 py-2 rounded block text-primary" style={{backgroundColor: 'var(--input)'}}>
                  docker-compose down
                </code>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">Update services:</p>
                <code className="px-3 py-2 rounded block text-primary" style={{backgroundColor: 'var(--input)'}}>
                  docker-compose pull && docker-compose up -d
                </code>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Deployment Modal */}
      <DeploymentModal
        isOpen={showDeployModal}
        onClose={() => setShowDeployModal(false)}
        envContent={configData.envContent}
        composeContent={configData.composeContent}
        overrideContent={configData.overrideContent}
      />
    </>
  );
}

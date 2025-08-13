'use client';

import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { DeploymentStep } from '@/lib/types';

interface DeploymentProgressProps {
  steps: DeploymentStep[];
  deploymentComplete: boolean;
}

export function DeploymentProgress({ steps, deploymentComplete }: DeploymentProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 mb-6">
        <Loader2 className="animate-spin text-primary" size={24} />
        <h3 className="text-xl font-bold">Deployment Progress</h3>
      </div>

      <div className="space-y-3">
        {steps.map((step) => (
          <motion.div
            key={step.step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 p-3 rounded bg-card/50 border border-primary/20"
          >
            {step.status === 'pending' && (
              <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30" />
            )}
            {step.status === 'running' && (
              <Loader2 className="animate-spin text-primary" size={24} />
            )}
            {step.status === 'completed' && (
              <CheckCircle2 className="text-green-400" size={24} />
            )}
            {step.status === 'error' && (
              <AlertCircle className="text-red-400" size={24} />
            )}
            
            <div className="flex-1">
              <p className={`font-mono text-sm ${
                step.status === 'completed' ? 'text-green-400' :
                step.status === 'error' ? 'text-red-400' :
                step.status === 'running' ? 'text-primary' :
                'text-muted-foreground'
              }`}>
                {step.message}
              </p>
              {step.details && (
                <p className="text-xs text-muted-foreground mt-1">{step.details}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {deploymentComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded"
        >
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 size={20} />
            <h4 className="font-bold">Deployment Complete!</h4>
          </div>
          <div className="mt-2 space-y-2 text-sm text-green-300">
            <p>Your Supabase instance has been deployed successfully.</p>
            <div className="space-y-1">
              <p><strong>Studio:</strong> https://yourdomain.com:3000</p>
              <p><strong>API:</strong> https://yourdomain.com:8000</p>
              <p><strong>Realtime:</strong> wss://yourdomain.com:4000</p>
              <p><strong>Storage:</strong> https://yourdomain.com:8000/storage</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
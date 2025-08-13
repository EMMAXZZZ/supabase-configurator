'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { DeploymentSchema } from '@/lib/validation';
import { deployToVPS, ApiError } from '@/lib/api-client';
import { sleep } from '@/lib/utils';
import type { DeploymentData, DeploymentStep, DeploymentFormData } from '@/lib/types';
import { DeploymentForm } from './DeploymentForm';
import { DeploymentProgress } from './DeploymentProgress';

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  envContent: string;
  composeContent: string;
  overrideContent?: string;
}

export function DeploymentModal({ 
  isOpen, 
  onClose, 
  envContent, 
  composeContent,
  overrideContent,
}: DeploymentModalProps) {
  const [formData, setFormData] = useState<DeploymentFormData>({
    vpsHost: '',
    vpsUser: 'root',
    vpsPort: 22,
    vpsPassword: '',
    domainName: '',
    sslEmail: '',
    remotePath: '/opt/supabase',
    includeOverride: false,
    runDockerUp: false,
    confirmDestructive: false,
    confirmPhrase: '',
  });
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentSteps, setDeploymentSteps] = useState<DeploymentStep[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deploymentComplete, setDeploymentComplete] = useState(false);

  const initializeSteps = (): DeploymentStep[] => [
    { step: 1, message: '🔐 Connecting to VPS via SSH...', status: 'pending' },
    { step: 2, message: `📁 Creating project directory at ${formData.remotePath}`, status: 'pending' },
    { step: 3, message: '📝 Uploading configuration files...', status: 'pending' },
    { step: 4, message: '🐳 Installing Docker and Docker Compose...', status: 'pending' },
    { step: 5, message: '🔧 Setting up environment...', status: 'pending' },
    ...(formData.domainName ? [
      { step: 6, message: '🔒 Setting up SSL with Let\'s Encrypt...', status: 'pending' as const }
    ] : []),
    ...(formData.runDockerUp ? [
      { step: formData.domainName ? 7 : 6, message: '🚀 Starting Supabase services...', status: 'pending' as const }
    ] : []),
  ];

  const updateStep = (stepNumber: number, status: DeploymentStep['status'], details?: string) => {
    setDeploymentSteps(prev => prev.map(step => 
      step.step === stepNumber 
        ? { ...step, status, details }
        : step
    ));
  };

  const clearFieldError = (field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleDeploy = async () => {
    try {
      setErrors([]);
      setFieldErrors({});

      // Validate form
      const result = DeploymentSchema.safeParse(formData);
      if (!result.success) {
        const newFieldErrors: Record<string, string> = {};
        result.error.errors.forEach(error => {
          if (error.path.length > 0) {
            newFieldErrors[error.path[0]] = error.message;
          }
        });
        setFieldErrors(newFieldErrors);
        return;
      }

      if (formData.confirmPhrase !== 'DEPLOY SUPABASE') {
        setFieldErrors({ confirmPhrase: 'Must type "DEPLOY SUPABASE" exactly' });
        return;
      }

      setIsDeploying(true);
      const steps = initializeSteps();
      setDeploymentSteps(steps);

      // Simulate deployment progress
      for (let i = 0; i < steps.length; i++) {
        updateStep(steps[i].step, 'running');
        await sleep(2000 + Math.random() * 3000);
        updateStep(steps[i].step, 'completed', `Step ${steps[i].step} completed successfully`);
      }

      // Actual deployment call
      const deploymentData: DeploymentData = {
        ...formData,
        envContent,
        composeContent,
        overrideContent,
      };

      await deployToVPS(deploymentData);
      setDeploymentComplete(true);

    } catch (error) {
      console.error('Deployment error:', error);
      
      if (error instanceof ApiError) {
        setErrors([error.message]);
        if (error.details) {
          setErrors(prev => [...prev, ...error.details]);
        }
      } else {
        setErrors(['An unexpected error occurred during deployment']);
      }

      // Mark current step as error
      const currentStep = deploymentSteps.find(s => s.status === 'running');
      if (currentStep) {
        updateStep(currentStep.step, 'error', 'Deployment failed at this step');
      }
    } finally {
      setIsDeploying(false);
    }
  };

  const handleClose = () => {
    if (!isDeploying) {
      setFormData({
        vpsHost: '',
        vpsUser: 'root',
        vpsPort: 22,
        vpsPassword: '',
        domainName: '',
        sslEmail: '',
        remotePath: '/opt/supabase',
        includeOverride: false,
        runDockerUp: false,
        confirmDestructive: false,
        confirmPhrase: '',
      });
      setDeploymentSteps([]);
      setDeploymentComplete(false);
      setErrors([]);
      setFieldErrors({});
      onClose();
    }
  };

  const canDeploy = formData.vpsHost && 
                   formData.vpsPassword && 
                   formData.confirmDestructive && 
                   formData.confirmPhrase === 'DEPLOY SUPABASE';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background border border-primary/30 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-primary/30">
              <h2 className="text-2xl font-bold text-primary">Deploy to VPS</h2>
              {!isDeploying && (
                <button
                  onClick={handleClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={24} />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {errors.length > 0 && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded">
                  <h4 className="text-red-400 font-bold mb-2">Deployment Errors:</h4>
                  <ul className="space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-red-300 text-sm">• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!isDeploying && !deploymentComplete ? (
                <DeploymentForm
                  formData={formData}
                  onFormChange={setFormData}
                  fieldErrors={fieldErrors}
                  onClearFieldError={clearFieldError}
                />
              ) : (
                <DeploymentProgress
                  steps={deploymentSteps}
                  deploymentComplete={deploymentComplete}
                />
              )}
            </div>

            {/* Footer */}
            {!isDeploying && !deploymentComplete && (
              <div className="p-6 border-t border-primary/30 flex gap-4">
                <button
                  onClick={handleClose}
                  className="px-6 py-3 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeploy}
                  disabled={!canDeploy}
                  className="px-6 py-3 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Deploying...
                    </>
                  ) : (
                    '🚀 Deploy to VPS'
                  )}
                </button>
              </div>
            )}

            {deploymentComplete && (
              <div className="p-6 border-t border-primary/30">
                <button
                  onClick={handleClose}
                  className="w-full px-6 py-3 rounded bg-green-600 hover:bg-green-700 text-white font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
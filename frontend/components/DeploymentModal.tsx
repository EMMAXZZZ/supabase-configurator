'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Server, Globe, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { DeploymentSchema } from '@/lib/validation';
import { deployToVPS, ApiError } from '@/lib/api-client';
import { sleep } from '@/lib/utils';
import type { DeploymentData, DeploymentStep } from '@/lib/types';

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
  const [formData, setFormData] = useState({
    vpsHost: '',
    vpsUser: 'root',
    vpsPort: 22,
    vpsPassword: '',
    domainName: '',
    sslEmail: '',
    remotePath: '/opt/supabase',
    includeOverride: false,
    runDockerUp: false,
  });
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentSteps, setDeploymentSteps] = useState<DeploymentStep[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deploymentComplete, setDeploymentComplete] = useState(false);

  const steps: Omit<DeploymentStep, 'status'>[] = [
    { step: 1, message: '🔐 Connecting to VPS via SSH...' },
    { step: 2, message: `📁 Creating project directory at ${typeof window === 'undefined' ? '' : ''}${''}` },
    { step: 3, message: '📝 Uploading configuration files...' },
    { step: 4, message: '🐳 Installing Docker & Docker Compose...' },
    { step: 5, message: '📥 Pulling Docker images...' },
    { step: 6, message: '🚀 Starting Supabase services...' },
    { step: 7, message: '🌐 Configuring domain & SSL...' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? (parseInt(value) || 0) : (type === 'checkbox' ? checked : value)
    }));
    
    // Clear field error
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const resetModal = () => {
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
    });
    setIsDeploying(false);
    setDeploymentSteps([]);
    setErrors([]);
    setFieldErrors({});
    setDeploymentComplete(false);
  };

  const handleClose = () => {
    if (!isDeploying) {
      resetModal();
      onClose();
    }
  };

  const validateForm = () => {
    try {
      const deploymentData: DeploymentData = {
        ...formData,
        envContent,
        composeContent,
      };
      DeploymentSchema.parse(deploymentData);
      return true;
    } catch (error: any) {
      const newFieldErrors: Record<string, string> = {};
      const errorMessages: string[] = [];
      
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          const message = err.message;
          newFieldErrors[field] = message;
          errorMessages.push(`${field}: ${message}`);
        });
      }
      
      setFieldErrors(newFieldErrors);
      setErrors(errorMessages);
      return false;
    }
  };

  const updateStepStatus = (stepNumber: number, status: DeploymentStep['status']) => {
    setDeploymentSteps(prev => {
      const newSteps = [...prev];
      const stepIndex = newSteps.findIndex(s => s.step === stepNumber);
      
      if (stepIndex >= 0) {
        newSteps[stepIndex] = { ...newSteps[stepIndex], status };
      } else {
        const stepTemplate = steps.find(s => s.step === stepNumber);
        if (stepTemplate) {
          newSteps.push({ ...stepTemplate, status });
        }
      }
      
      return newSteps.sort((a, b) => a.step - b.step);
    });
  };

  const simulateDeployment = async () => {
    const stepDelays = [2000, 1500, 2000, 3000, 4000, 2000, 1000];
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      updateStepStatus(step.step, 'active');
      await sleep(stepDelays[i]);
      updateStepStatus(step.step, 'completed');
    }
  };

  const handleDeploy = async () => {
    setErrors([]);
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsDeploying(true);
    setDeploymentComplete(false);

    try {
      const deploymentData: DeploymentData = {
        ...formData,
        envContent,
        composeContent,
        overrideContent: formData.includeOverride ? (overrideContent || '') : undefined,
      } as any;

      // Call API to upload files (and optionally run docker compose)
      updateStepStatus(1, 'active');
      const result = await deployToVPS(deploymentData);
      updateStepStatus(1, 'completed');
      // Mark upload step as completed
      updateStepStatus(2, 'completed');
      updateStepStatus(3, 'completed');
      // If runDockerUp was requested, reflect that as a completed step
      if (formData.runDockerUp) {
        updateStepStatus(6, 'completed');
      }
      setDeploymentComplete(true);
    } catch (error) {
      console.error('Deployment failed:', error);
      
      // Mark current active step as error
      setDeploymentSteps(prev => 
        prev.map(step => 
          step.status === 'active' 
            ? { ...step, status: 'error' } 
            : step
        )
      );
      
      if (error instanceof ApiError) {
        setErrors([error.message]);
      } else {
        setErrors(['Deployment failed. Please check your VPS credentials and try again.']);
      }
    } finally {
      setIsDeploying(false);
    }
  };

  const getAccessUrl = () => {
    return formData.domainName 
      ? `https://${formData.domainName}` 
      : `http://${formData.vpsHost}:3000`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal show"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="modal-content"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="flex items-center gap-2">
                <Server size={24} />
                Deploy to VPS
              </h3>
              {!isDeploying && (
                <button
                  onClick={handleClose}
                  className="modal-close hover:text-destructive transition-colors"
                >
                  <X size={24} />
                </button>
              )}
            </div>

            <div className="modal-body space-y-6">
              {!deploymentComplete && !isDeploying && (
                <>
                  {errors.length > 0 && (
                    <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
                      <ul className="space-y-1">
                        {errors.map((error, index) => (
                          <li key={index} className="font-mono text-sm">• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-muted-foreground text-sm font-semibold uppercase tracking-wide mb-2">
                        VPS Host/IP *
                      </label>
                      <input
                        type="text"
                        name="vpsHost"
                        value={formData.vpsHost}
                        onChange={handleInputChange}
                        className={`neon-input ${fieldErrors.vpsHost ? 'border-destructive' : ''}`}
                        placeholder="192.168.1.100 or myserver.com"
                        required
                      />
                      {fieldErrors.vpsHost && (
                        <p className="text-destructive text-sm mt-1 font-mono">{fieldErrors.vpsHost}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-muted-foreground text-sm font-semibold uppercase tracking-wide mb-2">
                        SSH Username *
                      </label>
                      <input
                        type="text"
                        name="vpsUser"
                        value={formData.vpsUser}
                        onChange={handleInputChange}
                        className={`neon-input ${fieldErrors.vpsUser ? 'border-destructive' : ''}`}
                        placeholder="root"
                        required
                      />
                      {fieldErrors.vpsUser && (
                        <p className="text-destructive text-sm mt-1 font-mono">{fieldErrors.vpsUser}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-muted-foreground text-sm font-semibold uppercase tracking-wide mb-2">
                        SSH Port *
                      </label>
                      <input
                        type="number"
                        name="vpsPort"
                        value={formData.vpsPort}
                        onChange={handleInputChange}
                        className={`neon-input ${fieldErrors.vpsPort ? 'border-destructive' : ''}`}
                        placeholder="22"
                        min="1"
                        max="65535"
                        required
                      />
                      {fieldErrors.vpsPort && (
                        <p className="text-destructive text-sm mt-1 font-mono">{fieldErrors.vpsPort}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-muted-foreground text-sm font-semibold uppercase tracking-wide mb-2">
                        SSH Password *
                      </label>
                      <input
                        type="password"
                        name="vpsPassword"
                        value={formData.vpsPassword}
                        onChange={handleInputChange}
                        className={`neon-input ${fieldErrors.vpsPassword ? 'border-destructive' : ''}`}
                        placeholder="Your SSH password"
                        required
                      />
                      {fieldErrors.vpsPassword && (
                        <p className="text-destructive text-sm mt-1 font-mono">{fieldErrors.vpsPassword}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-muted-foreground text-sm font-semibold uppercase tracking-wide mb-2">
                        <Globe size={14} className="inline mr-1" />
                        Domain Name (Optional)
                      </label>
                      <input
                        type="text"
                        name="domainName"
                        value={formData.domainName}
                        onChange={handleInputChange}
                        className="neon-input"
                        placeholder="myapp.com"
                      />
                      <p className="text-muted-foreground text-xs mt-1 font-mono">
                        Leave empty to use IP address only
                      </p>
                    </div>

                    <div>
                      <label className="block text-muted-foreground text-sm font-semibold uppercase tracking-wide mb-2">
                        Remote Path on Server (where docker-compose will live) *
                      </label>
                      <input
                        type="text"
                        name="remotePath"
                        value={formData.remotePath}
                        onChange={handleInputChange}
                        className={`neon-input ${fieldErrors.remotePath ? 'border-destructive' : ''}`}
                        placeholder="/opt/supabase"
                        required
                      />
                      {fieldErrors.remotePath && (
                        <p className="text-destructive text-sm mt-1 font-mono">{fieldErrors.remotePath}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        id="includeOverride"
                        type="checkbox"
                        name="includeOverride"
                        checked={formData.includeOverride}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="includeOverride" className="font-mono text-sm">
                        Include docker-compose.override.yml in upload
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        id="runDockerUp"
                        type="checkbox"
                        name="runDockerUp"
                        checked={formData.runDockerUp}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="runDockerUp" className="font-mono text-sm">
                        After upload, run: docker compose up -d
                      </label>
                    </div>

                    <div>
                      <label className="block text-muted-foreground text-sm font-semibold uppercase tracking-wide mb-2">
                        <Lock size={14} className="inline mr-1" />
                        SSL Email (Optional)
                      </label>
                      <input
                        type="email"
                        name="sslEmail"
                        value={formData.sslEmail}
                        onChange={handleInputChange}
                        className="neon-input"
                        placeholder="admin@myapp.com"
                      />
                      <p className="text-muted-foreground text-xs mt-1 font-mono">
                        Required for SSL certificate if domain is provided
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Deployment Progress */}
              {(isDeploying || deploymentComplete) && (
                <div className="space-y-4">
                  <h4 className="text-primary text-center font-bold uppercase tracking-wide">
                    {deploymentComplete ? '✅ Deployment Complete!' : '🚀 Deploying...'}
                  </h4>
                  
                  <div className="space-y-3">
                    {deploymentSteps.map((step) => (
                      <motion.div
                        key={step.step}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`
                          p-3 rounded border-l-4 font-mono text-sm transition-all duration-300
                          ${step.status === 'completed' 
                            ? 'bg-primary/10 border-primary text-primary' 
                            : step.status === 'active'
                            ? 'bg-primary/20 border-primary text-primary animate-pulse-step'
                            : step.status === 'error'
                            ? 'bg-destructive/10 border-destructive text-destructive'
                            : 'bg-muted/30 border-muted text-muted-foreground'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          {step.status === 'completed' && <CheckCircle2 size={16} />}
                          {step.status === 'active' && <Loader2 size={16} className="animate-spin" />}
                          {step.status === 'error' && <AlertCircle size={16} />}
                          {step.message}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {deploymentComplete && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-primary/10 border border-primary text-primary p-4 rounded-lg text-center"
                    >
                      <p className="font-mono text-sm mb-2">
                        🎉 Your Supabase instance is now running!
                      </p>
                      <p className="font-mono text-xs">
                        <strong>Access URL:</strong> {getAccessUrl()}
                      </p>
                      <p className="font-mono text-xs">
                        <strong>API Endpoint:</strong> {getAccessUrl().replace(':3000', ':8000')}
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {!isDeploying && !deploymentComplete && (
              <div className="modal-footer">
                <button
                  onClick={handleClose}
                  className="holographic-button secondary"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleDeploy}
                  className="holographic-button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Deploy Now
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

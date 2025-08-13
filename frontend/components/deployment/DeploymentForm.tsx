'use client';

import type React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Server, Globe, Lock } from 'lucide-react';
import { DeploymentSchema } from '@/lib/validation';
import type { DeploymentFormData } from '@/lib/types';

interface DeploymentFormProps {
  formData: DeploymentFormData;
  onFormChange: (data: DeploymentFormData) => void;
  fieldErrors: Record<string, string>;
  onClearFieldError: (field: string) => void;
}

export function DeploymentForm({
  formData,
  onFormChange,
  fieldErrors,
  onClearFieldError,
}: DeploymentFormProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value);
    
    onFormChange({ ...formData, [name]: newValue });
    
    if (fieldErrors[name]) {
      onClearFieldError(name);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* VPS Connection Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Server size={20} />
          <h3 className="text-lg font-bold">VPS Connection</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Host/IP <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="vpsHost"
              value={formData.vpsHost}
              onChange={handleInputChange}
              placeholder="192.168.1.100 or vps.example.com"
              className="w-full p-3 rounded bg-card border border-primary/30 text-foreground focus:border-primary focus:outline-none"
            />
            {fieldErrors.vpsHost && (
              <p className="text-red-400 text-sm mt-1">{fieldErrors.vpsHost}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              name="vpsUser"
              value={formData.vpsUser}
              onChange={handleInputChange}
              placeholder="root"
              className="w-full p-3 rounded bg-card border border-primary/30 text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Port</label>
            <input
              type="number"
              name="vpsPort"
              value={formData.vpsPort}
              onChange={handleInputChange}
              placeholder="22"
              className="w-full p-3 rounded bg-card border border-primary/30 text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              name="vpsPassword"
              value={formData.vpsPassword}
              onChange={handleInputChange}
              placeholder="Your SSH password"
              className="w-full p-3 rounded bg-card border border-primary/30 text-foreground focus:border-primary focus:outline-none"
            />
            {fieldErrors.vpsPassword && (
              <p className="text-red-400 text-sm mt-1">{fieldErrors.vpsPassword}</p>
            )}
          </div>
        </div>
      </div>

      {/* SSL Configuration Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-secondary">
          <Lock size={20} />
          <h3 className="text-lg font-bold">SSL Configuration (Optional)</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Domain Name</label>
            <input
              type="text"
              name="domainName"
              value={formData.domainName}
              onChange={handleInputChange}
              placeholder="yourdomain.com (optional)"
              className="w-full p-3 rounded bg-card border border-primary/30 text-foreground focus:border-primary focus:outline-none"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Leave empty to skip SSL setup
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">SSL Email</label>
            <input
              type="email"
              name="sslEmail"
              value={formData.sslEmail}
              onChange={handleInputChange}
              placeholder="admin@yourdomain.com"
              className="w-full p-3 rounded bg-card border border-primary/30 text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Globe size={20} />
          <h3 className="text-lg font-bold">Advanced Options</h3>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Remote Path</label>
          <input
            type="text"
            name="remotePath"
            value={formData.remotePath}
            onChange={handleInputChange}
            placeholder="/opt/supabase"
            className="w-full p-3 rounded bg-card border border-primary/30 text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="includeOverride"
              checked={formData.includeOverride}
              onChange={handleInputChange}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm">Include docker-compose.override.yml</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="runDockerUp"
              checked={formData.runDockerUp}
              onChange={handleInputChange}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm">Run docker-compose up after upload</span>
          </label>
        </div>
      </div>

      {/* Confirmation Section */}
      <div className="bg-red-500/10 border border-red-500/30 rounded p-4 space-y-3">
        <h4 className="text-red-400 font-bold">⚠️ Destructive Operation Warning</h4>
        <p className="text-sm text-red-300">
          This will modify your VPS by installing Docker, creating directories, and potentially starting services. 
          Make sure you have backups and understand the implications.
        </p>
        
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            name="confirmDestructive"
            checked={formData.confirmDestructive}
            onChange={handleInputChange}
            className="w-4 h-4 accent-red-500 mt-0.5"
          />
          <span className="text-sm">I understand this is a destructive operation and have made backups</span>
        </label>
        
        {formData.confirmDestructive && (
          <div>
            <label className="block text-sm font-medium mb-2 text-red-400">
              Type "DEPLOY SUPABASE" to confirm:
            </label>
            <input
              type="text"
              name="confirmPhrase"
              value={formData.confirmPhrase}
              onChange={handleInputChange}
              placeholder="DEPLOY SUPABASE"
              className="w-full p-3 rounded bg-card border border-red-500/50 text-foreground focus:border-red-400 focus:outline-none"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
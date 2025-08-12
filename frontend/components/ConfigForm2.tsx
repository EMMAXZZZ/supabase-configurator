'use client';

import type React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { ConfigFormSchema } from '@/lib/validation';
import { generateConfig, ApiError } from '@/lib/api-client';
import type { ConfigFormData, GenerateResponse } from '@/lib/types';

export default function ConfigForm() {
  const [formData, setFormData] = useState<ConfigFormData>({
    project_name: '',
    domain: '',
    email: '',
    db_password: '',
    jwt_secret: '',
    anon_key: '',
    service_key: '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    try {
      ConfigFormSchema.parse(formData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== '')
      ) as ConfigFormData;

      const result: GenerateResponse = await generateConfig(cleanData);
      sessionStorage.setItem('generated_config', JSON.stringify(result));
      router.push('/result');
    } catch (error) {
      console.error('Configuration generation failed:', error);
      
      if (error instanceof ApiError) {
        if (error.errors) {
          setErrors(error.errors);
        } else {
          setErrors([error.message]);
        }
      } else {
        setErrors(['An unexpected error occurred. Please try again.']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="form-container"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg"
          >
            <ul className="space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="font-mono text-sm">• {error}</li>
              ))}
            </ul>
          </motion.div>
        )}

        <div className="space-y-4">
          <h3 className="text-primary text-xl font-bold uppercase tracking-wide mb-4">
            Required Configuration
          </h3>
          
          <div className="form-group">
            <label htmlFor="project_name" className="block text-muted-foreground text-sm font-semibold uppercase tracking-wide mb-2">
              Project Name
            </label>
            <input
              type="text"
              id="project_name"
              name="project_name"
              value={formData.project_name}
              onChange={handleInputChange}
              className={`neon-input ${fieldErrors.project_name ? 'border-destructive' : ''}`}
              placeholder="my-supabase-project"
              required
            />
            {fieldErrors.project_name && (
              <p className="text-destructive text-sm mt-1 font-mono">{fieldErrors.project_name}</p>
            )}
            <p className="text-muted-foreground text-sm mt-1 font-mono">
              Only alphanumeric characters, hyphens, and underscores allowed
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="domain" className="block text-muted-foreground text-sm font-semibold uppercase tracking-wide mb-2">
              Domain
            </label>
            <input
              type="text"
              id="domain"
              name="domain"
              value={formData.domain}
              onChange={handleInputChange}
              className={`neon-input ${fieldErrors.domain ? 'border-destructive' : ''}`}
              placeholder="myapp.com or https://myapp.com"
              required
            />
            {fieldErrors.domain && (
              <p className="text-destructive text-sm mt-1 font-mono">{fieldErrors.domain}</p>
            )}
            <p className="text-muted-foreground text-sm mt-1 font-mono">
              Your app's domain name (with or without https://)
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="block text-muted-foreground text-sm font-semibold uppercase tracking-wide mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`neon-input ${fieldErrors.email ? 'border-destructive' : ''}`}
              placeholder="admin@myapp.com"
              required
            />
            {fieldErrors.email && (
              <p className="text-destructive text-sm mt-1 font-mono">{fieldErrors.email}</p>
            )}
            <p className="text-muted-foreground text-sm mt-1 font-mono">
              Admin email for SSL certificates and notifications
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <span className="text-lg font-bold uppercase tracking-wide">
              Advanced Configuration (Optional)
            </span>
            <motion.div
              animate={{ rotate: showAdvanced ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ▼
            </motion.div>
          </button>

          <motion.div
            initial={false}
            animate={{ height: showAdvanced ? 'auto' : 0, opacity: showAdvanced ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-4">
              {(['db_password', 'jwt_secret', 'anon_key', 'service_key'] as const).map((field) => (
                <div key={field} className="form-group">
                  <label htmlFor={field} className="block text-muted-foreground text-sm font-semibold uppercase tracking-wide mb-2">
                    {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords[field] ? 'text' : 'password'}
                      id={field}
                      name={field}
                      value={formData[field] || ''}
                      onChange={handleInputChange}
                      className="neon-input pr-10"
                      placeholder="Leave empty to auto-generate"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(field)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPasswords[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1 font-mono">
                    {field === 'db_password' && 'Database password (auto-generated if empty)'}
                    {field === 'jwt_secret' && 'JWT signing secret (auto-generated if empty)'}
                    {field === 'anon_key' && 'Anonymous JWT token (auto-generated if empty)'}
                    {field === 'service_key' && 'Service role JWT token (auto-generated if empty)'}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.button
          type="submit"
          disabled={isLoading}
          className="holographic-button w-full text-base py-4 flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Generating Configuration...
            </>
          ) : (
            'Generate Configuration'
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}

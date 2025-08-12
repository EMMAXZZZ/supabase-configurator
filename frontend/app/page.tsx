'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [hideRocket, setHideRocket] = useState(false);
  const [rocketSrc] = useState('/images/rocket.svg');

  const toggleCard = (cardIndex: number) => {
    setExpandedCard(expandedCard === cardIndex ? null : cardIndex);
  };
  return (
    <>
      <div className="circuit-background" />
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative z-10">
        <div className="max-w-4xl w-full text-center mx-auto flex flex-col items-center">
          {/* Header */}
          <h1 
            className="text-6xl font-bold uppercase tracking-wider mb-4 font-sans"
            style={{
              background: 'linear-gradient(45deg, var(--primary), var(--secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            SBConfig
          </h1>
          
          {/* Single large rocket divider above cards */}
          {!hideRocket && (
            <div className="rocket-hero" aria-hidden>
              <div className="rocket-hero-inner">
                <img
                  src={rocketSrc}
                  alt="Rocket launching"
                  height={240}
                  style={{ height: '200px', width: 'auto' }}
                  onError={() => setHideRocket(true)}
                />
                <div className="rocket-plume" />
              </div>
            </div>
          )}

          {/* FAQ Feature Cards (moved directly under heading) */}
          <div className="faq-container">
            {/* Security Card */}
            <motion.div 
              className="faq-card"
              initial={false}
              animate={{ 
                backgroundColor: expandedCard === 0 
                  ? "rgba(0, 217, 255, 0.1)" 
                  : "rgba(26, 27, 46, 0.9)"
              }}
            >
              <button
                className="faq-header"
                onClick={() => toggleCard(0)}
              >
                <div className="flex items-center gap-4">
                  <div className="faq-icon">🔐</div>
                  <div className="text-left">
                    <h3 className="faq-title">Secure by Default</h3>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: expandedCard === 0 ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-primary text-2xl"
                >
                  ▼
                </motion.div>
              </button>
              
              <AnimatePresence>
                {expandedCard === 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="faq-content"
                  >
                    <div className="space-y-4">
                      <ul className="list-disc list-inside text-left font-mono text-sm text-foreground/90">
                        <li>Strong DB password (32+ chars)</li>
                        <li>JWT signing secret (HS256)</li>
                        <li>Anon key for public access</li>
                        <li>Service role key for server ops</li>
                      </ul>
                      <h4 className="text-primary font-bold">Generated Security Components:</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="security-item">
                          <strong>Database Password:</strong>
                          <p>32-character random string with mixed case, numbers, and symbols</p>
                        </div>
                        <div className="security-item">
                          <strong>JWT Secret:</strong>
                          <p>256-bit cryptographically secure secret for token signing</p>
                        </div>
                        <div className="security-item">
                          <strong>Anonymous Key:</strong>
                          <p>JWT token with limited permissions for public access</p>
                        </div>
                        <div className="security-item">
                          <strong>Service Role Key:</strong>
                          <p>JWT token with full database access for server-side operations</p>
                        </div>
                      </div>
                      <div className="bg-primary/10 p-3 rounded border border-primary/30">
                        <p className="text-sm font-mono text-primary">
                          ⚠️ All secrets use crypto.randomBytes() for maximum entropy and security
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Production Ready Card */}
            <motion.div 
              className="faq-card"
              initial={false}
              animate={{ 
                backgroundColor: expandedCard === 1 
                  ? "rgba(0, 217, 255, 0.1)" 
                  : "rgba(26, 27, 46, 0.9)"
              }}
            >
              <button
                className="faq-header"
                onClick={() => toggleCard(1)}
              >
                <div className="flex items-center gap-4">
                  <div className="faq-icon">🚀</div>
                  <div className="text-left">
                    <h3 className="faq-title">Production Ready</h3>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: expandedCard === 1 ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-primary text-2xl"
                >
                  ▼
                </motion.div>
              </button>
              
              <AnimatePresence>
                {expandedCard === 1 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="faq-content"
                  >
                    <div className="space-y-4">
                      <ul className="list-disc list-inside text-left font-mono text-sm text-foreground/90">
                        <li>DB, API, Realtime, Auth</li>
                        <li>Storage, Kong, Studio, Functions</li>
                        <li>Health checks + persistent volumes</li>
                      </ul>
                      <h4 className="text-primary font-bold">Included Services:</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="service-item">
                          <strong>PostgreSQL:</strong> Database with optimized settings
                        </div>
                        <div className="service-item">
                          <strong>PostgREST:</strong> Auto-generated REST API
                        </div>
                        <div className="service-item">
                          <strong>Realtime:</strong> WebSocket connections for live updates
                        </div>
                        <div className="service-item">
                          <strong>GoTrue:</strong> Authentication and user management
                        </div>
                        <div className="service-item">
                          <strong>Storage:</strong> File uploads and management
                        </div>
                        <div className="service-item">
                          <strong>Kong:</strong> API Gateway with rate limiting
                        </div>
                        <div className="service-item">
                          <strong>Studio:</strong> Database management dashboard
                        </div>
                        <div className="service-item">
                          <strong>Edge Functions:</strong> Serverless function runtime
                        </div>
                      </div>
                      <div className="bg-secondary/10 p-3 rounded border border-secondary/30">
                        <p className="text-sm font-mono" style={{ color: "var(--secondary)" }}>
                          🛠️ Pre-configured with production-optimized settings, health checks, and persistent volumes
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Deployment Card */}
            <motion.div 
              className="faq-card"
              initial={false}
              animate={{ 
                backgroundColor: expandedCard === 2 
                  ? "rgba(0, 217, 255, 0.1)" 
                  : "rgba(26, 27, 46, 0.9)"
              }}
            >
              <button
                className="faq-header"
                onClick={() => toggleCard(2)}
              >
                <div className="flex items-center gap-4">
                  <div className="faq-icon">⚡</div>
                  <div className="text-left">
                    <h3 className="faq-title">One-Click Deploy</h3>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: expandedCard === 2 ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-primary text-2xl"
                >
                  ▼
                </motion.div>
              </button>
              
              <AnimatePresence>
                {expandedCard === 2 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="faq-content"
                  >
                    <div className="space-y-4">
                      <ul className="list-disc list-inside text-left font-mono text-sm text-foreground/90">
                        <li>SSH in, install Docker + Compose</li>
                        <li>Upload .env and docker-compose.yml</li>
                        <li>Issue SSL (Let’s Encrypt)</li>
                        <li>Start all Supabase services</li>
                      </ul>
                      <h4 className="text-primary font-bold">Deployment Process:</h4>
                      <div className="space-y-3">
                        <div className="deploy-step">
                          <strong>1. SSH Connection:</strong> Secure connection to your VPS using provided credentials
                        </div>
                        <div className="deploy-step">
                          <strong>2. Dependencies:</strong> Automatic installation of Docker & Docker Compose
                        </div>
                        <div className="deploy-step">
                          <strong>3. File Upload:</strong> Transfer of .env and docker-compose.yml files
                        </div>
                        <div className="deploy-step">
                          <strong>4. SSL Setup:</strong> Let's Encrypt certificate generation (if domain provided)
                        </div>
                        <div className="deploy-step">
                          <strong>5. Service Launch:</strong> Pull Docker images and start all Supabase services
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="requirement-box">
                          <h5 className="text-primary font-bold mb-2">Requirements:</h5>
                          <ul className="text-sm space-y-1">
                            <li>• Ubuntu 20.04+ or similar Linux distro</li>
                            <li>• 2GB+ RAM recommended</li>
                            <li>• SSH access with root privileges</li>
                            <li>• Open ports: 22, 80, 443, 3000, 8000</li>
                          </ul>
                        </div>
                        <div className="requirement-box">
                          <h5 className="text-primary font-bold mb-2">Access Points:</h5>
                          <ul className="text-sm space-y-1">
                            <li>• Studio: https://yourdomain.com:3000</li>
                            <li>• API: https://yourdomain.com:8000</li>
                            <li>• Realtime: wss://yourdomain.com:4000</li>
                            <li>• Storage: https://yourdomain.com:8000/storage</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          
          
          <p className="text-xl font-mono" style={{ color: 'var(--muted-foreground)', marginBottom: '20px' }}>
            Supabase Configuration Generator
          </p>
          
          <p className="font-mono mb-8" style={{ color: 'var(--muted-foreground)', marginTop: 0 }}>
            Generate production-ready Supabase configurations with Docker Compose
          </p>

          {/* Call to Action aligned to card width */}
          <div className="cta-container">
            <button 
              className="holographic-button text-lg px-8 py-4 mx-auto"
              onClick={() => {
                window.location.href = '/config';
              }}
              style={{
                backgroundColor: 'var(--primary)',
                border: '2px solid var(--primary)',
                color: 'var(--background)',
                padding: '20px 40px',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontSize: '1.25rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 25px rgba(0, 255, 255, 0.6)',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--primary)';
                e.currentTarget.style.boxShadow = '0 0 35px rgba(0, 255, 255, 0.8)';
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--background)';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 255, 255, 0.6)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
              }}
            >
              🚀 Generate Configuration
            </button>
            <p className="mt-6 text-base font-mono" style={{ color: 'var(--muted-foreground)' }}>
              Create your production-ready Supabase setup in minutes
            </p>
          </div>
          
        </div>
      </div>
    </>
  );
}

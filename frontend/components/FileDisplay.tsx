'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, Check } from 'lucide-react';
import { copyToClipboard, downloadFile } from '@/lib/utils';

interface FileDisplayProps {
  filename: string;
  content: string;
  description?: string;
}

export function FileDisplay({ filename, content, description }: FileDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyToClipboard(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    downloadFile(content, filename);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="file-container"
    >
      <div className="file-header">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-primary text-lg font-bold uppercase tracking-wide mb-1">
              {filename}
            </h3>
            {description && (
              <p className="text-muted-foreground font-mono text-sm">
                {description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <motion.button
              onClick={handleCopy}
              className="copy-btn flex items-center gap-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? (
                <>
                  <Check size={12} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy
                </>
              )}
            </motion.button>
            <motion.button
              onClick={handleDownload}
              className="copy-btn flex items-center gap-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={12} />
              Download
            </motion.button>
          </div>
        </div>
      </div>
      
      <div className="relative">
        <pre className="text-foreground p-6 m-0 overflow-x-auto font-mono text-sm leading-relaxed" style={{backgroundColor: 'var(--input)'}}>
          <code>{content}</code>
        </pre>
      </div>
    </motion.div>
  );
}

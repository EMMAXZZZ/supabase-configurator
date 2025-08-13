/**
 * Utility functions for Supabase Configurator
 * Contains crypto functions, validation, and helper utilities
 */

/**
 * Generate a cryptographically secure random secret
 * @param {number} length - Length of the secret to generate
 * @returns {string} Base64-safe random string
 */
export function generateSecureSecret(length = 64) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
        result += charset[randomValues[i] % charset.length];
    }
    return result;
}

/**
 * Generate a cryptographically secure password
 * @param {number} length - Length of the password to generate
 * @returns {string} Random password with special characters
 */
export function generatePassword(length = 32) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
        result += charset[randomValues[i] % charset.length];
    }
    return result;
}

/**
 * Generate a JWT token using HMAC SHA-256
 * @param {string} secret - Secret key for signing
 * @param {object} payload - JWT payload object
 * @returns {Promise<string>} JWT token
 */
export async function generateJWT(secret, payload) {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };
    
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '');
    
    const message = `${encodedHeader}.${encodedPayload}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const secretData = encoder.encode(secret);
    
    const key = await crypto.subtle.importKey(
        'raw',
        secretData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, data);
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '');
    
    return `${message}.${encodedSignature}`;
}

/**
 * Validate user input from the form
 * @param {object} data - Form data to validate
 * @returns {string[]} Array of validation error messages
 */
export function validateInput(data) {
    const errors = [];
    
    // Project name validation
    if (!data.project_name || !/^[a-zA-Z0-9_-]+$/.test(data.project_name)) {
        errors.push('Project name must contain only alphanumeric characters, hyphens, and underscores');
    }
    
    // Domain validation - accept full URLs or just domain names
    if (!data.domain) {
        errors.push('Please provide a valid domain name or URL');
    } else {
        // Remove protocol if present to validate the domain part
        let domainToCheck = data.domain.replace(/^https?:\/\//, '');
        // Remove trailing slash if present
        domainToCheck = domainToCheck.replace(/\/$/, '');
        // Remove any path, query params, or fragments
        domainToCheck = domainToCheck.split('/')[0].split('?')[0].split('#')[0];
        
        // Check if it's a valid domain format
        if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(domainToCheck) && 
            !/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$/.test(domainToCheck)) {
            errors.push('Please provide a valid domain name or URL');
        }
    }
    
    // Email validation
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Please provide a valid email address');
    }
    
    return errors;
}

/**
 * Clean and normalize domain name
 * @param {string} domain - Domain to clean
 * @returns {string} Cleaned domain name
 */
export function cleanDomain(domain) {
    return domain.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0].split('?')[0].split('#')[0];
}
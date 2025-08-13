/**
 * Cloudflare Workers version of Supabase Configurator
 * Handles form processing and configuration generation
 */

import { INDEX_TEMPLATE, RESULT_TEMPLATE } from './modules/templates.mjs';
import { generateSecureSecret, generatePassword, generateJWT, validateInput } from './modules/utils.mjs';
import { generateEnvFile, generateDeploymentScript, generateDockerCompose } from './modules/generators.mjs';

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        if (path === '/' && request.method === 'GET') {
            return new Response(INDEX_TEMPLATE, {
                headers: { 
                    'Content-Type': 'text/html',
                    ...corsHeaders 
                }
            });
        }

        if (path === '/health' && request.method === 'GET') {
            const testHtml = RESULT_TEMPLATE('TEST_ENV=value', 'version: "3.8"', 'test-project');
            if (testHtml.includes('TEST_ENV=value')) {
                return new Response(JSON.stringify({ 
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    version: '1.0.0'
                }), {
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders 
                    }
                });
            } else {
                return new Response(JSON.stringify({ 
                    status: 'unhealthy',
                    error: 'Template rendering failed'
                }), {
                    status: 500,
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders 
                    }
                });
            }
        }

        // JSON API endpoint for frontend
        if (path === '/api/generate' && request.method === 'POST') {
            const formData = await request.formData();
            const data = Object.fromEntries(formData.entries());

            // Validate input
            const validationErrors = validateInput(data);
            if (validationErrors.length > 0) {
                return new Response(JSON.stringify({ 
                    error: 'Validation failed', 
                    details: validationErrors 
                }), {
                    status: 400,
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders 
                    }
                });
            }

            // Generate secure credentials if not provided
            const config = {
                project_name: data.project_name,
                domain: data.domain,
                email: data.email,
                db_password: data.db_password || generatePassword(32),
                jwt_secret: data.jwt_secret || generateSecureSecret(64)
            };

            // Generate JWT keys if not provided
            if (!data.anon_key || !data.service_key) {
                try {
                    const anonPayload = { role: 'anon', iss: 'supabase' };
                    const servicePayload = { role: 'service_role', iss: 'supabase' };
                    
                    config.anon_key = data.anon_key || await generateJWT(config.jwt_secret, anonPayload);
                    config.service_key = data.service_key || await generateJWT(config.jwt_secret, servicePayload);
                } catch (error) {
                    console.error('JWT generation error:', error);
                    return new Response(JSON.stringify({ 
                        error: 'Failed to generate JWT keys: ' + error.message 
                    }), {
                        status: 500,
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders 
                        }
                    });
                }
            } else {
                config.anon_key = data.anon_key;
                config.service_key = data.service_key;
            }

            // Generate configuration files and return JSON
            try {
                const envContent = generateEnvFile(config);
                const composeContent = generateDockerCompose(config);
                
                return new Response(JSON.stringify({
                    envContent,
                    composeContent,
                    overrideContent: '', // Add override if needed
                    config
                }), {
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders 
                    }
                });

            } catch (error) {
                console.error('Configuration generation error:', error);
                return new Response(JSON.stringify({ 
                    error: 'Configuration generation failed: ' + error.message 
                }), {
                    status: 500,
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders 
                    }
                });
            }
        }

        if (path === '/generate' && request.method === 'POST') {
            const formData = await request.formData();
            const data = Object.fromEntries(formData.entries());

            // Validate input
            const validationErrors = validateInput(data);
            if (validationErrors.length > 0) {
                return new Response(JSON.stringify({ 
                    error: 'Validation failed', 
                    details: validationErrors 
                }), {
                    status: 400,
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders 
                    }
                });
            }

            // Generate secure credentials if not provided
            const config = {
                project_name: data.project_name,
                domain: data.domain,
                email: data.email,
                db_password: data.db_password || generatePassword(32),
                jwt_secret: data.jwt_secret || generateSecureSecret(64)
            };

            // Generate JWT keys if not provided
            if (!data.anon_key || !data.service_key) {
                try {
                    const anonPayload = { role: 'anon', iss: 'supabase' };
                    const servicePayload = { role: 'service_role', iss: 'supabase' };
                    
                    config.anon_key = data.anon_key || await generateJWT(config.jwt_secret, anonPayload);
                    config.service_key = data.service_key || await generateJWT(config.jwt_secret, servicePayload);
                } catch (error) {
                    console.error('JWT generation error:', error);
                    return new Response(JSON.stringify({ 
                        error: 'Failed to generate JWT keys: ' + error.message 
                    }), {
                        status: 500,
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders 
                        }
                    });
                }
            } else {
                config.anon_key = data.anon_key;
                config.service_key = data.service_key;
            }

            // Generate configuration files
            try {
                const envContent = generateEnvFile(config);
                const composeContent = generateDockerCompose(config);
                const resultHtml = RESULT_TEMPLATE(envContent, composeContent, config.project_name);

                return new Response(resultHtml, {
                    headers: { 
                        'Content-Type': 'text/html',
                        ...corsHeaders 
                    }
                });

            } catch (error) {
                console.error('Configuration generation error:', error);
                return new Response(JSON.stringify({ 
                    error: 'Configuration generation failed: ' + error.message 
                }), {
                    status: 500,
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders 
                    }
                });
            }
        }

        if (path === '/deploy' && request.method === 'POST') {
            try {
                const deploymentData = await request.json();

                // Validate required deployment parameters
                const { vpsHost, vpsUser, vpsPort, envContent, composeContent } = deploymentData;
                if (!vpsHost || !vpsUser || !vpsPort || !envContent || !composeContent) {
                    return new Response(JSON.stringify({ 
                        error: 'Missing required deployment parameters' 
                    }), {
                        status: 400,
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders 
                        }
                    });
                }

                // Generate deployment script
                const deploymentScript = generateDeploymentScript(deploymentData);

                return new Response(JSON.stringify({ 
                    success: true,
                    message: 'Deployment script generated successfully',
                    script: deploymentScript,
                    commands: [
                        'Save the script to deploy.sh',
                        'Make it executable: chmod +x deploy.sh', 
                        'Run: ./deploy.sh',
                        'Monitor progress and check for any errors'
                    ]
                }), {
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders 
                    }
                });

            } catch (error) {
                console.error('Deployment error:', error);
                return new Response(JSON.stringify({ 
                    error: 'Deployment failed: ' + error.message 
                }), {
                    status: 500,
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders 
                    }
                });
            }
        }

        // 404 for unknown routes
        return new Response('Not Found', { 
            status: 404,
            headers: corsHeaders 
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error' 
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders 
            }
        });
    }
}

// ES modules export for Cloudflare Workers
export default {
    fetch: handleRequest
};
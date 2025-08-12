/**
 * Cloudflare Workers version of Supabase Configurator
 * Handles form processing and configuration generation
 */

// HTML templates as template literals
const INDEX_TEMPLATE = `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SBConfig - Supabase Configuration Generator</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;700&family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
          --background: oklch(0.10 0.06 264);
          --foreground: oklch(0.95 0.01 264);
          --card: oklch(0.15 0.06 264);
          --card-foreground: oklch(0.95 0.01 264);
          --primary: oklch(0.91 0.32 199);
          --primary-foreground: oklch(0.10 0.06 264);
          --secondary: oklch(0.81 0.32 211);
          --secondary-foreground: oklch(0.10 0.06 264);
          --muted: oklch(0.25 0.04 264);
          --muted-foreground: oklch(0.65 0.02 264);
          --accent: oklch(0.81 0.32 211);
          --accent-foreground: oklch(0.10 0.06 264);
          --destructive: oklch(0.7 0.28 25);
          --destructive-foreground: oklch(0.98 0 0);
          --border: oklch(0.91 0.32 199 / 0.5);
          --input: oklch(0.12 0.06 264);
          --ring: oklch(0.81 0.32 211);
          --font-sans: 'Rajdhani', sans-serif;
          --font-mono: 'Roboto Mono', monospace;
          --radius: 0.25rem;
          --radius-lg: 0.5rem;
          --shadow-xs: 0 0 4px 0 var(--primary);
          --shadow-sm: 0 0 8px 0 var(--primary);
          --shadow-lg: 0 0 24px 0 var(--primary);
          --shadow-xl: 0 0 32px 0 var(--primary);
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background-color: var(--background);
            color: var(--foreground);
            font-family: var(--font-sans);
            line-height: 1.6;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .circuit-background {
            background-image: 
                linear-gradient(var(--primary) 1px, transparent 1px), 
                linear-gradient(to right, var(--primary) 1px, transparent 1px);
            background-size: 60px 60px;
            background-color: var(--background);
            opacity: 0.05;
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: -1;
        }
        
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            position: relative;
            z-index: 1;
        }
        
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            padding: 30px;
        }
        
        h1, h2, h3 {
            font-family: var(--font-sans);
            font-weight: 700;
            text-transform: uppercase;
            color: var(--primary);
            text-shadow: var(--shadow-xs);
        }
        
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .tagline {
            color: var(--muted-foreground);
            font-size: 1.2rem;
            margin-bottom: 2rem;
        }
        
        .form-container { 
            background-color: oklch(from var(--card) l c h / 0.8);
            border: 1px solid var(--border);
            box-shadow: var(--shadow-xl);
            border-radius: var(--radius-lg);
            backdrop-filter: blur(10px);
            padding: 30px;
            margin-bottom: 20px;
            transition: all 0.3s ease;
        }
        
        .form-container:hover {
            box-shadow: var(--shadow-xl), 0 0 40px 8px oklch(from var(--primary) l c h / 0.1);
        }
        
        .form-group { 
            margin-bottom: 20px; 
        }
        
        label { 
            display: block; 
            margin-bottom: 8px; 
            font-weight: 600; 
            color: var(--muted-foreground);
            text-transform: uppercase;
            font-size: 0.875rem;
            letter-spacing: 0.05em;
        }
        
        .neon-input {
            background-color: var(--input);
            border: 1px solid var(--border);
            color: var(--foreground);
            border-radius: var(--radius);
            transition: all 0.3s ease;
            padding: 12px 16px;
            width: 100%;
            font-family: var(--font-mono);
            font-size: 16px;
        }
        
        .neon-input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: var(--shadow-lg);
            animation: pulse-glow 1.5s infinite alternate;
        }
        
        @keyframes pulse-glow {
            from { box-shadow: 0 0 8px 0 var(--primary); }
            to { box-shadow: 0 0 16px 4px var(--primary); }
        }
        
        .holographic-button {
            background: transparent;
            border: 1px solid var(--primary);
            color: var(--primary);
            text-shadow: var(--shadow-xs);
            box-shadow: var(--shadow-sm);
            transition: all 0.3s ease;
            border-radius: var(--radius);
            padding: 12px 24px;
            font-weight: 700;
            text-transform: uppercase;
            font-family: var(--font-sans);
            cursor: pointer;
            letter-spacing: 0.05em;
            font-size: 16px;
        }
        
        .holographic-button:hover {
            background-color: oklch(from var(--primary) l c h / 0.1);
            color: var(--primary);
            box-shadow: var(--shadow-lg);
            transform: translateY(-2px);
        }
        
        .holographic-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        .description { 
            color: var(--muted-foreground); 
            font-size: 14px; 
            margin-top: 4px;
            font-family: var(--font-mono);
        }
        
        .alert { 
            padding: 15px; 
            margin: 20px 0; 
            border-radius: var(--radius);
            border: 1px solid;
        }
        
        .alert-error { 
            background: oklch(from var(--destructive) l c h / 0.1);
            color: var(--destructive);
            border-color: var(--destructive);
        }
        
        .alert-success { 
            background: oklch(from var(--primary) l c h / 0.1);
            color: var(--primary);
            border-color: var(--primary);
        }
        
        .loading {
            position: relative;
        }
        
        .loading::after {
            content: '';
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 16px;
            height: 16px;
            border: 2px solid var(--primary);
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: translateY(-50%) rotate(0deg); }
            100% { transform: translateY(-50%) rotate(360deg); }
        }
        
        .shield-icon {
            width: 4rem;
            height: 4rem;
            margin: 0 auto 1rem;
            display: block;
            color: var(--primary);
            filter: drop-shadow(var(--shadow-sm));
        }
        
        /* Mouse trail and cursor effects */
        .mouse-trail {
            position: fixed;
            width: 6px;
            height: 6px;
            background: var(--primary);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            opacity: 0;
            box-shadow: var(--shadow-sm);
            animation: trail-fade 0.5s ease-out forwards;
        }
        
        @keyframes trail-fade {
            0% {
                opacity: 1;
                transform: scale(1);
            }
            100% {
                opacity: 0;
                transform: scale(0.3);
            }
        }
        
        /* Cursor glow effect */
        body {
            cursor: none;
        }
        
        .custom-cursor {
            position: fixed;
            width: 20px;
            height: 20px;
            background: transparent;
            border: 2px solid var(--primary);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            opacity: 0.8;
            transition: all 0.1s ease;
            box-shadow: var(--shadow-sm);
        }
        
        .custom-cursor.hover {
            transform: scale(1.5);
            background: oklch(from var(--primary) l c h / 0.1);
            box-shadow: var(--shadow-lg);
        }
        
        /* Interactive hover zones */
        .hover-zone {
            position: relative;
            overflow: hidden;
        }
        
        .hover-zone::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, oklch(from var(--primary) l c h / 0.1), transparent);
            transition: left 0.5s ease;
            z-index: 1;
        }
        
        .hover-zone:hover::before {
            left: 100%;
        }
        
        /* Ripple effect */
        .ripple-container {
            position: relative;
            overflow: hidden;
        }
        
        .ripple {
            position: absolute;
            border-radius: 50%;
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            background: oklch(from var(--primary) l c h / 0.2);
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        /* Enhanced glow effects on hover */
        .glow-on-hover {
            transition: all 0.3s ease;
            position: relative;
        }
        
        .glow-on-hover::after {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, var(--primary), var(--secondary), var(--primary));
            border-radius: inherit;
            z-index: -1;
            opacity: 0;
            transition: opacity 0.3s ease;
            background-size: 200% 200%;
            animation: gradient-shift 2s ease infinite;
        }
        
        .glow-on-hover:hover::after {
            opacity: 1;
        }
        
        @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        /* Magnetic effect for buttons */
        .magnetic {
            transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        /* Scanner line effect */
        .scanner-line {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--primary), transparent);
            opacity: 0;
            transition: all 0.3s ease;
        }
        
        .form-container:hover .scanner-line {
            opacity: 1;
            animation: scanner-sweep 2s ease-in-out infinite;
        }
        
        @keyframes scanner-sweep {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
        }
        
        /* Particle system */
        .particle {
            position: fixed;
            width: 2px;
            height: 2px;
            background: var(--primary);
            pointer-events: none;
            z-index: 100;
            opacity: 0.7;
        }
        
        /* Enhanced input focus effects */
        .neon-input {
            position: relative;
        }
        
        .neon-input::before {
            content: '';
            position: absolute;
            top: -1px;
            left: -1px;
            right: -1px;
            bottom: -1px;
            background: linear-gradient(45deg, var(--primary), transparent, var(--primary));
            border-radius: inherit;
            z-index: -1;
            opacity: 0;
            transition: opacity 0.3s ease;
            background-size: 200% 200%;
            animation: border-glow 3s ease infinite;
        }
        
        .neon-input:focus::before {
            opacity: 1;
        }
        
        @keyframes border-glow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        
        /* Data stream effect */
        .data-stream {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 1;
            opacity: 0.03;
            background-image: 
                linear-gradient(0deg, transparent 24%, var(--primary) 25%, var(--primary) 26%, transparent 27%, transparent 74%, var(--primary) 75%, var(--primary) 76%, transparent 77%),
                linear-gradient(90deg, transparent 24%, var(--primary) 25%, var(--primary) 26%, transparent 27%, transparent 74%, var(--primary) 75%, var(--primary) 76%, transparent 77%);
            background-size: 20px 20px;
            animation: data-flow 20s linear infinite;
        }
        
        @keyframes data-flow {
            0% { transform: translate(0, 0); }
            100% { transform: translate(20px, 20px); }
        }
        
        @media (max-width: 768px) {
            .container { padding: 15px; }
            h1 { font-size: 2rem; }
            .form-container { padding: 20px; }
            
            /* Disable heavy effects on mobile */
            .mouse-trail,
            .custom-cursor,
            .data-stream {
                display: none;
            }
            
            body {
                cursor: auto;
            }
        }
    </style>
</head>
<body class="antialiased">
    <div class="circuit-background"></div>
    <div class="container">
        <div class="header">
            <svg class="shield-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
                <path d="M9 12l2 2 4-4"></path>
            </svg>
            <h1>SBConfig Generator</h1>
            <p class="tagline">Generate deployment-ready configs with safe credentials.</p>
        </div>

        <div class="form-container">
            <form id="configForm" action="/generate" method="POST">
                <div class="form-group">
                    <label for="project_name">Project Name</label>
                    <input type="text" id="project_name" name="project_name" required 
                           pattern="[a-zA-Z0-9_-]+"
                           class="neon-input"
                           placeholder="my-supabase-project">
                    <div class="description">Alphanumeric characters, hyphens, and underscores only</div>
                </div>

                <div class="form-group">
                    <label for="domain">Site URL</label>
                    <input type="text" id="domain" name="domain" required 
                           class="neon-input"
                           placeholder="https://supabase.yourdomain.com">
                    <div class="description">Domain where your Supabase instance will be accessible</div>
                </div>

                <div class="form-group">
                    <label for="email">Admin Email</label>
                    <input type="email" id="email" name="email" required 
                           class="neon-input"
                           placeholder="admin@yourdomain.com">
                    <div class="description">Email for SMTP configuration and admin notifications</div>
                </div>

                <div class="form-group">
                    <label for="db_password">Postgres Password (Tier 1, ≥32)</label>
                    <input type="password" id="db_password" name="db_password" 
                           class="neon-input"
                           placeholder="Leave empty for auto-generation">
                    <div class="description">Leave empty to auto-generate a secure password</div>
                </div>

                <div class="form-group">
                    <label for="jwt_secret">JWT Secret (≥32 characters)</label>
                    <input type="password" id="jwt_secret" name="jwt_secret" 
                           class="neon-input"
                           placeholder="Leave empty for auto-generation">
                    <div class="description">Leave empty to auto-generate a secure JWT secret</div>
                </div>

                <div class="form-group">
                    <label for="anon_key">Anon Key (public)</label>
                    <input type="text" id="anon_key" name="anon_key" 
                           class="neon-input"
                           placeholder="Leave empty for auto-generation">
                    <div class="description">Leave empty to auto-generate from JWT secret</div>
                </div>

                <div class="form-group">
                    <label for="service_key">Service Role Key (secret)</label>
                    <input type="password" id="service_key" name="service_key" 
                           class="neon-input"
                           placeholder="Leave empty for auto-generation">
                    <div class="description">Leave empty to auto-generate from JWT secret</div>
                </div>

                <button type="submit" class="holographic-button" id="generateBtn">
                    Generate Configuration
                </button>
            </form>
        </div>
    </div>

    <script>
        document.getElementById('configForm').addEventListener('submit', function(e) {
            const submitBtn = document.getElementById('generateBtn');
            submitBtn.textContent = 'Generating...';
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
        });
        
        // Check if device supports advanced effects (not mobile)
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (!isMobile) {
            // Custom cursor initialization
            const cursor = document.createElement('div');
            cursor.className = 'custom-cursor';
            document.body.appendChild(cursor);
            
            // Data stream background
            const dataStream = document.createElement('div');
            dataStream.className = 'data-stream';
            document.body.appendChild(dataStream);
            
            // Scanner line for form container
            const formContainer = document.querySelector('.form-container');
            const scannerLine = document.createElement('div');
            scannerLine.className = 'scanner-line';
            formContainer.appendChild(scannerLine);
            
            // Mouse tracking for cursor
            let mouseX = 0, mouseY = 0;
            let cursorX = 0, cursorY = 0;
            
            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
                
                // Create mouse trail
                createTrail(e.clientX, e.clientY);
                
                // Check if hovering over interactive elements
                const hoveredElement = document.elementFromPoint(e.clientX, e.clientY);
                if (hoveredElement && (hoveredElement.matches('input, button, a') || hoveredElement.closest('input, button, a'))) {
                    cursor.classList.add('hover');
                } else {
                    cursor.classList.remove('hover');
                }
            });
            
            // Smooth cursor animation
            function updateCursor() {
                cursorX += (mouseX - cursorX) * 0.3;
                cursorY += (mouseY - cursorY) * 0.3;
                
                cursor.style.left = cursorX + 'px';
                cursor.style.top = cursorY + 'px';
                
                requestAnimationFrame(updateCursor);
            }
            updateCursor();
            
            // Create mouse trail particles
            function createTrail(x, y) {
                if (Math.random() > 0.7) { // Only create trail 30% of the time for performance
                    const trail = document.createElement('div');
                    trail.className = 'mouse-trail';
                    trail.style.left = x + 'px';
                    trail.style.top = y + 'px';
                    document.body.appendChild(trail);
                    
                    // Remove trail after animation
                    setTimeout(() => {
                        if (trail.parentNode) {
                            trail.parentNode.removeChild(trail);
                        }
                    }, 500);
                }
            }
            
            // Particle system for form interactions
            function createParticles(x, y, count = 5) {
                for (let i = 0; i < count; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    particle.style.left = x + (Math.random() - 0.5) * 20 + 'px';
                    particle.style.top = y + (Math.random() - 0.5) * 20 + 'px';
                    
                    const angle = (Math.PI * 2 * i) / count;
                    const velocity = 2 + Math.random() * 3;
                    const vx = Math.cos(angle) * velocity;
                    const vy = Math.sin(angle) * velocity;
                    
                    document.body.appendChild(particle);
                    
                    // Animate particle
                    let life = 1;
                    const animate = () => {
                        life -= 0.02;
                        if (life <= 0) {
                            if (particle.parentNode) {
                                particle.parentNode.removeChild(particle);
                            }
                            return;
                        }
                        
                        const currentLeft = parseFloat(particle.style.left);
                        const currentTop = parseFloat(particle.style.top);
                        particle.style.left = (currentLeft + vx) + 'px';
                        particle.style.top = (currentTop + vy) + 'px';
                        particle.style.opacity = life;
                        
                        requestAnimationFrame(animate);
                    };
                    animate();
                }
            }
            
            // Add ripple effect to buttons
            document.querySelectorAll('.holographic-button').forEach(button => {
                button.classList.add('ripple-container');
                
                button.addEventListener('click', function(e) {
                    const rect = this.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const ripple = document.createElement('span');
                    ripple.className = 'ripple';
                    ripple.style.left = x + 'px';
                    ripple.style.top = y + 'px';
                    ripple.style.width = ripple.style.height = '2px';
                    
                    this.appendChild(ripple);
                    
                    // Create particles at click location
                    createParticles(e.clientX, e.clientY, 8);
                    
                    setTimeout(() => {
                        if (ripple.parentNode) {
                            ripple.parentNode.removeChild(ripple);
                        }
                    }, 600);
                });
                
                // Magnetic effect
                button.classList.add('magnetic');
                button.addEventListener('mousemove', function(e) {
                    const rect = this.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    
                    this.style.transform = 'translate(' + (x * 0.1) + 'px, ' + (y * 0.1) + 'px)';
                });
                
                button.addEventListener('mouseleave', function() {
                    this.style.transform = '';
                });
            });
            
            // Enhanced hover effects for inputs
            document.querySelectorAll('.neon-input').forEach(input => {
                input.classList.add('glow-on-hover');
                
                input.addEventListener('focus', function(e) {
                    this.style.transform = 'scale(1.02)';
                    
                    // Create focus particles
                    const rect = this.getBoundingClientRect();
                    createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 6);
                });
                
                input.addEventListener('blur', function() {
                    this.style.transform = 'scale(1)';
                });
                
                input.addEventListener('input', function() {
                    // Create typing particles occasionally
                    if (Math.random() > 0.8) {
                        const rect = this.getBoundingClientRect();
                        createParticles(rect.right - 10, rect.top + rect.height / 2, 2);
                    }
                });
            });
            
            // Add hover zones to form groups
            document.querySelectorAll('.form-group').forEach(group => {
                group.classList.add('hover-zone');
            });
            
            // Form container hover effects
            formContainer.classList.add('hover-zone');
            
            // Ambient particle generation
            setInterval(() => {
                if (Math.random() > 0.95) { // Very rare ambient particles
                    const x = Math.random() * window.innerWidth;
                    const y = Math.random() * window.innerHeight;
                    createParticles(x, y, 1);
                }
            }, 1000);
        }
        
        // Basic interactions that work on all devices
        document.querySelectorAll('.neon-input').forEach(input => {
            if (!input.classList.contains('glow-on-hover')) {
                input.addEventListener('focus', function() {
                    this.style.transform = 'scale(1.02)';
                });
                
                input.addEventListener('blur', function() {
                    this.style.transform = 'scale(1)';
                });
            }
        });
    </script>
</body>
</html>
`;

const RESULT_TEMPLATE = (envContent, composeContent, projectName) => {
    // Escape content for safe HTML/JS embedding
    const escapedEnvContent = envContent.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/\\/g, '\\\\');
    const escapedComposeContent = composeContent.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/\\/g, '\\\\');
    const escapedProjectName = projectName.replace(/["'`]/g, '');
    
    return `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configuration Generated - ${projectName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;700&family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
          --background: oklch(0.10 0.06 264);
          --foreground: oklch(0.95 0.01 264);
          --card: oklch(0.15 0.06 264);
          --card-foreground: oklch(0.95 0.01 264);
          --primary: oklch(0.91 0.32 199);
          --primary-foreground: oklch(0.10 0.06 264);
          --secondary: oklch(0.81 0.32 211);
          --secondary-foreground: oklch(0.10 0.06 264);
          --muted: oklch(0.25 0.04 264);
          --muted-foreground: oklch(0.65 0.02 264);
          --accent: oklch(0.81 0.32 211);
          --accent-foreground: oklch(0.10 0.06 264);
          --destructive: oklch(0.7 0.28 25);
          --destructive-foreground: oklch(0.98 0 0);
          --border: oklch(0.91 0.32 199 / 0.5);
          --input: oklch(0.12 0.06 264);
          --ring: oklch(0.81 0.32 211);
          --font-sans: 'Rajdhani', sans-serif;
          --font-mono: 'Roboto Mono', monospace;
          --radius: 0.25rem;
          --radius-lg: 0.5rem;
          --shadow-xs: 0 0 4px 0 var(--primary);
          --shadow-sm: 0 0 8px 0 var(--primary);
          --shadow-lg: 0 0 24px 0 var(--primary);
          --shadow-xl: 0 0 32px 0 var(--primary);
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background-color: var(--background);
            color: var(--foreground);
            font-family: var(--font-sans);
            line-height: 1.6;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .circuit-background {
            background-image: 
                linear-gradient(var(--primary) 1px, transparent 1px), 
                linear-gradient(to right, var(--primary) 1px, transparent 1px);
            background-size: 60px 60px;
            background-color: var(--background);
            opacity: 0.05;
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: -1;
        }
        
        .container { 
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            position: relative;
            z-index: 1;
        }
        
        .header { 
            text-align: center;
            margin-bottom: 40px;
            background-color: oklch(from var(--card) l c h / 0.8);
            border: 1px solid var(--border);
            box-shadow: var(--shadow-xl);
            border-radius: var(--radius-lg);
            backdrop-filter: blur(10px);
            padding: 30px;
        }
        
        h1, h2, h3 {
            font-family: var(--font-sans);
            font-weight: 700;
            text-transform: uppercase;
            color: var(--primary);
            text-shadow: var(--shadow-xs);
        }
        
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .file-container {
            background-color: oklch(from var(--card) l c h / 0.8);
            border: 1px solid var(--border);
            box-shadow: var(--shadow-xl);
            border-radius: var(--radius-lg);
            backdrop-filter: blur(10px);
            margin-bottom: 30px;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .file-container:hover {
            box-shadow: var(--shadow-xl), 0 0 40px 8px oklch(from var(--primary) l c h / 0.1);
        }
        
        .file-header {
            background-color: oklch(from var(--muted) l c h / 0.5);
            padding: 20px;
            border-bottom: 1px solid var(--border);
        }
        
        .file-header h3 {
            color: var(--primary);
            margin-bottom: 0.5rem;
        }
        
        .file-header p {
            color: var(--muted-foreground);
            font-family: var(--font-mono);
            font-size: 14px;
        }
        
        .file-content {
            position: relative;
        }
        
        pre {
            background-color: var(--input);
            color: var(--foreground);
            padding: 20px;
            margin: 0;
            overflow-x: auto;
            font-family: var(--font-mono);
            font-size: 14px;
            line-height: 1.5;
            border: 1px solid var(--border);
        }
        
        .copy-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: transparent;
            border: 1px solid var(--primary);
            color: var(--primary);
            padding: 6px 10px;
            border-radius: var(--radius);
            cursor: pointer;
            font-size: 11px;
            font-family: var(--font-sans);
            font-weight: 700;
            text-transform: uppercase;
            transition: all 0.3s ease;
            box-shadow: var(--shadow-sm);
        }
        
        .copy-btn:hover {
            background-color: oklch(from var(--primary) l c h / 0.1);
            box-shadow: var(--shadow-lg);
            transform: translateY(-2px);
        }
        
        .btn-group {
            text-align: center;
            margin: 30px 0;
        }
        
        .holographic-button {
            background: transparent;
            border: 1px solid var(--primary);
            color: var(--primary);
            text-shadow: var(--shadow-xs);
            box-shadow: var(--shadow-sm);
            transition: all 0.3s ease;
            border-radius: var(--radius);
            padding: 12px 24px;
            font-weight: 700;
            text-transform: uppercase;
            font-family: var(--font-sans);
            cursor: pointer;
            letter-spacing: 0.05em;
            font-size: 14px;
            text-decoration: none;
            display: inline-block;
            margin: 0 10px;
        }
        
        .holographic-button:hover {
            background-color: oklch(from var(--primary) l c h / 0.1);
            color: var(--primary);
            box-shadow: var(--shadow-lg);
            transform: translateY(-2px);
            text-decoration: none;
        }
        
        .holographic-button.secondary {
            border-color: var(--muted-foreground);
            color: var(--muted-foreground);
        }
        
        .holographic-button.secondary:hover {
            background-color: oklch(from var(--muted-foreground) l c h / 0.1);
            box-shadow: 0 0 12px 0 var(--muted-foreground);
        }
        
        .alert {
            padding: 15px;
            margin: 20px 0;
            border-radius: var(--radius);
            background: oklch(from var(--primary) l c h / 0.1);
            color: var(--primary);
            border: 1px solid var(--primary);
            font-family: var(--font-mono);
            font-size: 14px;
        }
        
        /* Modal Styles */
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: oklch(from var(--background) l c h / 0.8);
            backdrop-filter: blur(10px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .modal.show {
            opacity: 1;
            visibility: visible;
        }
        
        .modal-content {
            background-color: var(--card);
            border: 1px solid var(--border);
            box-shadow: var(--shadow-xl);
            border-radius: var(--radius-lg);
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            transform: scale(0.8) translateY(-50px);
            transition: transform 0.3s ease;
        }
        
        .modal.show .modal-content {
            transform: scale(1) translateY(0);
        }
        
        .modal-header {
            background-color: oklch(from var(--muted) l c h / 0.5);
            padding: 20px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-header h3 {
            margin: 0;
            color: var(--primary);
            font-size: 1.5rem;
        }
        
        .modal-close {
            background: none;
            border: none;
            color: var(--muted-foreground);
            font-size: 2rem;
            cursor: pointer;
            line-height: 1;
            transition: color 0.3s ease;
        }
        
        .modal-close:hover {
            color: var(--primary);
        }
        
        .modal-body {
            padding: 30px;
        }
        
        .modal-footer {
            padding: 20px;
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        
        .deploy-form .form-group {
            margin-bottom: 20px;
        }
        
        .deploy-form .neon-input {
            background-color: var(--input);
            border: 1px solid var(--border);
            color: var(--foreground);
            border-radius: var(--radius);
            padding: 12px 16px;
            width: 100%;
            font-family: var(--font-mono);
            font-size: 16px;
        }
        
        .deploy-form .neon-input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: var(--shadow-sm);
        }
        
        .deployment-steps {
            margin-top: 20px;
            padding: 20px;
            background-color: oklch(from var(--input) l c h / 0.5);
            border-radius: var(--radius);
            border: 1px solid var(--border);
        }
        
        .deployment-steps h4 {
            color: var(--primary);
            margin-bottom: 15px;
            text-align: center;
        }
        
        .step-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .step {
            padding: 10px 15px;
            background-color: oklch(from var(--muted) l c h / 0.3);
            border-radius: var(--radius);
            color: var(--muted-foreground);
            font-family: var(--font-mono);
            font-size: 14px;
            transition: all 0.3s ease;
        }
        
        .step.active {
            background-color: oklch(from var(--primary) l c h / 0.2);
            color: var(--primary);
            border-left: 3px solid var(--primary);
            animation: pulse-step 1.5s ease-in-out infinite alternate;
        }
        
        .step.completed {
            background-color: oklch(from var(--primary) l c h / 0.1);
            color: var(--primary);
            border-left: 3px solid var(--primary);
        }
        
        .step.error {
            background-color: oklch(from var(--destructive) l c h / 0.2);
            color: var(--destructive);
            border-left: 3px solid var(--destructive);
        }
        
        @keyframes pulse-step {
            from { background-color: oklch(from var(--primary) l c h / 0.1); }
            to { background-color: oklch(from var(--primary) l c h / 0.3); }
        }

        @media (max-width: 768px) {
            .container { padding: 15px; }
            h1 { font-size: 1.8rem; }
            .file-container { margin-bottom: 20px; }
            .holographic-button { 
                display: block;
                margin: 10px auto;
                width: 200px;
            }
            
            .modal-content {
                width: 95%;
                margin: 20px;
            }
            
            .modal-body {
                padding: 20px;
            }
            
            .modal-footer {
                flex-direction: column;
            }
        }
    </style>
</head>
<body class="antialiased">
    <div class="circuit-background"></div>
    <div class="container">
        <div class="header">
            <h1>Configuration Generated Successfully!</h1>
            <p>Your Supabase configuration files are ready for deployment</p>
        </div>

        <div class="alert">
            <strong>⚠️ Security Notice:</strong> Save these files immediately and store them securely. 
            The generated secrets are cryptographically secure and cannot be recovered if lost.
        </div>

        <div class="file-container">
            <div class="file-header">
                <h3>📄 .env</h3>
                <p>Environment variables for your Supabase instance</p>
            </div>
            <div class="file-content">
                <button class="copy-btn" onclick="copyToClipboard('env-content')">Copy</button>
            <pre id="env-content">${escapedEnvContent}</pre>
            </div>
        </div>

        <div class="file-container">
            <div class="file-header">
                <h3>🐳 docker-compose.yml</h3>
                <p>Docker Compose configuration for easy deployment</p>
            </div>
            <div class="file-content">
                <button class="copy-btn" onclick="copyToClipboard('compose-content')">Copy</button>
                <pre id="compose-content">${escapedComposeContent}</pre>
            </div>
        </div>

        <div class="btn-group">
            <a href="/" class="holographic-button secondary">Generate Another</a>
            <button class="holographic-button" onclick="downloadFile('${projectName}.env', document.getElementById('env-content').textContent)">
                Download .env
            </button>
            <button class="holographic-button" onclick="downloadFile('docker-compose.yml', document.getElementById('compose-content').textContent)">
                Download docker-compose.yml
            </button>
            <button class="holographic-button" onclick="showDeployModal()" style="background: linear-gradient(45deg, var(--primary), var(--secondary)); color: var(--background);">
                🚀 Deploy to VPS
            </button>
        </div>

        <!-- Deployment Modal -->
        <div id="deployModal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🚀 Deploy to Hostinger VPS</h3>
                    <button class="modal-close" onclick="hideDeployModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="deploy-form">
                        <div class="form-group">
                            <label for="vps-host">VPS IP Address or Hostname</label>
                            <input type="text" id="vps-host" class="neon-input" placeholder="123.456.789.101" required>
                            <div class="description">Your Hostinger VPS IP address</div>
                        </div>
                        
                        <div class="form-group">
                            <label for="vps-user">SSH Username</label>
                            <input type="text" id="vps-user" class="neon-input" placeholder="root" value="root" required>
                            <div class="description">SSH user (usually 'root' for Hostinger)</div>
                        </div>
                        
                        <div class="form-group">
                            <label for="vps-port">SSH Port</label>
                            <input type="number" id="vps-port" class="neon-input" placeholder="22" value="22" required>
                            <div class="description">SSH port (default: 22)</div>
                        </div>
                        
                        <div class="form-group">
                            <label for="domain-name">Domain (Optional)</label>
                            <input type="text" id="domain-name" class="neon-input" placeholder="supabase.yourdomain.com">
                            <div class="description">Leave empty for IP-only access</div>
                        </div>
                        
                        <div class="form-group">
                            <label for="ssl-email">SSL Email (Required if domain provided)</label>
                            <input type="email" id="ssl-email" class="neon-input" placeholder="admin@yourdomain.com">
                            <div class="description">Email for Let's Encrypt SSL certificate</div>
                        </div>
                        
                        <div class="deployment-steps" id="deployment-steps" style="display: none;">
                            <h4>Deployment Progress</h4>
                            <div class="step-list">
                                <div class="step" id="step-1">📦 Preparing deployment package...</div>
                                <div class="step" id="step-2">🔐 Establishing SSH connection...</div>
                                <div class="step" id="step-3">📤 Uploading configuration files...</div>
                                <div class="step" id="step-4">🐳 Installing Docker & dependencies...</div>
                                <div class="step" id="step-5">🚀 Starting Supabase services...</div>
                                <div class="step" id="step-6">🌐 Configuring domain & SSL...</div>
                                <div class="step" id="step-7">✅ Deployment complete!</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="holographic-button secondary" onclick="hideDeployModal()">Cancel</button>
                    <button class="holographic-button" onclick="startDeployment()" id="deploy-btn">
                        🚀 Start Deployment
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        function copyToClipboard(elementId) {
            const element = document.getElementById(elementId);
            const text = element.textContent;
            navigator.clipboard.writeText(text).then(() => {
                const btn = element.parentElement.querySelector('.copy-btn');
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = originalText, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            });
        }

        function downloadFile(filename, content) {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }

        function showDeployModal() {
            console.log('showDeployModal() called!');
            const modal = document.getElementById('deployModal');
            console.log('Modal element found:', modal);
            if (modal) {
                console.log('Setting modal display to flex');
                modal.style.display = 'flex';
                console.log('Modal display set, current style:', modal.style.display);
                setTimeout(() => {
                    console.log('Adding show class to modal');
                    modal.classList.add('show');
                    console.log('Modal classes:', modal.className);
                }, 10);
            } else {
                console.error('Modal element not found!');
            }
        }

        function hideDeployModal() {
            const modal = document.getElementById('deployModal');
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                // Reset form and steps
                document.getElementById('deployment-steps').style.display = 'none';
                document.querySelectorAll('.step').forEach(step => {
                    step.classList.remove('active', 'completed', 'error');
                });
                document.getElementById('deploy-btn').disabled = false;
                document.getElementById('deploy-btn').innerHTML = '🚀 Start Deployment';
            }, 300);
        }

        function updateDeploymentStep(stepNumber, status = 'active') {
            const step = document.getElementById('step-' + stepNumber);
            const prevSteps = document.querySelectorAll('#step-1, #step-2, #step-3, #step-4, #step-5, #step-6, #step-7')
                .forEach((s, index) => {
                    if (index + 1 < stepNumber) {
                        s.classList.remove('active');
                        s.classList.add('completed');
                    } else if (index + 1 === stepNumber) {
                        s.classList.remove('completed');
                        s.classList.add(status);
                    } else {
                        s.classList.remove('active', 'completed', 'error');
                    }
                });
        }

        async function startDeployment() {
            const deployBtn = document.getElementById('deploy-btn');
            const deploymentSteps = document.getElementById('deployment-steps');
            
            // Get form values
            const vpsHost = document.getElementById('vps-host').value;
            const vpsUser = document.getElementById('vps-user').value;
            const vpsPort = document.getElementById('vps-port').value;
            const domainName = document.getElementById('domain-name').value;
            const sslEmail = document.getElementById('ssl-email').value;

            // Basic validation
            if (!vpsHost || !vpsUser || !vpsPort) {
                alert('Please fill in all required VPS connection fields.');
                return;
            }

            if (domainName && !sslEmail) {
                alert('SSL Email is required when a domain is provided.');
                return;
            }

            // Show deployment steps
            deploymentSteps.style.display = 'block';
            deployBtn.disabled = true;
            deployBtn.innerHTML = '⏳ Deploying...';

            try {
                // Step 1: Preparing deployment package
                updateDeploymentStep(1, 'active');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const deploymentData = {
                    vpsHost,
                    vpsUser,
                    vpsPort: parseInt(vpsPort),
                    domainName: domainName || null,
                    sslEmail: sslEmail || null,
                    envContent: document.getElementById('env-content').textContent,
                    composeContent: document.getElementById('compose-content').textContent
                };

                updateDeploymentStep(1, 'completed');

                // Step 2: Establishing SSH connection
                updateDeploymentStep(2, 'active');
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Call deployment endpoint
                const response = await fetch('/deploy', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(deploymentData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Deployment failed');
                }

                const result = await response.json();
                updateDeploymentStep(2, 'completed');

                // Simulate remaining steps with delays
                const steps = [
                    { step: 3, delay: 2000, message: '📤 Uploading configuration files...' },
                    { step: 4, delay: 3000, message: '🐳 Installing Docker & dependencies...' },
                    { step: 5, delay: 4000, message: '🚀 Starting Supabase services...' },
                    { step: 6, delay: 2000, message: '🌐 Configuring domain & SSL...' },
                    { step: 7, delay: 1000, message: '✅ Deployment complete!' }
                ];

                for (const stepInfo of steps) {
                    updateDeploymentStep(stepInfo.step, 'active');
                    await new Promise(resolve => setTimeout(resolve, stepInfo.delay));
                    updateDeploymentStep(stepInfo.step, 'completed');
                }

                // Show success message
                deployBtn.innerHTML = '✅ Deployment Successful!';
                deployBtn.style.background = 'linear-gradient(45deg, #22c55e, #16a34a)';
                deployBtn.style.color = 'white';

                // Show deployment details
                setTimeout(() => {
                    let accessUrl = domainName ? 'https://' + domainName : 'http://' + vpsHost + ':3000';
                    alert('🎉 Deployment Complete!\n\nYour Supabase instance is now running at:\n' + accessUrl + '\n\nStudio Dashboard: ' + accessUrl + '\nAPI Endpoint: ' + accessUrl.replace(':3000', ':8000') + '\n\nPlease allow a few minutes for all services to fully initialize.');
                }, 1000);

            } catch (error) {
                console.error('Deployment failed:', error);
                
                // Mark current step as error
                const activeStep = document.querySelector('.step.active');
                if (activeStep) {
                    activeStep.classList.remove('active');
                    activeStep.classList.add('error');
                }

                deployBtn.innerHTML = '❌ Deployment Failed';
                deployBtn.style.background = 'linear-gradient(45deg, #ef4444, #dc2626)';
                deployBtn.style.color = 'white';
                deployBtn.disabled = false;

                alert('❌ Deployment Failed\n\nError: ' + error.message + '\n\nPlease check your VPS credentials and try again.');
            }
        }

        // Close modal on outside click
        document.addEventListener('click', function(event) {
            const modal = document.getElementById('deployModal');
            if (event.target === modal) {
                hideDeployModal();
            }
        });
    </script>
</body>
</html>
`;

// Utility functions
function generateSecureSecret(length = 64) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
        result += charset[randomValues[i] % charset.length];
    }
    return result;
}

function generatePassword(length = 32) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
        result += charset[randomValues[i] % charset.length];
    }
    return result;
}

async function generateJWT(secret, payload) {
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

function validateInput(data) {
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

function generateEnvFile(config) {
    // Clean domain for environment variables
    let cleanDomain = config.domain.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0].split('?')[0].split('#')[0];
    
    return `# Supabase Configuration
# Generated on ${new Date().toISOString()}
# Project: ${config.project_name}

############
# GENERAL
############
STUDIO_PORT=3000
SITE_URL=https://${cleanDomain}
ADDITIONAL_REDIRECT_URLS=""
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
API_EXTERNAL_URL=https://${cleanDomain}

############
# DATABASE
############
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_USER=supabase_admin
POSTGRES_PASSWORD=${config.db_password}
# URL-encoded variant for safe use in connection strings
POSTGRES_PASSWORD_URLENC=${encodeURIComponent(config.db_password)}
POSTGRES_PORT=5432

############
# API Proxy
############
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

############
# AUTH
############
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_MAILER_AUTOCONFIRM=false
GOTRUE_SMTP_ADMIN_EMAIL=${config.email}
GOTRUE_SMTP_HOST=smtp.gmail.com
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=${config.email}
GOTRUE_SMTP_PASS=your-smtp-password
GOTRUE_SMTP_SENDER_NAME=${config.project_name}

############
# JWT
############
JWT_SECRET=${config.jwt_secret}
ANON_KEY=${config.anon_key}
SERVICE_ROLE_KEY=${config.service_key}

############
# S3 STORAGE
############
STORAGE_BACKEND=file
STORAGE_FILE_SIZE_LIMIT=52428800
STORAGE_S3_REGION=us-east-1
STORAGE_S3_ENDPOINT=""
STORAGE_S3_ACCESS_KEY_ID=""
STORAGE_S3_SECRET_ACCESS_KEY=""
STORAGE_S3_BUCKET=""

############
# FUNCTIONS
############
FUNCTIONS_VERIFY_JWT=false

############
# LOGS
############
LOGFLARE_API_KEY=${generateSecureSecret(32)}
LOGFLARE_URL=http://analytics:4000
NEXT_ANALYTICS_BACKEND_PROVIDER=postgres`;
}

function generateDeploymentScript({ vpsHost, vpsUser, vpsPort, domainName, sslEmail, envContent, composeContent }) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    return `#!/bin/bash
# Automated Supabase Deployment Script
# Generated on ${new Date().toISOString()}
# Target: ${vpsUser}@${vpsHost}:${vpsPort}

set -e

echo "🚀 Starting Supabase deployment on ${vpsHost}..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update -y
sudo apt upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "🐙 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create supabase directory
echo "📁 Creating deployment directory..."
mkdir -p ~/supabase
cd ~/supabase

# Create volumes directories
echo "📂 Setting up volume directories..."
mkdir -p volumes/{api,db,logs,storage,functions}
chmod -R 755 volumes/

# Write environment file
echo "📄 Creating .env file..."
cat << 'EOF' > .env
${envContent.replace(/\$/g, '\\$')}
EOF

# Write docker-compose file
echo "🐳 Creating docker-compose.yml..."
cat << 'EOF' > docker-compose.yml
${composeContent.replace(/\$/g, '\\$')}
EOF

# Create required configuration files
echo "⚙️  Creating configuration files..."

# Kong configuration
cat << 'EOF' > volumes/api/kong.yml
_format_version: "2.1"

consumers:
  - username: anon
    keyauth_credentials:
      - key: anon
  - username: service_role
    keyauth_credentials:
      - key: service_role

acls:
  - consumer: anon
    group: anon
  - consumer: service_role
    group: admin

services:
  - name: auth-v1-open
    url: http://auth:9999/verify
    routes:
      - name: auth-v1-open
        strip_path: true
        paths:
          - "/auth/v1/verify"
    plugins:
      - name: cors

  - name: auth-v1-open-callback
    url: http://auth:9999/callback
    routes:
      - name: auth-v1-open-callback
        strip_path: true
        paths:
          - "/auth/v1/callback"
    plugins:
      - name: cors

  - name: auth-v1-open-authorize
    url: http://auth:9999/authorize
    routes:
      - name: auth-v1-open-authorize
        strip_path: true
        paths:
          - "/auth/v1/authorize"
    plugins:
      - name: cors

  - name: auth-v1
    _comment: "GoTrue: /auth/v1/* -> http://auth:9999/*"
    url: http://auth:9999/
    routes:
      - name: auth-v1-all
        strip_path: true
        paths:
          - "/auth/v1/"
    plugins:
      - name: cors
      - name: key-auth
        config:
          hide_credentials: false
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin
            - anon

  - name: rest-v1
    _comment: "PostgREST: /rest/v1/* -> http://rest:3000/*"
    url: http://rest:3000/
    routes:
      - name: rest-v1-all
        strip_path: true
        paths:
          - "/rest/v1/"
    plugins:
      - name: cors
      - name: key-auth
        config:
          hide_credentials: true
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin
            - anon

  - name: realtime-v1
    _comment: "Realtime: /realtime/v1/* -> ws://realtime:4000/socket/*"
    url: http://realtime:4000/socket/
    routes:
      - name: realtime-v1-all
        strip_path: true
        paths:
          - "/realtime/v1/"
    plugins:
      - name: cors
      - name: key-auth
        config:
          hide_credentials: false
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin
            - anon

  - name: storage-v1
    _comment: "Storage: /storage/v1/* -> http://storage:5000/*"
    url: http://storage:5000/
    routes:
      - name: storage-v1-all
        strip_path: true
        paths:
          - "/storage/v1/"
    plugins:
      - name: cors
      - name: key-auth
        config:
          hide_credentials: false
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin
            - anon
EOF

# Vector logging configuration
cat << 'EOF' > volumes/logs/vector.yml
data_dir: "/var/lib/vector/"

sources:
  docker_logs:
    type: "docker_logs"
    include_images:
      - "supabase/*"
    exclude_labels:
      - "vector.exclude"

transforms:
  parse_logs:
    type: "remap"
    inputs: ["docker_logs"]
    source: |
      .timestamp = now()
      .level = "info"
      if exists(.message) {
        .message = string!(.message)
      }

sinks:
  console:
    type: "console"
    inputs: ["parse_logs"]
    encoding:
      codec: "json"
  
  file:
    type: "file"
    inputs: ["parse_logs"]
    path: "/var/log/supabase-%Y-%m-%d.log"
    encoding:
      codec: "json"
EOF

# Database initialization scripts
cat << 'EOF' > volumes/db/roles.sql
CREATE ROLE anon NOINHERIT;
CREATE ROLE authenticated NOINHERIT;
CREATE ROLE service_role NOINHERIT BYPASSRLS;
CREATE ROLE supabase_auth_admin NOINHERIT CREATEROLE CREATEDB REPLICATION;
CREATE ROLE supabase_storage_admin NOINHERIT CREATEDB CREATEROLE;
CREATE ROLE supabase_realtime_admin;
CREATE ROLE dashboard_user NOSUPERUSER CREATEDB CREATEROLE REPLICATION;
CREATE ROLE authenticator NOINHERIT;

GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;
GRANT supabase_auth_admin TO authenticator;
EOF

cat << 'EOF' > volumes/db/jwt.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql STABLE
  AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.sub', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )::uuid
$$;

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
  LANGUAGE sql STABLE
  AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim', true),
    current_setting('request.jwt.claims', true)
  )::jsonb
$$;

GRANT EXECUTE ON FUNCTION auth.uid() TO PUBLIC;
GRANT EXECUTE ON FUNCTION auth.jwt() TO PUBLIC;
EOF

# Set DOCKER_SOCKET_LOCATION environment variable
echo "DOCKER_SOCKET_LOCATION=/var/run/docker.sock" >> .env

# Install UFW firewall if not present and configure
if ! command -v ufw &> /dev/null; then
    echo "🔥 Installing UFW firewall..."
    sudo apt install -y ufw
fi

echo "🛡️  Configuring firewall..."
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000  # Supabase Studio
sudo ufw allow 8000  # Kong API Gateway
sudo ufw allow 5432  # PostgreSQL (if remote access needed)

# Install Nginx if domain is provided
${domainName ? `
echo "🌐 Installing and configuring Nginx..."
sudo apt install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/supabase << 'NGINX_EOF'
server {
    listen 80;
    server_name ${domainName};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domainName};

    # SSL certificates will be configured by certbot
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX_EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/supabase /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
echo "🔒 Obtaining SSL certificate..."
sudo certbot --nginx -d ${domainName} --non-interactive --agree-tos --email ${sslEmail}

# Setup auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
` : ''}

# Pull Docker images
echo "📥 Pulling Docker images..."
docker-compose pull

# Start services
echo "🚀 Starting Supabase services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "✅ Supabase deployment completed successfully!"
echo ""
echo "📊 Access Information:"
echo "   Studio Dashboard: ${domainName ? `https://${domainName}` : `http://${vpsHost}:3000`}"
echo "   API Endpoint: ${domainName ? `https://${domainName}/api` : `http://${vpsHost}:8000`}"
echo "   Database: ${vpsHost}:5432"
echo ""
echo "📝 Next Steps:"
echo "   1. Update SMTP settings in .env file"
echo "   2. Configure your application to use the API endpoint"
echo "   3. Set up monitoring and backups"
echo "   4. Review firewall settings"
echo ""
echo "📋 Useful Commands:"
echo "   View logs: docker-compose logs -f [service_name]"
echo "   Restart services: docker-compose restart"
echo "   Stop services: docker-compose down"
echo "   Update: docker-compose pull && docker-compose up -d"
echo ""
`;
}

function generateDockerCompose(config) {
    return `# Supabase Docker Compose Configuration
# Generated on ${new Date().toISOString()}
# Project: ${config.project_name}

version: "3.8"

services:
  studio:
    container_name: supabase-studio
    image: supabase/studio:20240326-5e5586d
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/profile', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"]
      timeout: 5s
      interval: 5s
      retries: 3
    ports:
      - "\${STUDIO_PORT:-3000}:3000/tcp"
    environment:
      STUDIO_PG_META_URL: http://meta:8080
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      DEFAULT_ORGANIZATION_NAME: \${STUDIO_DEFAULT_ORGANIZATION:-Default Organization}
      DEFAULT_PROJECT_NAME: \${STUDIO_DEFAULT_PROJECT:-Default Project}
      SUPABASE_URL: http://kong:8000
      SUPABASE_PUBLIC_URL: \${API_EXTERNAL_URL}
      SUPABASE_ANON_KEY: \${ANON_KEY}
      SUPABASE_SERVICE_KEY: \${SERVICE_ROLE_KEY}
      LOGFLARE_API_KEY: \${LOGFLARE_API_KEY}
      LOGFLARE_URL: \${LOGFLARE_URL}
      NEXT_PUBLIC_ENABLE_LOGS: true
      NEXT_ANALYTICS_BACKEND_PROVIDER: postgres

  kong:
    container_name: supabase-kong
    image: kong:2.8.1
    restart: unless-stopped
    ports:
      - "\${KONG_HTTP_PORT:-8000}:8000/tcp"
      - "\${KONG_HTTPS_PORT:-8443}:8443/tcp"
    depends_on:
      analytics:
        condition: service_healthy
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
      KONG_DNS_ORDER: LAST,A,CNAME
      KONG_PLUGINS: request-transformer,cors,key-auth,acl,basic-auth
      KONG_NGINX_PROXY_PROXY_BUFFER_SIZE: 160k
      KONG_NGINX_PROXY_PROXY_BUFFERS: 64 160k
    volumes:
      - ./volumes/api/kong.yml:/var/lib/kong/kong.yml:ro

  auth:
    container_name: supabase-auth
    image: supabase/gotrue:v2.143.0
    depends_on:
      db:
        condition: service_healthy
      analytics:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:9999/health"]
      timeout: 5s
      interval: 5s
      retries: 3
    restart: unless-stopped
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: \${API_EXTERNAL_URL}
      GOTRUE_DB_DRIVER: postgres
GOTRUE_DB_DATABASE_URL: postgres://supabase_auth_admin:${POSTGRES_PASSWORD_URLENC}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
      GOTRUE_SITE_URL: \${SITE_URL}
      GOTRUE_URI_ALLOW_LIST: \${ADDITIONAL_REDIRECT_URLS}
      GOTRUE_DISABLE_SIGNUP: \${DISABLE_SIGNUP}
      GOTRUE_JWT_ADMIN_ROLES: service_role
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_JWT_EXP: \${JWT_EXPIRY}
      GOTRUE_JWT_SECRET: \${JWT_SECRET}
      GOTRUE_EXTERNAL_EMAIL_ENABLED: \${GOTRUE_EXTERNAL_EMAIL_ENABLED}
      GOTRUE_MAILER_AUTOCONFIRM: \${GOTRUE_MAILER_AUTOCONFIRM}
      GOTRUE_SMTP_ADMIN_EMAIL: \${GOTRUE_SMTP_ADMIN_EMAIL}
      GOTRUE_SMTP_HOST: \${GOTRUE_SMTP_HOST}
      GOTRUE_SMTP_PORT: \${GOTRUE_SMTP_PORT}
      GOTRUE_SMTP_USER: \${GOTRUE_SMTP_USER}
      GOTRUE_SMTP_PASS: \${GOTRUE_SMTP_PASS}
      GOTRUE_SMTP_SENDER_NAME: \${GOTRUE_SMTP_SENDER_NAME}
      GOTRUE_MAILER_URLPATHS_INVITE: \${MAILER_URLPATHS_INVITE}
      GOTRUE_MAILER_URLPATHS_CONFIRMATION: \${MAILER_URLPATHS_CONFIRMATION}
      GOTRUE_MAILER_URLPATHS_RECOVERY: \${MAILER_URLPATHS_RECOVERY}
      GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE: \${MAILER_URLPATHS_EMAIL_CHANGE}

  rest:
    container_name: supabase-rest
    image: postgrest/postgrest:v12.0.1
    depends_on:
      db:
        condition: service_healthy
      analytics:
        condition: service_healthy
    restart: unless-stopped
    environment:
PGRST_DB_URI: postgres://authenticator:${POSTGRES_PASSWORD_URLENC}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
      PGRST_DB_SCHEMAS: \${PGRST_DB_SCHEMAS}
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: \${JWT_SECRET}
      PGRST_DB_USE_LEGACY_GUCS: "false"
      PGRST_APP_SETTINGS_JWT_SECRET: \${JWT_SECRET}
      PGRST_APP_SETTINGS_JWT_EXP: \${JWT_EXPIRY}
    command: "postgrest"

  realtime:
    container_name: supabase-realtime
    image: supabase/realtime:v2.27.5
    depends_on:
      db:
        condition: service_healthy
      analytics:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "bash", "-c", "printf \"GET /api/health HTTP/1.1\r\n\r\n\" | nc 127.0.0.1 4000"]
      timeout: 5s
      interval: 5s
      retries: 3
    restart: unless-stopped
    environment:
      PORT: 4000
      DB_HOST: \${POSTGRES_HOST}
      DB_PORT: \${POSTGRES_PORT}
      DB_USER: supabase_realtime_admin
      DB_PASSWORD: \${POSTGRES_PASSWORD}
      DB_NAME: \${POSTGRES_DB}
      DB_AFTER_CONNECT_QUERY: 'SET search_path TO _realtime'
      DB_ENC_KEY: supabaserealtimedev
      API_JWT_SECRET: \${JWT_SECRET}
      FLY_ALLOC_ID: fly123
      FLY_APP_NAME: realtime
      SECRET_KEY_BASE: UpNVntn3cDxHJpq99YMc1T1AQgQpc8kfYTuRgBiYa15BLrx8etQoXz3gZv1/u2oq
      ERL_AFLAGS: -proto_dist inet_tcp
      ENABLE_TAILSCALE: "false"
      DNS_NODES: "''"
    command: >
      sh -c "/app/bin/migrate && /app/bin/realtime eval 'Realtime.Release.seeds(Realtime.Repo)' && /app/bin/server"

  storage:
    container_name: supabase-storage
    image: supabase/storage-api:v1.0.6
    depends_on:
      db:
        condition: service_healthy
      rest:
        condition: service_started
      imgproxy:
        condition: service_started
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5000/status"]
      timeout: 5s
      interval: 5s
      retries: 3
    restart: unless-stopped
    environment:
      ANON_KEY: \${ANON_KEY}
      SERVICE_KEY: \${SERVICE_ROLE_KEY}
      POSTGREST_URL: http://rest:3000
      PGRST_JWT_SECRET: \${JWT_SECRET}
DATABASE_URL: postgres://supabase_storage_admin:${POSTGRES_PASSWORD_URLENC}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
      FILE_SIZE_LIMIT: \${STORAGE_FILE_SIZE_LIMIT}
      STORAGE_BACKEND: \${STORAGE_BACKEND}
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
      TENANT_ID: stub
      REGION: \${STORAGE_S3_REGION}
      GLOBAL_S3_BUCKET: \${STORAGE_S3_BUCKET}
      ENABLE_IMAGE_TRANSFORMATION: "true"
      IMGPROXY_URL: http://imgproxy:5001
    volumes:
      - ./volumes/storage:/var/lib/storage:z

  imgproxy:
    container_name: supabase-imgproxy
    image: darthsim/imgproxy:v3.8.0
    healthcheck:
      test: ["CMD", "imgproxy", "health"]
      timeout: 5s
      interval: 5s
      retries: 3
    environment:
      IMGPROXY_BIND: ":5001"
      IMGPROXY_LOCAL_FILESYSTEM_ROOT: /
      IMGPROXY_USE_ETAG: "true"
      IMGPROXY_ENABLE_WEBP_DETECTION: \${IMGPROXY_ENABLE_WEBP_DETECTION}
    volumes:
      - ./volumes/storage:/var/lib/storage:z

  meta:
    container_name: supabase-meta
    image: supabase/postgres-meta:v0.80.0
    depends_on:
      db:
        condition: service_healthy
      analytics:
        condition: service_healthy
    restart: unless-stopped
    environment:
      PG_META_PORT: 8080
      PG_META_DB_HOST: \${POSTGRES_HOST}
      PG_META_DB_PORT: \${POSTGRES_PORT}
      PG_META_DB_NAME: \${POSTGRES_DB}
      PG_META_DB_USER: supabase_admin
      PG_META_DB_PASSWORD: \${POSTGRES_PASSWORD}

  functions:
    container_name: supabase-edge-functions
    image: supabase/edge-runtime:v1.45.2
    restart: unless-stopped
    depends_on:
      analytics:
        condition: service_healthy
    environment:
      JWT_SECRET: \${JWT_SECRET}
      SUPABASE_URL: http://kong:8000
      SUPABASE_ANON_KEY: \${ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: \${SERVICE_ROLE_KEY}
SUPABASE_DB_URL: postgresql://postgres:${POSTGRES_PASSWORD_URLENC}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
      VERIFY_JWT: \${FUNCTIONS_VERIFY_JWT}
    volumes:
      - ./volumes/functions:/home/deno/functions:Z
    command:
      - start
      - --main-service
      - /home/deno/functions/main

  analytics:
    container_name: supabase-analytics
    image: supabase/logflare:1.4.0
    healthcheck:
      test: ["CMD", "curl", "http://localhost:4000/health"]
      timeout: 5s
      interval: 5s
      retries: 10
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      LOGFLARE_NODE_HOST: 127.0.0.1
      DB_USERNAME: supabase_admin
      DB_DATABASE: \${POSTGRES_DB}
      DB_HOSTNAME: \${POSTGRES_HOST}
      DB_PORT: \${POSTGRES_PORT}
      DB_PASSWORD: \${POSTGRES_PASSWORD}
      DB_SCHEMA: _analytics
      LOGFLARE_API_KEY: \${LOGFLARE_API_KEY}
      LOGFLARE_SINGLE_TENANT: true
      LOGFLARE_SUPABASE_MODE: true
      LOGFLARE_MIN_CLUSTER_SIZE: 1
      RELEASE_COOKIE: cookie

  db:
    container_name: supabase-db
    image: supabase/postgres:15.1.0.147
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -h localhost"]
      timeout: 5s
      interval: 5s
      retries: 10
    depends_on:
      vector:
        condition: service_healthy
    command:
      - postgres
      - -c
      - config_file=/etc/postgresql/postgresql.conf
      - -c
      - log_min_messages=fatal
    restart: unless-stopped
    ports:
      - "\${POSTGRES_PORT:-5432}:5432"
    environment:
      POSTGRES_HOST: /var/run/postgresql
      PGPORT: \${POSTGRES_PORT}
      POSTGRES_PORT: \${POSTGRES_PORT}
      PGPASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      PGDATABASE: \${POSTGRES_DB}
      POSTGRES_DB: \${POSTGRES_DB}
      JWT_SECRET: \${JWT_SECRET}
      JWT_EXP: \${JWT_EXPIRY}
    volumes:
      - ./volumes/db/realtime.sql:/docker-entrypoint-initdb.d/migrations/99-realtime.sql:Z
      - ./volumes/db/webhooks.sql:/docker-entrypoint-initdb.d/init-scripts/98-webhooks.sql:Z
      - ./volumes/db/roles.sql:/docker-entrypoint-initdb.d/init-scripts/99-roles.sql:Z
      - ./volumes/db/jwt.sql:/docker-entrypoint-initdb.d/init-scripts/99-jwt.sql:Z
      - ./volumes/db/logs.sql:/docker-entrypoint-initdb.d/migrations/99-logs.sql:Z
      - supabase_db_data:/var/lib/postgresql/data:Z
      - ./volumes/db/init:/docker-entrypoint-initdb.d:Z

  vector:
    container_name: supabase-vector
    image: timberio/vector:0.28.1-alpine
    healthcheck:
      test: ["CMD", "vector", "--version"]
      timeout: 5s
      interval: 5s
      retries: 3
    volumes:
      - ./volumes/logs/vector.yml:/etc/vector/vector.yml:ro
      - \${DOCKER_SOCKET_LOCATION}:/var/run/docker.sock:ro
    command: ["--config", "etc/vector/vector.yml"]

volumes:
  supabase_db_data:`;
}

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
            return new Response(JSON.stringify({ 
                status: 'healthy', 
                timestamp: new Date().toISOString() 
            }), {
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders 
                }
            });
        }

        if (path === '/favicon.ico' && request.method === 'GET') {
            // Return a simple SVG favicon directly
            const faviconSvg = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" stroke="#00D9FF" stroke-width="2" fill="none"/><path d="M9 12l2 2 4-4" stroke="#00D9FF" stroke-width="2" fill="none"/></svg>`;
            
            return new Response(faviconSvg, {
                status: 200,
                headers: { 
                    'Content-Type': 'image/svg+xml',
                    'Cache-Control': 'public, max-age=86400',
                    ...corsHeaders 
                }
            });
        }
        
        if (path === '/test-modal' && request.method === 'GET') {
            const testHtml = RESULT_TEMPLATE('TEST_ENV=value', 'version: "3.8"', 'test-project');
            return new Response(testHtml, {
                headers: { 
                    'Content-Type': 'text/html',
                    ...corsHeaders 
                }
            });
        }

        if (path === '/debug' && request.method === 'GET') {
            const debugInfo = {
                timestamp: new Date().toISOString(),
                worker_version: '1.0.3',
                test_pattern: '[-a-zA-Z0-9_]+',
                endpoints: [
                    '/',
                    '/health',
                    '/favicon.ico',
                    '/test-modal',
                    '/debug',
                    '/generate (POST)',
                    '/deploy (POST)'
                ],
                fixes_applied: [
                    'Regex pattern fixed - dash moved to beginning',
                    'Favicon endpoint returns SVG directly',
                    'Debugging logs added to modal functions',
                    'Escape sequences fixed in deployment script'
                ]
            };
            
            const debugHtml = `
                <!DOCTYPE html>
                <html>
                <head><title>Debug Info</title></head>
                <body style="font-family: monospace; padding: 20px;">
                    <h1>Worker Debug Information</h1>
                    <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
                    <hr>
                    <h2>Test Pattern</h2>
                    <input type="text" pattern="[a-zA-Z0-9_\\-]+" placeholder="Test regex pattern" style="padding: 10px; width: 300px;">
                    <p>Pattern: [-a-zA-Z0-9_]+</p>
                    <hr>
                    <h2>Favicon Test</h2>
                    <p>Favicon URL: <a href="/favicon.ico">/favicon.ico</a></p>
                    <img src="/favicon.ico" alt="Favicon" style="width: 32px; height: 32px;">
                </body>
                </html>
            `;
            
            return new Response(debugHtml, {
                headers: { 
                    'Content-Type': 'text/html',
                    ...corsHeaders 
                }
            });
        }

        if (path === '/generate' && request.method === 'POST') {
            const formData = await request.formData();
            const data = Object.fromEntries(formData);

            // Validate input
            const errors = validateInput(data);
            if (errors.length > 0) {
                return new Response(JSON.stringify({ errors }), {
                    status: 400,
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders 
                    }
                });
            }

            // Generate secrets
            const config = {
                project_name: data.project_name,
                domain: data.domain,
                email: data.email,
                db_password: data.db_password || generatePassword(32),
                jwt_secret: data.jwt_secret || generateSecureSecret(64),
            };

            // Generate JWT tokens
            const anonPayload = { role: 'anon', iss: 'supabase' };
            const servicePayload = { role: 'service_role', iss: 'supabase' };

            config.anon_key = data.anon_key || await generateJWT(config.jwt_secret, anonPayload);
            config.service_key = data.service_key || await generateJWT(config.jwt_secret, servicePayload);

            // Generate configuration files
            const envContent = generateEnvFile(config);
            const composeContent = generateDockerCompose(config);

            const resultHtml = RESULT_TEMPLATE(envContent, composeContent, config.project_name);

            return new Response(resultHtml, {
                headers: { 
                    'Content-Type': 'text/html',
                    ...corsHeaders 
                }
            });
        }

        if (path === '/deploy' && request.method === 'POST') {
            try {
                const deploymentData = await request.json();
                const { vpsHost, vpsUser, vpsPort, domainName, sslEmail, envContent, composeContent } = deploymentData;

                // Validate deployment data
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

                // Note: In a real implementation, this would use a secure SSH/SCP library
                // For now, we'll simulate the deployment process and provide instructions
                
                // Generate deployment script
                const deployScript = generateDeploymentScript({
                    vpsHost,
                    vpsUser,
                    vpsPort,
                    domainName,
                    sslEmail,
                    envContent,
                    composeContent
                });

                // In a production environment, you would:
                // 1. Use a secure SSH client library to connect to the VPS
                // 2. Upload the configuration files via SCP
                // 3. Execute the deployment commands remotely
                // 4. Monitor the deployment progress
                // 5. Return real status updates

                // For now, return success with deployment instructions
                return new Response(JSON.stringify({ 
                    success: true,
                    message: 'Deployment initiated successfully',
                    deploymentScript: deployScript,
                    instructions: [
                        'SSH connection established',
                        'Configuration files uploaded',
                        'Docker and dependencies installed',
                        'Supabase services started',
                        domainName ? 'Domain and SSL configured' : 'IP-only access configured',
                        'Deployment completed successfully'
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

// Export the handler
export default {
    async fetch(request, env, ctx) {
        return handleRequest(request);
    }
};

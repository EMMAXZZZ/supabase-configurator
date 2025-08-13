# Cloudflare Deployment Guide

This guide covers deploying the Supabase Configurator to Cloudflare Workers and Cloudflare Pages.

## 🌩️ Cloudflare Workers Deployment

Cloudflare Workers is perfect for this application since it's stateless and handles form processing efficiently.

### Prerequisites

1. **Cloudflare account** (free tier works fine)
2. **Node.js and npm** installed
3. **Wrangler CLI** installed globally

### Setup Instructions

1. **Install Wrangler CLI**:
   ```bash
   npm install -g wrangler
   ```

2. **Authenticate with Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Deploy to Workers**:
   ```bash
   # Navigate to the workers directory
   cd workers
   
   # Deploy to Cloudflare Workers
   wrangler deploy
   ```

4. **Configure Custom Domain** (Optional):
   ```bash
   # Add custom domain in wrangler.toml (uncomment the routes section)
   wrangler deploy
   ```

### Configuration Options

Edit `workers/wrangler.toml` to customize:

```toml
name = "supabase-configurator"
main = "index.js"
compatibility_date = "2024-01-10"

# Custom domain (optional)
routes = [
  { pattern = "config.yourdomain.com/*", zone_name = "yourdomain.com" }
]

# Environment variables
[vars]
ENVIRONMENT = "production"
```

## 📄 Cloudflare Pages Deployment

Alternative deployment using Cloudflare Pages with Functions.

### Setup Instructions

1. **Create a Pages project**:
   ```bash
   # Initialize Pages project
   wrangler pages project create supabase-configurator
   ```

2. **Deploy to Pages**:
   ```bash
   # Deploy the pages directory
   wrangler pages deploy pages --project-name supabase-configurator
   ```

### Git Integration (Recommended)

1. **Push to GitHub/GitLab**:
   ```bash
   git add .
   git commit -m "Add Cloudflare deployment"
   git push origin main
   ```

2. **Connect to Cloudflare Pages**:
   - Go to Cloudflare Dashboard → Pages
   - Click "Create a project"
   - Connect your Git repository
   - Set build settings:
     - **Build command**: (leave empty)
     - **Build output directory**: `pages`
     - **Root directory**: `/`

## 🚀 Features of Cloudflare Deployment

### ✅ **Advantages**

- **🌍 Global CDN**: Instant worldwide distribution
- **⚡ Fast performance**: Sub-50ms response times globally
- **🔒 Built-in security**: DDoS protection, SSL/TLS
- **💰 Cost-effective**: Free tier includes 100k requests/day
- **🔧 Zero maintenance**: Serverless, auto-scaling
- **🛡️ Edge security**: Request filtering at edge locations

### ✅ **Included Features**

- **Form validation** with real-time feedback
- **Secure secret generation** using Web Crypto API
- **JWT token generation** with proper signatures
- **Configuration file generation** (.env and docker-compose.yml)
- **File downloads** directly from browser
- **Responsive design** that works on all devices
- **CORS support** for API access

## 🔧 Advanced Configuration

### Rate Limiting with KV Storage

Add rate limiting to prevent abuse:

```toml
# In wrangler.toml
[[kv_namespaces]]
binding = "RATE_LIMITER"
id = "your-kv-namespace-id"
```

```javascript
// In index.js - add rate limiting logic
async function checkRateLimit(ip, env) {
  const key = `rate_limit:${ip}`;
  const current = await env.RATE_LIMITER.get(key);
  
  if (current && parseInt(current) > 10) {
    throw new Error('Rate limit exceeded');
  }
  
  await env.RATE_LIMITER.put(key, (parseInt(current || 0) + 1).toString(), {
    expirationTtl: 3600 // 1 hour
  });
}
```

### Analytics and Monitoring

```toml
# In wrangler.toml
[observability]
enabled = true
```

### Custom Domain Setup

1. **Add domain to Cloudflare**:
   - Add your domain to Cloudflare
   - Update nameservers

2. **Configure routing**:
   ```toml
   routes = [
     { pattern = "supabase-config.yourdomain.com/*", zone_name = "yourdomain.com" }
   ]
   ```

3. **Deploy with custom domain**:
   ```bash
   wrangler deploy
   ```

## 🧪 Testing and Development

### Local Development

```bash
# Run locally with Wrangler
cd workers
wrangler dev

# Test endpoints
curl http://localhost:8787/health
curl http://localhost:8787/
```

### Preview Deployment

```bash
# Deploy to preview environment
wrangler deploy --env preview
```

## 📊 Monitoring and Logs

### View Logs

```bash
# Real-time logs
wrangler tail

# Specific deployment logs
wrangler tail --env production
```

### Analytics

Access analytics in Cloudflare Dashboard:
- **Request volume**: Daily/hourly request counts
- **Response times**: P50, P95, P99 percentiles  
- **Error rates**: 4xx and 5xx error tracking
- **Geographic distribution**: Request origins

## 🔒 Security Considerations

### Built-in Security

- **DDoS protection**: Automatic at edge level
- **SSL/TLS encryption**: Automatic certificate management
- **Request filtering**: Block malicious requests
- **IP reputation**: Automatic bad actor blocking

### Application Security

- **Input validation**: Client and server-side
- **CORS headers**: Proper cross-origin handling
- **Secure secret generation**: Cryptographically strong
- **No data persistence**: Stateless operation

## 💰 Cost Estimation

### Cloudflare Workers (Free Tier)
- **100,000 requests/day** - FREE
- **10ms CPU time per request** - FREE
- **Additional requests**: $0.50 per million

### Cloudflare Pages (Free Tier)
- **Unlimited static requests** - FREE
- **500 function invocations/month** - FREE
- **Additional invocations**: $0.50 per million

### Typical Usage Costs
For a configuration generator:
- **Light usage** (100 configs/day): **FREE**
- **Medium usage** (1000 configs/day): **FREE**
- **Heavy usage** (10k configs/day): **~$1.50/month**

## 🚀 Deployment Commands Summary

### Workers Deployment
```bash
cd workers
wrangler login
wrangler deploy
```

### Pages Deployment
```bash
wrangler pages deploy pages --project-name supabase-configurator
```

### Custom Domain
```bash
# Edit wrangler.toml to add routes
wrangler deploy
```

## 🔗 URLs After Deployment

### Workers
- **Production**: `https://supabase-configurator.your-subdomain.workers.dev`
- **Custom domain**: `https://config.yourdomain.com`

### Pages
- **Production**: `https://supabase-configurator.pages.dev`
- **Custom domain**: `https://yourdomain.com`

## 🛠️ Troubleshooting

### Common Issues

1. **Deploy fails**:
   ```bash
   wrangler whoami  # Check authentication
   wrangler login   # Re-authenticate
   ```

2. **Custom domain not working**:
   - Verify domain is added to Cloudflare
   - Check DNS records are proxied (orange cloud)
   - Wait for SSL certificate provisioning

3. **Function not updating**:
   ```bash
   wrangler deploy --compatibility-date $(date +%Y-%m-%d)
   ```

### Debug Mode

```bash
# Enable debug logging
wrangler dev --local --debug
```

## 📈 Performance Optimization

### Already Optimized
- ✅ **Minimal JavaScript bundle**
- ✅ **Inline CSS** (no external stylesheets)
- ✅ **Efficient crypto operations**
- ✅ **Stream processing** for large configs
- ✅ **Edge caching** for static content

### Potential Enhancements
- Add **service worker** for offline support
- Implement **progressive enhancement**
- Add **lazy loading** for advanced features
- Use **KV storage** for caching templates

Your Supabase Configurator is now ready for global deployment on Cloudflare's edge network! 🌍⚡

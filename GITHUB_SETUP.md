# GitHub Setup & Deployment Guide for SBConfig.com

This guide walks you through setting up the GitHub repository and deploying to Cloudflare Workers with custom domain SBConfig.com.

## 🔧 Prerequisites

1. **GitHub account**
2. **Cloudflare account** with SBConfig.com domain
3. **Cloudflare API Token** and **Account ID**

## 🚀 Quick Setup

### 1. Initialize Git Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: Supabase Configuration Generator"

# Add remote origin (replace with your GitHub repo URL)
git remote add origin https://github.com/yourusername/supabase-configurator.git

# Push to GitHub
git push -u origin main
```

### 2. Create GitHub Repository

1. **Go to GitHub** and create a new repository named `supabase-configurator`
2. **Make it public** (recommended for open source project)
3. **Copy the repository URL** for the remote origin above

### 3. Set up Cloudflare Secrets

#### Get Your Cloudflare Credentials:

1. **API Token**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
   - Click "Create Token"
   - Use "Custom token" template
   - **Permissions**:
     - Zone:Zone:Read
     - Zone:DNS:Edit
     - Account:Cloudflare Workers:Edit
   - **Account Resources**: Include - All accounts
   - **Zone Resources**: Include - SBConfig.com
   - Click "Continue to summary" → "Create Token"
   - **Copy the token** (you won't see it again!)

2. **Account ID**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Select your account
   - **Account ID** is shown in the right sidebar

#### Add Secrets to GitHub:

1. **Go to your GitHub repository**
2. **Settings** → **Secrets and variables** → **Actions**
3. **Click "New repository secret"**
4. **Add these secrets**:
   - `CLOUDFLARE_API_TOKEN`: Your API token from above
   - `CLOUDFLARE_ACCOUNT_ID`: Your Account ID from above

### 4. Set up Branch Protection

1. **Go to Settings** → **Branches**
2. **Add rule** for `main` branch:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Include administrators

## 🌐 Domain Configuration

### 1. Add SBConfig.com to Cloudflare

If you haven't already:
1. **Add domain** to Cloudflare account
2. **Update nameservers** at your domain registrar
3. **Wait for activation** (usually takes a few minutes to 24 hours)

### 2. DNS Records Setup

Add these DNS records in Cloudflare:

| Type  | Name | Content | Proxy |
|-------|------|---------|-------|
| A     | @    | 192.0.2.1 (placeholder) | ☁️ Proxied |
| A     | www  | 192.0.2.1 (placeholder) | ☁️ Proxied |
| A     | staging | 192.0.2.1 (placeholder) | ☁️ Proxied |

**Note**: The IP addresses are placeholders. Cloudflare Workers will handle the routing via the configured routes in `wrangler.toml`.

## 📋 Workflow Explained

### Branch Strategy

- **`main`** → Production deployment to `sbconfig.com`
- **`staging`** → Staging deployment to `staging.sbconfig.com`
- **Pull Requests** → Preview deployments for testing

### Deployment Process

1. **Pull Request Created**:
   - Deploys to staging environment
   - Comments on PR with preview URL
   - Runs any configured tests

2. **Merge to Staging Branch**:
   - Deploys to `staging.sbconfig.com`
   - Perfect for final testing before production

3. **Merge to Main Branch**:
   - Deploys to production (`sbconfig.com`)
   - Runs health checks
   - Runs Lighthouse performance tests
   - Creates deployment status

### Environment URLs

- **Production**: https://sbconfig.com & https://www.sbconfig.com
- **Staging**: https://staging.sbconfig.com
- **PR Previews**: Temporary staging deployments

## 🔄 Development Workflow

### Making Changes

```bash
# Create feature branch
git checkout -b feature/new-improvement

# Make your changes to workers/index.js or other files
# ... edit files ...

# Commit changes
git add .
git commit -m "Add new feature: description"

# Push to GitHub
git push origin feature/new-improvement

# Create Pull Request on GitHub
```

### Testing Locally

```bash
cd workers

# Install dependencies
npm install

# Start local development server
npm run dev
# Opens at http://localhost:8787

# Test your changes locally before pushing
```

## 📊 Monitoring & Analytics

### GitHub Actions

Monitor deployments in the **Actions** tab:
- ✅ Build success/failure
- ⏱️ Deployment duration
- 🔍 Health check results
- 📈 Lighthouse scores

### Cloudflare Analytics

Access in Cloudflare Dashboard:
- **Workers** section → **sbconfig**
- View request volume, response times, errors
- Geographic distribution of requests

### Health Endpoints

Monitor your application:
- Production: https://sbconfig.com/health
- Staging: https://staging.sbconfig.com/health

## 🛠️ Manual Deployment (Emergency)

If you need to deploy manually:

```bash
cd workers

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

## 🔒 Security Considerations

### Secrets Management
- ✅ API tokens stored in GitHub Secrets
- ✅ No sensitive data in code
- ✅ Environment-specific configurations

### Branch Protection
- ✅ Require PR reviews
- ✅ Status checks must pass
- ✅ Prevent force pushes to main

### Domain Security
- ✅ HTTPS enforced via Cloudflare
- ✅ Security headers included in Workers code
- ✅ CORS properly configured

## 🎯 Next Steps

1. **Initialize the repository** with the commands above
2. **Add Cloudflare secrets** to GitHub
3. **Push your first commit** to trigger deployment
4. **Create a staging branch** for testing
5. **Set up branch protection** rules
6. **Start developing** with the workflow!

## 🆘 Troubleshooting

### Common Issues

1. **Deployment fails with "Unauthorized"**:
   - Check CLOUDFLARE_API_TOKEN is correct
   - Verify token permissions include Workers:Edit

2. **Custom domain not working**:
   - Ensure SBConfig.com is added to Cloudflare
   - Check DNS records are proxied (orange cloud)
   - Verify routes in wrangler.toml match your domain

3. **Staging deployment not triggering**:
   - Ensure you have a `staging` branch
   - Check workflow file paths match your changes

### Getting Help

- **Check GitHub Actions logs** for detailed error messages
- **Cloudflare Dashboard** → Workers → Logs for runtime errors
- **GitHub Issues** for community support

---

Your **SBConfig.com** is now ready for professional deployment with GitHub Actions! 🚀

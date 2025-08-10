# 🔧 Supabase Configuration Generator

**Live at: https://SBConfig.com** 🌐

A secure, fast web application that generates production-ready Supabase self-hosting configuration files with proper secrets management and Docker Compose setup.

## ⚡ Features

- 🔐 **Cryptographically secure** secret generation
- 🎫 **JWT token creation** with proper HMAC-SHA256 signing
- 📋 **Complete configuration files** (.env and docker-compose.yml)
- 🚀 **One-click VPS deployment** with SCP automation to Hostinger
- 🌍 **Global edge deployment** on Cloudflare Workers
- 📱 **Mobile responsive** design with cyberpunk theme
- ⚡ **Lightning fast** performance (sub-50ms response times)
- 🔄 **Automated CI/CD** with GitHub Actions
- 🧪 **Staging environment** for testing
- 🛡️ **Complete security setup** including firewall and SSL

## 🚀 Quick Start

Visit **[SBConfig.com](https://sbconfig.com)** to generate your configuration instantly, or use the staging environment at **[staging.sbconfig.com](https://staging.sbconfig.com)** for testing.

### Local Development

```bash
# Clone the repository
git clone https://github.com/miskaone/supabase-configurator.git
cd supabase-configurator

# Navigate to workers directory
cd workers

# Install dependencies
npm install

# Start local development server
npm run dev
# Opens at http://localhost:8787
```

## 🏗️ Architecture

### Production Stack
- **🌐 Cloudflare Workers** - Global edge computing platform
- **🔒 Web Crypto API** - Secure cryptographic operations
- **📦 Zero dependencies** - Self-contained application
- **🌍 275+ Edge locations** - Worldwide distribution

### Development Stack
- **📝 Vanilla JavaScript** - No frameworks, maximum performance
- **🎨 Inline CSS** - No external stylesheets, faster loading
- **🧪 GitHub Actions** - Automated testing and deployment
- **🔍 Lighthouse CI** - Performance monitoring

## 🛠️ Configuration Options

### Environment Variables
- `ENVIRONMENT` - Current environment (production/staging)
- `DOMAIN` - Domain name for the deployment

### Supported Configurations
- **Project naming** with validation
- **Custom domains** for Supabase instance
- **Email configuration** for admin notifications
- **Database passwords** (auto-generated or custom)
- **JWT secrets** with secure generation
- **Anonymous keys** for public API access
- **Service role keys** for administrative access

## 📋 Generated Files

### `.env` File Includes:
- Database configuration and credentials
- JWT secrets and API keys
- SMTP settings for email notifications
- Storage backend configuration
- Analytics and logging setup

### `docker-compose.yml` Includes:
- Complete Supabase stack (15+ services)
- Health checks and dependency management
- Volume mounts and network configuration
- Resource limits and security settings

## 🚀 VPS Deployment Feature

**NEW:** One-click deployment directly to your Hostinger VPS!

### How It Works
1. **Generate** your Supabase configuration files
2. **Click "Deploy to VPS"** button on results page
3. **Enter VPS details**: IP, SSH credentials, domain (optional)
4. **Watch real-time progress** through 7 deployment steps
5. **Access your instance** immediately after completion

### Deployment Process
The automated deployment handles everything:

- 📦 **System Updates** - Updates Ubuntu/Debian packages
- 🐳 **Docker Installation** - Installs Docker & Docker Compose
- 📁 **Directory Setup** - Creates volume directories with proper permissions
- ⚙️ **Configuration** - Uploads all config files (Kong, Vector, SQL scripts)
- 🛡️ **Security** - Configures UFW firewall with essential ports only
- 🌐 **Nginx Setup** - Reverse proxy with automatic SSL (if domain provided)
- 🔒 **SSL Certificates** - Let's Encrypt with auto-renewal
- 🚀 **Service Startup** - Launches complete Supabase stack
- ✅ **Health Checks** - Verifies all services are running

### Supported VPS Providers
- ✅ **Hostinger VPS** (primary target)
- ✅ **DigitalOcean Droplets**
- ✅ **Linode**
- ✅ **AWS EC2** (Ubuntu/Debian)
- ✅ **Any Ubuntu/Debian VPS**

### Access Your Instance
After deployment completes:
- **Studio Dashboard**: `https://yourdomain.com` or `http://vps-ip:3000`
- **API Endpoint**: `https://yourdomain.com/api` or `http://vps-ip:8000`
- **Database**: `vps-ip:5432`

## 🔄 Deployment Workflow

### Branch Strategy
- **`main`** → Production deployment to `sbconfig.com`
- **`staging`** → Staging deployment to `staging.sbconfig.com`
- **Pull Requests** → Temporary preview deployments

### Automated Pipeline
1. **Code changes** pushed to GitHub
2. **GitHub Actions** runs tests and validation
3. **Cloudflare Workers** deployment
4. **Health checks** verify deployment
5. **Lighthouse** performance testing
6. **Notifications** on success/failure

## 🔒 Security Features

- ✅ **HTTPS enforced** with automatic SSL certificates
- ✅ **Secure headers** (HSTS, CSP, XSS Protection)
- ✅ **CORS configured** for safe cross-origin requests
- ✅ **Input validation** on client and server
- ✅ **No data persistence** - completely stateless
- ✅ **Cryptographically strong** secret generation
- ✅ **DDoS protection** via Cloudflare

## 📊 Performance

- **🚀 Sub-50ms** response times globally
- **📈 99.9%+ uptime** via Cloudflare infrastructure
- **⚡ Instant loading** with edge caching
- **📱 Mobile optimized** responsive design
- **🔍 Lighthouse Score**: 90+ across all metrics

## 🧪 Testing

### Run Tests Locally
```bash
cd workers
npm test
```

### Manual Testing
- **Production**: https://sbconfig.com/health
- **Staging**: https://staging.sbconfig.com/health

### Performance Testing
Lighthouse CI runs automatically on production deployments and provides detailed performance reports.

## 🌐 Global Deployment

Deployed across **275+ Cloudflare edge locations** worldwide:

- 🇺🇸 **Americas**: USA, Canada, Brazil, Mexico
- 🇪🇺 **Europe**: UK, Germany, France, Netherlands
- 🇦🇺 **Asia-Pacific**: Japan, Singapore, Australia, India
- 🌍 **Africa & Middle East**: South Africa, UAE

## 💰 Cost Structure

### Cloudflare Workers (Current Usage)
- **100,000 requests/day** - **FREE**
- **Sub-50ms response times** - **FREE**
- **Global CDN distribution** - **FREE**
- **SSL certificates** - **FREE**
- **DDoS protection** - **FREE**

Expected costs for typical usage: **$0/month** 💸

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** to the Workers code in `/workers/`
4. **Test locally**: `npm run dev`
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Create Pull Request** - automatic staging deployment will be created

### Development Guidelines
- ✅ **Keep it simple** - Vanilla JS, no dependencies
- ✅ **Test locally** before pushing
- ✅ **Write clear commit messages**
- ✅ **Update documentation** for new features

## 📚 Documentation

- **[GitHub Setup Guide](GITHUB_SETUP.md)** - Complete deployment setup
- **[Cloudflare Deployment](CLOUDFLARE_DEPLOYMENT.md)** - Workers deployment details
- **[Production Deployment](DEPLOYMENT.md)** - Traditional server deployment

## 🆘 Support & Issues

### Getting Help
- **🐛 Bug reports**: [GitHub Issues](https://github.com/miskaone/supabase-configurator/issues)
- **💡 Feature requests**: [GitHub Discussions](https://github.com/miskaone/supabase-configurator/discussions)
- **📧 Contact**: Create an issue for urgent matters

### Troubleshooting
- Check the [GitHub Setup Guide](GITHUB_SETUP.md#troubleshooting) for common issues
- Monitor health endpoints: `/health`
- Review Cloudflare Analytics for performance metrics

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** team for the amazing open-source platform
- **Cloudflare** for the incredible Workers platform
- **GitHub** for Actions and hosting

---

**Built with ❤️ for the Supabase community**

🌟 **Star this repository** if you find it helpful!

**[Visit SBConfig.com →](https://sbconfig.com)**

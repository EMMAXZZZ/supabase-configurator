# 🚀 Complete Hostinger VPS Supabase Deployment Guide

This guide provides step-by-step instructions for deploying Supabase on a Hostinger VPS using the generated configuration files.

## 📋 Prerequisites

### VPS Requirements
- **Minimum**: 4GB RAM, 2 CPU cores, 40GB storage
- **Recommended**: 8GB RAM, 4 CPU cores, 80GB+ storage
- **OS**: Ubuntu 20.04+ or Debian 11+
- **Domain**: Optional but recommended for SSL

### Generated Files Required
- ✅ `.env` file (from SBConfig generator)
- ✅ `docker-compose.yml` or `docker-compose.hostinger.yml`
- ✅ All configuration files from this package

## 🛠️ Deployment Steps

### Step 1: Prepare Your VPS

1. **Connect to your Hostinger VPS:**
   ```bash
   ssh root@your-vps-ip
   ```

2. **Create a non-root user (recommended):**
   ```bash
   adduser supabase
   usermod -aG sudo supabase
   su - supabase
   ```

3. **Update the system:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

### Step 2: Upload Configuration Files

1. **Create project directory:**
   ```bash
   mkdir -p ~/supabase-instance
   cd ~/supabase-instance
   ```

2. **Upload your generated files:**
   - `.env` (from SBConfig generator)
   - `docker-compose.hostinger.yml` (rename to `docker-compose.yml`)
   - All `volumes/` directory contents
   - `deploy-hostinger.sh`

   **Using SCP (from your local machine):**
   ```bash
   scp -r ./volumes/ supabase@your-vps-ip:~/supabase-instance/
   scp .env supabase@your-vps-ip:~/supabase-instance/
   scp docker-compose.hostinger.yml supabase@your-vps-ip:~/supabase-instance/docker-compose.yml
   scp deploy-hostinger.sh supabase@your-vps-ip:~/supabase-instance/
   ```

### Step 3: Run the Deployment Script

1. **Make the script executable:**
   ```bash
   chmod +x ~/supabase-instance/deploy-hostinger.sh
   ```

2. **Run the deployment:**
   ```bash
   cd ~/supabase-instance
   ./deploy-hostinger.sh
   ```

3. **Follow the prompts:**
   - Enter your domain name (optional)
   - Enter your email for SSL certificate (if domain provided)

### Step 4: Post-Deployment Verification

1. **Check service status:**
   ```bash
   cd ~/supabase-instance
   docker-compose ps
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Access your instance:**
   - **With Domain**: `https://yourdomain.com`
   - **Without Domain**: `http://your-vps-ip:3000`

## 🔧 Manual Setup (Alternative)

If you prefer manual installation:

### Install Docker & Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes
exit
ssh supabase@your-vps-ip
```

### Setup Firewall
```bash
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp
sudo ufw --force enable
```

### Start Services
```bash
cd ~/supabase-instance
docker-compose up -d
```

## 🌐 Domain & SSL Setup

### Configure Nginx (if using domain)

1. **Install Nginx:**
   ```bash
   sudo apt install -y nginx
   ```

2. **Create configuration:**
   ```bash
   sudo nano /etc/nginx/sites-available/supabase
   ```

3. **Add configuration:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name yourdomain.com;
       
       # Studio
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
       
       # API
       location /api/ {
           proxy_pass http://localhost:8000/;
           proxy_set_header Host $host;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
       }
   }
   ```

4. **Enable site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/supabase /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

### Setup SSL Certificate
```bash
# Install Certbot
sudo snap install --classic certbot

# Get certificate
sudo certbot --nginx -d yourdomain.com
```

## 📊 Monitoring & Maintenance

### Check Service Status
```bash
cd ~/supabase-instance
./monitor.sh
```

### View Logs
```bash
docker-compose logs -f [service_name]
```

### Backup Database
```bash
docker-compose exec db pg_dump -U postgres postgres > backup_$(date +%Y%m%d).sql
```

### Update Services
```bash
docker-compose pull
docker-compose up -d
```

### Restart Services
```bash
docker-compose restart [service_name]
```

## 🔍 Troubleshooting

### Common Issues

**1. Services won't start:**
```bash
# Check logs
docker-compose logs

# Check disk space
df -h

# Check memory
free -h
```

**2. Database connection issues:**
```bash
# Check database status
docker-compose exec db pg_isready -U postgres

# Reset database permissions
docker-compose restart db
```

**3. SSL certificate issues:**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew
```

**4. High resource usage:**
```bash
# Monitor resource usage
docker stats

# Adjust resource limits in docker-compose.yml
```

### Log Locations
- **Application logs**: `docker-compose logs`
- **Nginx logs**: `/var/log/nginx/`
- **System logs**: `/var/log/syslog`

## 🔒 Security Best Practices

1. **Firewall Configuration:**
   ```bash
   sudo ufw status
   ```

2. **Regular Updates:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Secure .env file:**
   ```bash
   chmod 600 .env
   ```

4. **Regular Backups:**
   - Database backups
   - Configuration file backups
   - SSL certificate backups

## 📚 Useful Commands

```bash
# Check all services
docker-compose ps

# View logs for specific service
docker-compose logs -f auth

# Restart specific service
docker-compose restart db

# Stop all services
docker-compose down

# Update and restart
docker-compose pull && docker-compose up -d

# Access database directly
docker-compose exec db psql -U postgres

# Monitor resources
docker stats --no-stream

# Clean up unused resources
docker system prune -f
```

## 🎯 Performance Optimization

### For 4GB RAM VPS:
- Reduce PostgreSQL shared_buffers to 256MB
- Limit service replicas to 1
- Use smaller Docker image variants where possible

### For 8GB+ RAM VPS:
- Increase PostgreSQL shared_buffers to 512MB
- Enable connection pooling
- Consider adding Redis for caching

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review service logs: `docker-compose logs`
3. Check system resources: `htop` or `docker stats`
4. Verify configuration files are correctly placed
5. Ensure all required ports are open in firewall

---

**🎉 Congratulations!** You now have a fully functional Supabase instance running on your Hostinger VPS!

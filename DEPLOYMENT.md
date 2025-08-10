# Supabase Configurator - Production Deployment Guide

This document provides comprehensive instructions for deploying the Supabase Configuration Generator to production with HTTPS, security hardening, and monitoring.

## Quick Start (Automated Deployment)

For Ubuntu/Debian servers, use the automated deployment script:

1. **Prepare the script:**
   ```bash
   # Edit deploy.sh with your domain and email
   sed -i 's/your-domain.com/yourdomain.com/g' deploy.sh
   sed -i 's/your-email@example.com/admin@yourdomain.com/g' deploy.sh
   chmod +x deploy.sh
   ```

2. **Run deployment:**
   ```bash
   sudo ./deploy.sh
   ```

3. **Verify deployment:**
   ```bash
   # Check service status
   sudo systemctl status supabase-configurator
   
   # View logs
   sudo journalctl -u supabase-configurator -f
   
   # Test endpoints
   curl -k https://yourdomain.com/health
   ```

## Manual Deployment Steps

### Prerequisites

- Ubuntu 20.04+ or Debian 11+ server
- Domain name pointing to your server
- Root or sudo access
- Minimum 1GB RAM, 1 CPU core, 10GB storage

### 1. System Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx ufw fail2ban git curl

# Create service user
sudo useradd --system --home /opt/supabase-configurator --shell /bin/bash supabase-config
```

### 2. Application Setup

```bash
# Create application directory
sudo mkdir -p /opt/supabase-configurator
sudo chown supabase-config:supabase-config /opt/supabase-configurator

# Clone/copy application files
sudo -u supabase-config git clone https://github.com/yourusername/supabase-configurator.git /opt/supabase-configurator
# OR copy files manually
sudo cp -r . /opt/supabase-configurator/
sudo chown -R supabase-config:supabase-config /opt/supabase-configurator

# Set up Python environment
sudo -u supabase-config python3 -m venv /opt/supabase-configurator/.venv
sudo -u supabase-config /opt/supabase-configurator/.venv/bin/pip install --upgrade pip
sudo -u supabase-config /opt/supabase-configurator/.venv/bin/pip install -r /opt/supabase-configurator/requirements.txt
```

### 3. System Service Configuration

```bash
# Create systemd service
sudo tee /etc/systemd/system/supabase-configurator.service > /dev/null <<EOF
[Unit]
Description=Supabase Configuration Generator
After=network.target

[Service]
Type=exec
User=supabase-config
Group=supabase-config
WorkingDirectory=/opt/supabase-configurator
Environment=PATH=/opt/supabase-configurator/.venv/bin
ExecStart=/opt/supabase-configurator/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8888 --workers 2
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ReadWritePaths=/opt/supabase-configurator/logs
ProtectHome=yes

# Resource limits
LimitNOFILE=4096
MemoryMax=512M

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable supabase-configurator
sudo systemctl start supabase-configurator
```

### 4. Nginx Configuration

```bash
# Copy Nginx configuration
sudo cp nginx/supabase-configurator.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/supabase-configurator.conf /etc/nginx/sites-enabled/

# Update domain name in config
sudo sed -i 's/your-domain.com/yourdomain.com/g' /etc/nginx/sites-available/supabase-configurator.conf

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 5. SSL Certificate Setup

```bash
# Obtain Let's Encrypt certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Set up auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

### 6. Security Configuration

```bash
# Configure firewall
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# Configure fail2ban
sudo tee /etc/fail2ban/jail.d/nginx.conf > /dev/null <<EOF
[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/*error.log
findtime = 600
maxretry = 10
bantime = 3600
EOF

sudo systemctl restart fail2ban
```

### 7. Logging Setup

```bash
# Create log directory
sudo mkdir -p /opt/supabase-configurator/logs
sudo chown supabase-config:supabase-config /opt/supabase-configurator/logs

# Configure log rotation
sudo tee /etc/logrotate.d/supabase-configurator > /dev/null <<EOF
/opt/supabase-configurator/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 supabase-config supabase-config
    postrotate
        systemctl reload supabase-configurator || true
    endscript
}
EOF
```

## Docker Deployment

### Using Docker Compose

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Update application
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Manual Docker

```bash
# Build image
docker build -t supabase-configurator .

# Run container
docker run -d \
  --name supabase-configurator \
  --restart unless-stopped \
  -p 127.0.0.1:8888:8888 \
  -v $(pwd)/logs:/app/logs \
  supabase-configurator
```

## Monitoring and Maintenance

### Health Checks

```bash
# Application health
curl https://yourdomain.com/health
curl https://yourdomain.com/health/detailed

# Service status
sudo systemctl status supabase-configurator
sudo systemctl status nginx
sudo systemctl status fail2ban
```

### Log Monitoring

```bash
# Application logs
sudo journalctl -u supabase-configurator -f

# Nginx logs
sudo tail -f /var/log/nginx/supabase-configurator.access.log
sudo tail -f /var/log/nginx/supabase-configurator.error.log

# Application-specific logs
sudo tail -f /opt/supabase-configurator/logs/app.log
sudo tail -f /opt/supabase-configurator/logs/security.log
```

### Security Monitoring

```bash
# Check fail2ban status
sudo fail2ban-client status
sudo fail2ban-client status nginx-limit-req

# View firewall status
sudo ufw status verbose

# SSL certificate status
sudo certbot certificates
```

### Performance Monitoring

```bash
# System resources
htop
free -h
df -h

# Application metrics
curl https://yourdomain.com/health/detailed | jq .
```

## Backup and Updates

### Backup Strategy

```bash
# Create backup script
sudo tee /opt/backup-supabase-config.sh > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/supabase-configurator"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup application files
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" -C /opt/supabase-configurator . --exclude='.venv' --exclude='logs'

# Backup nginx configuration
cp /etc/nginx/sites-available/supabase-configurator.conf "$BACKUP_DIR/nginx_$DATE.conf"

# Backup systemd service
cp /etc/systemd/system/supabase-configurator.service "$BACKUP_DIR/service_$DATE.service"

# Keep only last 30 backups
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.conf" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.service" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR"
EOF

sudo chmod +x /opt/backup-supabase-config.sh

# Set up daily backups
echo "0 2 * * * root /opt/backup-supabase-config.sh" | sudo tee -a /etc/crontab
```

### Update Process

```bash
# 1. Backup current version
sudo /opt/backup-supabase-config.sh

# 2. Stop service
sudo systemctl stop supabase-configurator

# 3. Update code
sudo -u supabase-config git pull origin main
# OR copy new files

# 4. Update dependencies if needed
sudo -u supabase-config /opt/supabase-configurator/.venv/bin/pip install -r /opt/supabase-configurator/requirements.txt

# 5. Run tests
sudo -u supabase-config /opt/supabase-configurator/.venv/bin/python -m pytest tests/

# 6. Start service
sudo systemctl start supabase-configurator

# 7. Verify deployment
curl https://yourdomain.com/health
```

## Troubleshooting

### Common Issues

1. **Service won't start:**
   ```bash
   sudo journalctl -u supabase-configurator -n 50
   sudo systemctl status supabase-configurator
   ```

2. **SSL certificate issues:**
   ```bash
   sudo certbot certificates
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **Rate limiting issues:**
   ```bash
   sudo tail -f /var/log/nginx/supabase-configurator.error.log
   # Adjust rate limits in nginx config if needed
   ```

4. **Application errors:**
   ```bash
   sudo tail -f /opt/supabase-configurator/logs/app.log
   sudo tail -f /opt/supabase-configurator/logs/security.log
   ```

### Performance Tuning

1. **Increase worker processes** (for high traffic):
   ```bash
   # Edit systemd service
   sudo systemctl edit supabase-configurator
   
   # Add:
   [Service]
   ExecStart=
   ExecStart=/opt/supabase-configurator/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8888 --workers 4
   ```

2. **Adjust rate limits** in nginx configuration
3. **Optimize logging** levels for production

## Security Checklist

- [ ] SSL certificate installed and auto-renewing
- [ ] Firewall configured (UFW)
- [ ] Fail2ban protection active
- [ ] Service running as non-root user
- [ ] Security headers configured in Nginx
- [ ] Rate limiting implemented
- [ ] Log rotation configured
- [ ] Regular backups scheduled
- [ ] System updates automated
- [ ] Monitoring and alerting configured

## Support

For issues and questions:
- Check application logs: `/opt/supabase-configurator/logs/`
- Review system logs: `sudo journalctl -u supabase-configurator`
- Monitor health endpoints: `/health` and `/health/detailed`
- Create GitHub issues for bugs and feature requests

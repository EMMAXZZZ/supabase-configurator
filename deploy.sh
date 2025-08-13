#!/bin/bash

# Supabase Configurator Deployment Script
# This script sets up the production environment with HTTPS and Nginx

set -e  # Exit on any error

# Configuration variables
DOMAIN="your-domain.com"
EMAIL="your-email@example.com"
APP_DIR="/opt/supabase-configurator"
SERVICE_USER="supabase-config"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

echo "🚀 Starting Supabase Configurator deployment..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)" 
   exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
apt install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx ufw fail2ban

# Create service user
echo "👤 Creating service user..."
if ! id "$SERVICE_USER" &>/dev/null; then
    useradd --system --home "$APP_DIR" --shell /bin/bash "$SERVICE_USER"
fi

# Create application directory
echo "📁 Setting up application directory..."
mkdir -p "$APP_DIR"
chown "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"

# Copy application files (assumes you're running from the project directory)
echo "📋 Copying application files..."
cp -r . "$APP_DIR/"
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"

# Set up Python virtual environment
echo "🐍 Setting up Python virtual environment..."
sudo -u "$SERVICE_USER" python3 -m venv "$APP_DIR/.venv"
sudo -u "$SERVICE_USER" "$APP_DIR/.venv/bin/pip" install --upgrade pip
sudo -u "$SERVICE_USER" "$APP_DIR/.venv/bin/pip" install -r "$APP_DIR/requirements.txt"

# Create systemd service
echo "🔧 Creating systemd service..."
cat > /etc/systemd/system/supabase-configurator.service << EOF
[Unit]
Description=Supabase Configuration Generator
After=network.target

[Service]
Type=exec
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$APP_DIR
Environment=PATH=$APP_DIR/.venv/bin
ExecStart=$APP_DIR/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8888 --workers 2
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ReadWritePaths=$APP_DIR/logs
ProtectHome=yes

# Resource limits
LimitNOFILE=4096
MemoryMax=512M

[Install]
WantedBy=multi-user.target
EOF

# Create log directory
echo "📝 Setting up logging..."
mkdir -p "$APP_DIR/logs"
chown "$SERVICE_USER:$SERVICE_USER" "$APP_DIR/logs"

# Configure logrotate
cat > /etc/logrotate.d/supabase-configurator << EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 $SERVICE_USER $SERVICE_USER
    postrotate
        systemctl reload supabase-configurator || true
    endscript
}
EOF

# Configure Nginx (without SSL first)
echo "🌐 Configuring Nginx..."
cp nginx/supabase-configurator.conf "$NGINX_AVAILABLE/supabase-configurator"

# Create temporary HTTP-only config for Certbot
cat > "$NGINX_AVAILABLE/supabase-configurator-temp" << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF

# Enable temporary Nginx config
ln -sf "$NGINX_AVAILABLE/supabase-configurator-temp" "$NGINX_ENABLED/supabase-configurator"

# Test Nginx configuration
nginx -t

# Start/restart Nginx
systemctl restart nginx

# Configure firewall
echo "🔥 Configuring firewall..."
ufw --force enable
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS

# Configure fail2ban
echo "🛡️  Configuring fail2ban..."
cat > /etc/fail2ban/jail.d/nginx.conf << EOF
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

systemctl restart fail2ban

# Obtain SSL certificate
echo "🔒 Obtaining SSL certificate..."
if certbot certonly --nginx -d "$DOMAIN" -d "www.$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive; then
    echo "✅ SSL certificate obtained successfully"
    
    # Update Nginx config with actual domain
    sed -i "s/your-domain.com/$DOMAIN/g" "$NGINX_AVAILABLE/supabase-configurator"
    
    # Enable the full HTTPS config
    ln -sf "$NGINX_AVAILABLE/supabase-configurator" "$NGINX_ENABLED/supabase-configurator"
    rm -f "$NGINX_ENABLED/supabase-configurator-temp"
    
    # Test and reload Nginx
    nginx -t && systemctl reload nginx
else
    echo "❌ Failed to obtain SSL certificate. Check your DNS settings."
    echo "You can manually run: certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN"
fi

# Set up automatic certificate renewal
echo "🔄 Setting up certificate auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Start and enable services
echo "🚀 Starting services..."
systemctl daemon-reload
systemctl enable supabase-configurator
systemctl start supabase-configurator

# Final status check
echo "🔍 Checking service status..."
systemctl status supabase-configurator --no-pager -l
systemctl status nginx --no-pager -l

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "Your application should now be available at:"
echo "  https://$DOMAIN"
echo "  https://www.$DOMAIN"
echo ""
echo "Important next steps:"
echo "1. Update DNS records to point $DOMAIN to this server's IP"
echo "2. Replace 'your-domain.com' and 'your-email@example.com' in this script"
echo "3. Test the application and SSL certificate"
echo "4. Monitor logs: journalctl -u supabase-configurator -f"
echo "5. Check certificate auto-renewal: certbot certificates"
echo ""
echo "Security features enabled:"
echo "- SSL/TLS encryption with Let's Encrypt"
echo "- Rate limiting via Nginx"
echo "- Security headers"
echo "- Firewall (UFW) configured"
echo "- Fail2ban protection"
echo "- Service user with restricted permissions"
echo "- Log rotation"
echo ""

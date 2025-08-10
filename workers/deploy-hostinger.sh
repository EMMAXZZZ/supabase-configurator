#!/bin/bash

# Hostinger VPS Supabase Deployment Script
# Complete automated setup for Ubuntu/Debian systems

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="supabase-instance"
DOMAIN=""
EMAIL=""
INSTALL_NGINX=true
SETUP_SSL=true
SETUP_FIREWALL=true

# Log function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root. Please run as a regular user with sudo privileges."
    fi
}

# System requirements check
check_system() {
    log "Checking system requirements..."
    
    # Check OS
    if [[ ! -f /etc/os-release ]]; then
        error "Cannot determine OS version"
    fi
    
    source /etc/os-release
    if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
        warn "This script is optimized for Ubuntu/Debian. Proceed with caution."
    fi
    
    # Check memory
    MEMORY_GB=$(free -g | awk 'NR==2{printf "%.0f", $2}')
    if (( MEMORY_GB < 4 )); then
        warn "Less than 4GB RAM detected. Supabase may run slowly."
    fi
    
    # Check disk space
    DISK_GB=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
    if (( DISK_GB < 20 )); then
        error "At least 20GB free disk space required"
    fi
    
    log "System check passed ✓"
}

# Update system packages
update_system() {
    log "Updating system packages..."
    sudo apt update
    sudo apt upgrade -y
    sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
}

# Install Docker and Docker Compose
install_docker() {
    log "Installing Docker..."
    
    if command -v docker &> /dev/null; then
        log "Docker already installed"
        return
    fi
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    # Install Docker Compose
    log "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    log "Docker installation completed ✓"
}

# Setup firewall
setup_firewall() {
    if [[ "$SETUP_FIREWALL" == false ]]; then
        return
    fi
    
    log "Configuring UFW firewall..."
    
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH
    sudo ufw allow ssh
    sudo ufw allow 22/tcp
    
    # Allow HTTP/HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Allow Supabase services
    sudo ufw allow 3000/tcp  # Studio
    sudo ufw allow 8000/tcp  # Kong API
    sudo ufw allow 5432/tcp  # PostgreSQL (optional, for external access)
    
    sudo ufw --force enable
    log "Firewall configured ✓"
}

# Install and configure Nginx
install_nginx() {
    if [[ "$INSTALL_NGINX" == false ]]; then
        return
    fi
    
    log "Installing and configuring Nginx..."
    
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    
    # Create Nginx configuration for Supabase
    if [[ -n "$DOMAIN" ]]; then
        sudo tee /etc/nginx/sites-available/supabase > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # SSL configuration (certificates will be added by Certbot)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Studio (Dashboard)
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # API Gateway
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support for Realtime
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Increase upload size for storage
    client_max_body_size 50M;
}
EOF
        
        sudo ln -sf /etc/nginx/sites-available/supabase /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        sudo nginx -t && sudo systemctl reload nginx
        
        log "Nginx configured for domain: $DOMAIN ✓"
    fi
}

# Setup SSL with Let's Encrypt
setup_ssl() {
    if [[ "$SETUP_SSL" == false ]] || [[ -z "$DOMAIN" ]] || [[ -z "$EMAIL" ]]; then
        warn "Skipping SSL setup (missing domain or email)"
        return
    fi
    
    log "Setting up SSL certificate with Let's Encrypt..."
    
    # Install Certbot
    sudo apt install -y snapd
    sudo snap install --classic certbot
    sudo ln -sf /snap/bin/certbot /usr/bin/certbot
    
    # Obtain certificate
    sudo certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect
    
    # Setup auto-renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
    
    log "SSL certificate configured ✓"
}

# Create project directory and files
setup_project() {
    log "Setting up Supabase project..."
    
    mkdir -p ~/$PROJECT_NAME
    cd ~/$PROJECT_NAME
    
    # Create directory structure
    mkdir -p volumes/{api,db,functions,logs,storage}
    
    # Check if configuration files exist
    if [[ ! -f .env ]]; then
        error "Please place your generated .env file in the current directory before running this script"
    fi
    
    if [[ ! -f docker-compose.yml ]] && [[ ! -f docker-compose.hostinger.yml ]]; then
        error "Please place your docker-compose.yml file in the current directory before running this script"
    fi
    
    # Use Hostinger-optimized compose file if available
    if [[ -f docker-compose.hostinger.yml ]] && [[ ! -f docker-compose.yml ]]; then
        cp docker-compose.hostinger.yml docker-compose.yml
    fi
    
    # Create functions directory with example
    mkdir -p volumes/functions/main
    cat > volumes/functions/main/index.ts << 'EOF'
// Example Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { name } = await req.json()
  
  return new Response(
    JSON.stringify({ message: `Hello ${name}!` }),
    { headers: { "Content-Type": "application/json" } },
  )
})
EOF
    
    log "Project structure created ✓"
}

# Start Supabase services
start_services() {
    log "Starting Supabase services..."
    
    cd ~/$PROJECT_NAME
    
    # Pull images first
    docker-compose pull
    
    # Start services
    docker-compose up -d
    
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Check service status
    docker-compose ps
    
    # Wait for database to be ready
    log "Waiting for database initialization..."
    timeout=300
    while ! docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1; do
        sleep 5
        timeout=$((timeout - 5))
        if [ $timeout -le 0 ]; then
            error "Database startup timeout"
        fi
    done
    
    log "Supabase services started successfully ✓"
}

# Setup monitoring and logging
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create log rotation for Docker
    sudo tee /etc/logrotate.d/docker > /dev/null <<EOF
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF
    
    # Create system monitoring script
    cat > ~/$PROJECT_NAME/monitor.sh << 'EOF'
#!/bin/bash
# Simple monitoring script

cd $(dirname $0)

echo "=== Supabase Service Status ==="
docker-compose ps

echo -e "\n=== Resource Usage ==="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo -e "\n=== Disk Usage ==="
df -h /var/lib/docker

echo -e "\n=== Recent Logs ==="
docker-compose logs --tail=10
EOF
    
    chmod +x ~/$PROJECT_NAME/monitor.sh
    
    log "Monitoring setup completed ✓"
}

# Display final information
show_completion_info() {
    log "🎉 Supabase deployment completed successfully!"
    
    echo -e "\n${BLUE}=================== DEPLOYMENT INFO ===================${NC}"
    echo -e "${GREEN}Project Directory:${NC} ~/$PROJECT_NAME"
    
    if [[ -n "$DOMAIN" ]]; then
        echo -e "${GREEN}Studio URL:${NC} https://$DOMAIN"
        echo -e "${GREEN}API URL:${NC} https://$DOMAIN/api"
    else
        echo -e "${GREEN}Studio URL:${NC} http://$(curl -s ifconfig.me):3000"
        echo -e "${GREEN}API URL:${NC} http://$(curl -s ifconfig.me):8000"
    fi
    
    echo -e "\n${BLUE}================= USEFUL COMMANDS =================${NC}"
    echo -e "${YELLOW}Check services:${NC} cd ~/$PROJECT_NAME && docker-compose ps"
    echo -e "${YELLOW}View logs:${NC} cd ~/$PROJECT_NAME && docker-compose logs -f"
    echo -e "${YELLOW}Stop services:${NC} cd ~/$PROJECT_NAME && docker-compose down"
    echo -e "${YELLOW}Restart services:${NC} cd ~/$PROJECT_NAME && docker-compose restart"
    echo -e "${YELLOW}Monitor system:${NC} ~/$PROJECT_NAME/monitor.sh"
    
    echo -e "\n${BLUE}================== IMPORTANT NOTES ==================${NC}"
    echo -e "${RED}1.${NC} Keep your .env file secure and backed up"
    echo -e "${RED}2.${NC} Regular backups: docker-compose exec db pg_dump -U postgres > backup.sql"
    echo -e "${RED}3.${NC} Monitor resource usage with the monitor.sh script"
    echo -e "${RED}4.${NC} Check logs regularly for any issues"
    
    if [[ -n "$DOMAIN" ]]; then
        echo -e "${RED}5.${NC} SSL certificate will auto-renew via cron job"
    fi
    
    echo -e "\n${GREEN}Happy building with Supabase! 🚀${NC}"
}

# Main execution
main() {
    log "Starting Hostinger VPS Supabase deployment..."
    
    # Get user inputs
    read -p "Enter your domain name (e.g., supabase.yourdomain.com) or press Enter to skip: " DOMAIN
    if [[ -n "$DOMAIN" ]]; then
        read -p "Enter your email address for SSL certificate: " EMAIL
    fi
    
    check_root
    check_system
    update_system
    install_docker
    setup_firewall
    install_nginx
    setup_ssl
    setup_project
    start_services
    setup_monitoring
    show_completion_info
    
    log "Deployment script completed! 🎉"
}

# Run main function
main "$@"

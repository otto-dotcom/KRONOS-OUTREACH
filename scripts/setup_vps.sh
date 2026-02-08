#!/bin/bash
# KRONOS VPS Setup Script
# Optimized for Hostinger KVM 2 (Ubuntu 22.04) or fresh Hetzner CX31

set -e

echo "=== KRONOS n8n Self-Hosting Setup ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo ./setup_vps.sh)"
    exit 1
fi

# Prompt for domain
read -p "Enter your n8n domain (e.g., n8n.yourdomain.com): " N8N_HOST
read -p "Enter n8n admin username: " N8N_USER
read -sp "Enter n8n admin password: " N8N_PASSWORD
echo ""

# Update system
echo "[1/6] Updating system..."
apt update && apt upgrade -y

# Install Docker
echo "[2/6] Installing Docker..."
apt install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable Docker
systemctl enable docker
systemctl start docker

# Create app directory
echo "[3/6] Setting up KRONOS directory..."
mkdir -p /opt/kronos
cd /opt/kronos

# Create .env file
echo "[4/6] Creating environment file..."
cat > .env << EOF
N8N_HOST=${N8N_HOST}
N8N_USER=${N8N_USER}
N8N_PASSWORD=${N8N_PASSWORD}
EOF
chmod 600 .env

# Download docker-compose.yml and Caddyfile
echo "[5/6] Downloading configuration files..."
# You would normally curl these from your repo
# For now, copy the files from the KRONOS-OUTREACH repo

cat > docker-compose.yml << 'COMPOSE'
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: kronos-n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://${N8N_HOST}/
      - GENERIC_TIMEZONE=Europe/Zurich
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=168
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - kronos-network

  caddy:
    image: caddy:2-alpine
    container_name: kronos-caddy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - kronos-network
    depends_on:
      - n8n

volumes:
  n8n_data:
  caddy_data:
  caddy_config:

networks:
  kronos-network:
    driver: bridge
COMPOSE

cat > Caddyfile << CADDY
${N8N_HOST} {
    reverse_proxy n8n:5678
    encode gzip
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
    }
}
CADDY

# Start services
echo "[6/6] Starting KRONOS n8n..."
docker compose up -d

echo ""
echo "=== Setup Complete ==="
echo ""
echo "n8n is now running at: https://${N8N_HOST}"
echo "Username: ${N8N_USER}"
echo "Password: (the one you entered)"
echo ""
echo "IMPORTANT: Make sure your DNS A record points ${N8N_HOST} to this server's IP"
echo ""
echo "To check status: docker compose logs -f"
echo "To stop: docker compose down"
echo "To update: docker compose pull && docker compose up -d"

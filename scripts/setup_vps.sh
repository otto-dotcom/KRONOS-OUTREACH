#!/bin/bash
# KRONOS VPS Setup & Hardening Script
# Optimized for Hostinger KVM 2 (Ubuntu 22.04) or fresh Hetzner CX31
# Implements KRONOS DEPLOYMENT PROTOCOL DOMAIN security standards

set -e

echo "=== KRONOS n8n Infrastructure Hardening & Setup ==="
echo ""

# ---------------------------------------------------------
# 1. INITIAL CHECKS & PROMPTS
# ---------------------------------------------------------

if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo ./setup_vps.sh)"
    exit 1
fi

read -p "Enter your n8n domain (e.g., n8n.yourdomain.com): " N8N_HOST
read -p "Enter new admin username (e.g., kronosadmin): " KRONOS_USER
read -sp "Enter password for $KRONOS_USER: " KRONOS_PASS
echo ""
read -p "Enter custom SSH Port (e.g., 2299, default is 22): " SSH_PORT

SSH_PORT=${SSH_PORT:-22}
N8N_USER="admin"

# Generate a strong automatic password for n8n to avoid weak passwords
N8N_PASSWORD=$(openssl rand -base64 24)

echo ""
echo "-----------------------------------"
echo "Deployment Settings Summary:"
echo "Domain: $N8N_HOST"
echo "Admin User: $KRONOS_USER"
echo "SSH Port: $SSH_PORT"
echo "-----------------------------------"
read -p "Press Enter to continue..."

# ---------------------------------------------------------
# 2. SYSTEM UPDATES & USER MANAGEMENT
# ---------------------------------------------------------
echo "[1/8] Updating system & creating secure user..."

apt update && DEBIAN_FRONTEND=noninteractive apt upgrade -y

# Create user if it doesn't exist
if id "$KRONOS_USER" &>/dev/null; then
    echo "User $KRONOS_USER already exists."
else
    useradd -m -s /bin/bash "$KRONOS_USER"
    echo "$KRONOS_USER:$KRONOS_PASS" | chpasswd
    usermod -aG sudo "$KRONOS_USER"
    
    # Copy root's authorized keys to new user
    mkdir -p /home/$KRONOS_USER/.ssh
    if [ -f /root/.ssh/authorized_keys ]; then
        cp /root/.ssh/authorized_keys /home/$KRONOS_USER/.ssh/
        chown -R $KRONOS_USER:$KRONOS_USER /home/$KRONOS_USER/.ssh
        chmod 700 /home/$KRONOS_USER/.ssh
        chmod 600 /home/$KRONOS_USER/.ssh/authorized_keys
    fi
fi

# ---------------------------------------------------------
# 3. SSH HARDENING
# ---------------------------------------------------------
echo "[2/8] Hardening SSH configuration..."

# Change SSH port
sed -i "s/^#Port 22/Port $SSH_PORT/" /etc/ssh/sshd_config
sed -i "s/^Port 22/Port $SSH_PORT/" /etc/ssh/sshd_config

# Disable Root Login
sed -i 's/^PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config

# Restart SSH service
systemctl restart sshd || systemctl restart ssh

# ---------------------------------------------------------
# 4. FIREWALL (UFW)
# ---------------------------------------------------------
echo "[3/8] Configuring UFW Firewall..."

apt install ufw -y
# Reset ufw to default state
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow necessary ports
ufw allow $SSH_PORT/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable

# ---------------------------------------------------------
# 5. INTRUSION PREVENTION (FAIL2BAN)
# ---------------------------------------------------------
echo "[4/8] Installing and configuring Fail2Ban..."

apt install fail2ban -y
systemctl enable fail2ban

cat > /etc/fail2ban/jail.local << EOF
[sshd]
enabled = true
port = $SSH_PORT
logpath = %(sshd_log)s
backend = %(sshd_backend)s
maxretry = 3
bantime = 3600
findtime = 600
EOF

systemctl restart fail2ban

# ---------------------------------------------------------
# 6. AUTO UPDATES
# ---------------------------------------------------------
echo "[5/8] Configuring unattended security updates..."

apt install unattended-upgrades -y
dpkg-reconfigure -f noninteractive unattended-upgrades

# ---------------------------------------------------------
# 7. DOCKER SETUP (N8N + NGINX)
# ---------------------------------------------------------
echo "[6/8] Installing Docker..."
apt install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker
usermod -aG docker $KRONOS_USER

echo "[7/8] Setting up KRONOS App Directory..."
mkdir -p /opt/kronos/nginx
cd /opt/kronos

cat > .env << EOF
N8N_HOST=${N8N_HOST}
N8N_USER=${N8N_USER}
N8N_PASSWORD=${N8N_PASSWORD}
EOF
chmod 600 .env
chown -R $KRONOS_USER:$KRONOS_USER /opt/kronos

cat > docker-compose.yml << 'COMPOSE'
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:1.76.1
    container_name: kronos-n8n
    restart: always
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

  nginx:
    image: nginx:alpine
    container_name: kronos-proxy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - certbot_data:/etc/letsencrypt
    networks:
      - kronos-network
    depends_on:
      - n8n

  certbot:
    image: certbot/certbot
    container_name: certbot
    volumes:
      - certbot_data:/etc/letsencrypt
    command: certonly --webroot --webroot-path=/var/www/certbot --email admin@${N8N_HOST} --agree-tos --no-eff-email -d ${N8N_HOST}

volumes:
  n8n_data:
  certbot_data:

networks:
  kronos-network:
    driver: bridge
COMPOSE

# Setup Nginx Config
cat > nginx/nginx.conf << NGINX
worker_processes auto;
events {
    worker_connections 1024;
}

http {
    include mime.types;
    default_type application/octet-stream;
    
    # Hide Nginx version
    server_tokens off;
    
    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;

    server {
        listen 80;
        server_name ${N8N_HOST};

        location ~ /.well-known/acme-challenge {
            allow all;
            root /var/www/certbot;
        }

        location / {
            return 301 https://\$host\$request_uri;
        }
    }

    server {
        listen 443 ssl http2;
        server_name ${N8N_HOST};

        ssl_certificate /etc/letsencrypt/live/${N8N_HOST}/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/${N8N_HOST}/privkey.pem;

        # Basic limits for entire server
        client_max_body_size 50m;

        location / {
            proxy_pass http://n8n:5678;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;

            # WebSockets support
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_read_timeout 86400;

            # Rate Limit APIs and Webhooks
            limit_req zone=api burst=20 nodelay;
        }
    }
}
NGINX

# ---------------------------------------------------------
# 8. LAUNCH & SSL
# ---------------------------------------------------------
echo "[8/8] Generating temporary SSL & Starting KRONOS n8n..."

# Create a dummy cert first so Nginx can start, then request real cert with Certbot
mkdir -p /opt/kronos/nginx/certbot
docker run --rm -v certbot_data:/etc/letsencrypt alpine sh -c "mkdir -p /etc/letsencrypt/live/${N8N_HOST} && echo '' > /etc/letsencrypt/live/${N8N_HOST}/fullchain.pem && echo '' > /etc/letsencrypt/live/${N8N_HOST}/privkey.pem"

chown -R $KRONOS_USER:$KRONOS_USER /opt/kronos

# Su to kronosadmin to run Docker compose up
su - $KRONOS_USER -c "cd /opt/kronos && docker compose up -d nginx n8n"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "n8n UI Credentials:"
echo "Username: ${N8N_USER}"
echo "Password: ${N8N_PASSWORD}"
echo "Save this securely! The n8n panel is auto-generated."
echo ""
echo "SSH Access:"
echo "User: ${KRONOS_USER}"
echo "Port: ${SSH_PORT}"
echo "Example: ssh -p ${SSH_PORT} ${KRONOS_USER}@<your-ip>"
echo "NOTE: root login via SSH is now disabled."
echo ""
echo "IMPORTANT: Make sure your DNS A record points ${N8N_HOST} to this server's IP."
echo "Wait for DNS to propagate, then run the following to request a real SSL cert:"
echo "cd /opt/kronos && docker compose run --rm certbot"
echo "docker compose restart nginx"
echo ""

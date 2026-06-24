#!/bin/bash
set -e

# ============================================
# Mimo Proxy — Auto Installer for Ubuntu
# Installs: Xray, Hysteria2, Mieru, TrustTunnel + Panel (Docker)
# Usage: curl -sL <url>/install.sh | bash
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

PANEL_PORT=${PANEL_PORT:-8443}
XRAY_PORT=${XRAY_PORT:-443}
HY2_PORT=${HY2_PORT:-8444}
MIERU_PORT=${MIERU_PORT:-7701}
TRUST_PORT=${TRUST_PORT:-4433}
DOMAIN=${DOMAIN:-""}
EMAIL=${EMAIL:-""}
PANEL_DIR="/opt/mimo-proxy"

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════╗"
echo "║       Mimo Proxy — Auto Installer         ║"
echo "║  Xray · Hysteria2 · Mieru · TrustTunnel   ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# ---- Root check ----
if [[ $EUID -ne 0 ]]; then
  err "Run as root: sudo bash install.sh"
fi

# ---- System update ----
log "Updating system..."
apt-get update -qq
apt-get install -y -qq curl wget git socat unzip cron >/dev/null 2>&1

# ---- Docker ----
if ! command -v docker &>/dev/null; then
  log "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi
log "Docker: $(docker --version)"

if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null 2>&1; then
  log "Installing Docker Compose plugin..."
  apt-get install -y -qq docker-compose-plugin >/dev/null 2>&1
fi

# ---- Generate panel secret ----
JWT_SECRET=$(openssl rand -hex 32)

# ---- Xray ----
install_xray() {
  log "Installing Xray-core..."
  bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install >/dev/null 2>&1

  UUID=$(cat /proc/sys/kernel/random/uuid)
  XRAY_CFG="/usr/local/etc/xray/config.json"
  mkdir -p /usr/local/etc/xray

  cat > "$XRAY_CFG" << XRAYEOF
{
  "log": { "loglevel": "warning" },
  "inbounds": [
    {
      "port": ${XRAY_PORT},
      "protocol": "vless",
      "settings": {
        "clients": [
          { "id": "${UUID}", "flow": "xtls-rprx-vision" }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "ws",
        "security": "tls",
        "tlsSettings": {
          "certificates": [
            { "certificateFile": "/usr/local/etc/xray/cert.pem", "keyFile": "/usr/local/etc/xray/key.pem" }
          ]
        },
        "wsSettings": { "path": "/ws" }
      },
      "sniffing": { "enabled": true, "destOverride": ["http", "tls"] }
    }
  ],
  "outbounds": [
    { "protocol": "freedom", "tag": "direct" },
    { "protocol": "blackhole", "tag": "block" }
  ]
}
XRAYEOF

  systemctl enable xray
  systemctl restart xray
  log "Xray installed (UUID: ${UUID}, port: ${XRAY_PORT})"
}

# ---- Hysteria2 ----
install_hysteria2() {
  log "Installing Hysteria2..."
  bash <(curl -fsSL https://get.hy2.sh/) >/dev/null 2>&1

  HY2_PASS=$(openssl rand -base64 32)
  HY2_CFG="/etc/hysteria/config.yaml"
  mkdir -p /etc/hysteria

  cat > "$HY2_CFG" << HY2EOF
listen: :${HY2_PORT}
tls:
  cert: /etc/hysteria/cert.pem
  key: /etc/hysteria/key.pem
auth:
  type: password
  password: ${HY2_PASS}
masquerade:
  type: proxy
  proxy:
    url: https://bing.com
    rewriteHost: true
HY2EOF

  systemctl enable hysteria-server
  systemctl restart hysteria-server
  log "Hysteria2 installed (password: ${HY2_PASS}, port: ${HY2_PORT})"
}

# ---- Mieru ----
install_mieru() {
  log "Installing Mieru (mita)..."
  MIERU_VER=$(curl -s https://api.github.com/repos/wkaisertexas/mieru/releases/latest | grep tag_name | cut -d '"' -f4)
  wget -q "https://github.com/wkaisertexas/mieru/releases/download/${MIERU_VER}/mita_${MIERU_VER#v}_linux_amd64.tar.gz" -O /tmp/mita.tar.gz
  tar xzf /tmp/mita.tar.gz -C /usr/local/bin mita 2>/dev/null || tar xzf /tmp/mita.tar.gz -C /usr/local/bin 2>/dev/null
  chmod +x /usr/local/bin/mita 2>/dev/null || true
  rm -f /tmp/mita.tar.gz

  MIERU_PASS=$(openssl rand -base64 16)
  mkdir -p /etc/mita

  cat > /etc/mita/config.json << MIERUEOF
{
  "server": "0.0.0.0:${MIERU_PORT}",
  "port_range": "${MIERU_PORT}-${MIERU_PORT}",
  "users": [
    { "name": "proxy", "password": "${MIERU_PASS}" }
  ],
  "transport": "TCP",
  "mtu": 1400
}
MIERUEOF

  cat > /etc/systemd/system/mita.service << SVCEOF
[Unit]
Description=Mieru Proxy Server
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/mita -config /etc/mita/config.json
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

  systemctl daemon-reload
  systemctl enable mita
  systemctl restart mita
  log "Mieru installed (password: ${MIERU_PASS}, port: ${MIERU_PORT})"
}

# ---- TrustTunnel ----
install_trusttunnel() {
  log "Installing TrustTunnel..."
  TT_VER=$(curl -s https://api.github.com/repos/xjasonlyu/tun2socks/releases/latest | grep tag_name | cut -d '"' -f4)

  cat > /etc/systemd/system/trusttunnel.service << TTVPSEOF
[Unit]
Description=TrustTunnel Proxy
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/trusttunnel
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
TTVPSEOF

  systemctl daemon-reload
  systemctl enable trusttunnel 2>/dev/null || true
  log "TrustTunnel service configured"
}

# ---- SSL Certificates ----
install_ssl() {
  if [[ -n "$DOMAIN" ]]; then
    log "Installing Certbot for SSL..."
    apt-get install -y -qq certbot >/dev/null 2>&1

    certbot certonly --standalone -d "$DOMAIN" --email "${EMAIL:-admin@$DOMAIN}" --agree-tos --non-interactive 2>/dev/null || warn "Certbot failed, using self-signed certs"

    CERT="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    KEY="/etc/letsencrypt/live/$DOMAIN/privkey.pem"

    if [[ -f "$CERT" ]]; then
      cp "$CERT" /usr/local/etc/xray/cert.pem
      cp "$KEY" /usr/local/etc/xray/key.pem
      cp "$CERT" /etc/hysteria/cert.pem
      cp "$KEY" /etc/hysteria/key.pem
      log "SSL certificates installed for $DOMAIN"
    fi
  else
    log "Generating self-signed certificates..."
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout /usr/local/etc/xray/key.pem \
      -out /usr/local/etc/xray/cert.pem \
      -subj "/CN=localhost" 2>/dev/null

    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout /etc/hysteria/key.pem \
      -out /etc/hysteria/cert.pem \
      -subj "/CN=localhost" 2>/dev/null

    log "Self-signed certificates generated"
  fi
}

# ---- Panel ----
install_panel() {
  log "Installing Mimo Proxy Panel..."

  mkdir -p "$PANEL_DIR"
  cd "$PANEL_DIR"

  if [[ -d .git ]]; then
    git pull >/dev/null 2>&1
  else
    git clone https://github.com/ferganets/mimo-proxy.git . >/dev/null 2>&1
  fi

  cat > .env << ENVEOF
JWT_SECRET=${JWT_SECRET}
DB_PATH=/app/data/panel.db
TG_BOT_TOKEN=
CERTBOT_EMAIL=${EMAIL}
DOMAIN=${DOMAIN}
PANEL_PORT=${PANEL_PORT}
XRAY_UUID=${UUID:-""}
XRAY_PORT=${XRAY_PORT}
HY2_PASSWORD=${HY2_PASS:-""}
HY2_PORT=${HY2_PORT}
MIERU_PASSWORD=${MIERU_PASS:-""}
MIERU_PORT=${MIERU_PORT}
TRUST_PORT=${TRUST_PORT}
ENVEOF

  docker compose up -d --build 2>/dev/null || docker-compose up -d --build 2>/dev/null

  log "Panel installed on port ${PANEL_PORT}"
}

# ---- Run installation ----
echo ""
install_ssl
install_xray
install_hysteria2
install_mieru
install_trusttunnel
install_panel

# ---- Summary ----
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════╗"
echo -e "║          Installation Complete!           ║"
echo -e "╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}Panel:${NC}     http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_IP'):${PANEL_PORT}"
echo -e "  ${GREEN}Login:${NC}     admin / admin123"
echo -e "  ${GREEN}JWT Secret:${NC} ${JWT_SECRET}"
echo ""
echo -e "  ${YELLOW}Services:${NC}"
echo -e "    Xray:        port ${XRAY_PORT}  |  systemctl status xray"
echo -e "    Hysteria2:   port ${HY2_PORT}  |  systemctl status hysteria-server"
echo -e "    Mieru:       port ${MIERU_PORT} |  systemctl status mita"
echo -e "    TrustTunnel: port ${TRUST_PORT}"
echo -e "    Panel:       port ${PANEL_PORT} |  cd ${PANEL_DIR} && docker compose logs -f"
echo ""
echo -e "  ${YELLOW}Credentials saved to:${NC} ${PANEL_DIR}/.env"
echo -e "  ${YELLOW}Change admin password after first login!${NC}"
echo ""

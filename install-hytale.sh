#!/bin/bash
# HyFern Hytale Server Installer
# Uses the bundled hytale-downloader to fetch server files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HYTFERN_DATA_DIR="${HYTFERN_DATA_DIR:-$SCRIPT_DIR/data/hytale}"
DOWNLOADER="$SCRIPT_DIR/hytale-downloader-linux-amd64"
CREDENTIALS_FILE="$SCRIPT_DIR/.hytale-downloader-credentials.json"

echo "=========================================="
echo "HyFern Hytale Server Installer"
echo "=========================================="

mkdir -p "$HYTFERN_DATA_DIR"

echo ""
echo "Target: $HYTFERN_DATA_DIR"
echo ""

# Check if server files already exist
if [ -f "$HYTFERN_DATA_DIR/HytaleServer.jar" ] && \
   [ -f "$HYTFERN_DATA_DIR/Assets.zip" ]; then
    echo "Server files already present!"
    ls -lh "$HYTFERN_DATA_DIR/"*.jar "$HYTFERN_DATA_DIR/"*.zip "$HYTFERN_DATA_DIR/"*.aot 2>/dev/null || true
    echo ""
    echo "To re-download, run: rm -rf $HYTFERN_DATA_DIR/*"
    exit 0
fi

# Check if downloader exists
if [ ! -f "$DOWNLOADER" ]; then
    echo "Error: hytale-downloader-linux-amd64 not found!"
    echo "Download from: https://downloader.hytale.com/hytale-downloader.zip"
    exit 1
fi

chmod +x "$DOWNLOADER"

echo "Starting Hytale downloader..."
echo ""

# Run the downloader - it will handle auth flow
cd "$HYTFERN_DATA_DIR"

# Copy existing credentials if available
if [ -f "$CREDENTIALS_FILE" ] && [ ! -f "$HYTFERN_DATA_DIR/.hytale-downloader-credentials.json" ]; then
    cp "$CREDENTIALS_FILE" "$HYTFERN_DATA_DIR/"
fi

# Use embedded downloader
"$DOWNLOADER" -skip-update-check -download-path hytale-game.zip

# Find and extract the zip
echo ""
echo "Extracting files..."

# Rename any zip file to game.zip for extraction (downloader's naming can vary)
for f in *.zip; do
    if [ -f "$f" ] && [ "$f" != "Assets.zip" ]; then
        mv "$f" game.zip
    fi
done

if [ -f "game.zip" ]; then
    unzip -o game.zip
    rm -f game.zip
fi

# Move Server folder contents to root if it exists
if [ -d "Server" ]; then
    if [ -f "Server/HytaleServer.jar" ]; then
        mv Server/HytaleServer.jar .
    fi
    if [ -f "Server/HytaleServer.aot" ]; then
        mv Server/HytaleServer.aot .
    fi
    rm -rf Server
fi

# Check for required files
if [ -f "HytaleServer.jar" ] && [ -f "Assets.zip" ]; then
    echo "Download complete!"
    ls -lh HytaleServer.jar Assets.zip HytaleServer.aot 2>/dev/null || true
    
    # Copy credentials back for future runs
    if [ -f "$HYTFERN_DATA_DIR/.hytale-downloader-credentials.json" ] && [ ! -f "$CREDENTIALS_FILE" ]; then
        cp "$HYTFERN_DATA_DIR/.hytale-downloader-credentials.json" "$CREDENTIALS_FILE"
    fi
else
    echo "Warning: Expected files not found in $HYTFERN_DATA_DIR"
    ls -la
    echo ""
    echo "If download failed, check authentication and re-run this script."
    exit 1
fi

echo ""
echo "=========================================="
echo "Installing WebServer Plugins..."
echo "=========================================="

# Create mods directory
mkdir -p mods

# Download Nitrado WebServer plugin
echo "Downloading Nitrado WebServer plugin..."
curl -L -o mods/nitrado-webserver-1.1.1.jar \
    https://github.com/nitrado/hytale-plugin-webserver/releases/download/v1.1.1/nitrado-webserver-1.1.1.jar

# Download Nitrado Query plugin
echo "Downloading Nitrado Query plugin..."
curl -L -o mods/nitrado-query-1.1.0.jar \
    https://github.com/nitrado/hytale-plugin-query/releases/download/v1.1.0/nitrado-query-1.1.0.jar

# Download ApexHosting PrometheusExporter plugin
echo "Downloading ApexHosting PrometheusExporter plugin..."
curl -L -o mods/apexhosting-prometheusexporter-1.0.0.jar \
    https://github.com/apexhosting/hytale-plugin-prometheus/releases/download/v1.0.0/apexhosting-prometheusexporter-1.0.0.jar

# Create plugin config directories and config files
mkdir -p mods/Nitrado_WebServer
mkdir -p mods/Nitrado_Query
mkdir -p mods/ApexHosting_PrometheusExporter

# WebServer plugin config
cat > mods/Nitrado_WebServer/config.json << 'EOF'
{
  "BindHost": "0.0.0.0",
  "BindPort": 5523,
  "EnableTls": false
}
EOF

# Query plugin config
cat > mods/Nitrado_Query/config.json << 'EOF'
{
  "BindHost": "0.0.0.0",
  "BindPort": 5523,
  "EnableTls": false
}
EOF

# Prometheus exporter config
cat > mods/ApexHosting_PrometheusExporter/config.json << 'EOF'
{
  "BindHost": "0.0.0.0",
  "BindPort": 5523,
  "EnableTls": false
}
EOF

echo "Plugins installed successfully!"
ls -lh mods/*.jar

echo ""
echo "=========================================="
echo "Authenticating Hytale Server..."
echo "=========================================="

# Create tokens directory
mkdir -p "$HYTFERN_DATA_DIR/tokens"
TOKENS_FILE="$HYTFERN_DATA_DIR/tokens/server-tokens.env"

# Function to authenticate with Hytale OAuth
authenticate_hytale_server() {
    echo "Checking for existing tokens..."
    
    # Check if tokens already exist and are not expired
    if [ -f "$TOKENS_FILE" ]; then
        source "$TOKENS_FILE"
        if [ -n "$HYTALE_SERVER_SESSION_TOKEN" ] && [ -n "$HYTALE_SERVER_IDENTITY_TOKEN" ]; then
            echo "Existing tokens found! They will be used by the server."
            echo "To re-authenticate, delete: $TOKENS_FILE"
            return 0
        fi
    fi
    
    echo "No valid tokens found. Starting OAuth device code flow..."
    echo ""
    echo "NOTE: You need a Hytale account with server entitlements to authenticate."
    echo ""
    
    # Step 1: Request device code
    echo "Step 1: Requesting device code from Hytale..."
    
    DEVICE_CODE_RESPONSE=$(curl -s -X POST "https://oauth.accounts.hytale.com/oauth2/device/auth" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "client_id=hytale-server" \
        -d "scope=openid offline auth:server")
    
    # Extract device_code and user_code from response
    DEVICE_CODE=$(echo "$DEVICE_CODE_RESPONSE" | grep -o '"device_code":"[^"]*"' | cut -d'"' -f4)
    USER_CODE=$(echo "$DEVICE_CODE_RESPONSE" | grep -o '"user_code":"[^"]*"' | cut -d'"' -f4)
    VERIFICATION_URI=$(echo "$DEVICE_CODE_RESPONSE" | grep -o '"verification_uri":"[^"]*"' | cut -d'"' -f4)
    INTERVAL=$(echo "$DEVICE_CODE_RESPONSE" | grep -o '"interval":[0-9]*' | cut -d':' -f2)
    
    if [ -z "$DEVICE_CODE" ] || [ -z "$USER_CODE" ]; then
        echo "Error: Failed to get device code"
        echo "Response: $DEVICE_CODE_RESPONSE"
        return 1
    fi
    
    INTERVAL=${INTERVAL:-5}
    
    echo ""
    echo "=========================================="
    echo "IMPORTANT: Complete authentication in your browser"
    echo "=========================================="
    echo ""
    echo "Visit: $VERIFICATION_URI"
    echo "Or:   $VERIFICATION_URI?user_code=$USER_CODE"
    echo ""
    echo "Enter this code: $USER_CODE"
    echo ""
    echo "Waiting for authorization... (this may take a minute)"
    echo "Press Ctrl+C to cancel"
    echo ""
    
    # Step 2: Poll for token
    while true; do
        sleep "$INTERVAL"
        
        TOKEN_RESPONSE=$(curl -s -X POST "https://oauth.accounts.hytale.com/oauth2/token" \
            -H "Content-Type: application/x-www-form-urlencoded" \
            -d "client_id=hytale-server" \
            -d "grant_type=urn:ietf:params:oauth:grant-type:device_code" \
            -d "device_code=$DEVICE_CODE")
        
        # Check if we got an access token
        ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$ACCESS_TOKEN" ]; then
            echo "Authorization successful!"
            break
        fi
        
        # Check for errors
        ERROR=$(echo "$TOKEN_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        if [ "$ERROR" != "authorization_pending" ] && [ -n "$ERROR" ]; then
            echo "Error: $ERROR"
            echo "Full response: $TOKEN_RESPONSE"
            return 1
        fi
        
        echo -n "."
    done
    
    echo ""
    
    # Extract refresh token
    REFRESH_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$REFRESH_TOKEN" ]; then
        echo "Error: Failed to get refresh token"
        return 1
    fi
    
    # Step 3: Get available profiles
    echo "Step 2: Getting available game profiles..."
    
    PROFILES_RESPONSE=$(curl -s -X GET "https://account-data.hytale.com/my-account/get-profiles" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    # Extract profile UUID (first one)
    PROFILE_UUID=$(echo "$PROFILES_RESPONSE" | grep -o '"uuid":"[^"]*"' | head -1 | cut -d'"' -f4)
    PROFILE_USERNAME=$(echo "$PROFILES_RESPONSE" | grep -o '"username":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$PROFILE_UUID" ]; then
        echo "Error: Failed to get game profiles"
        echo "Response: $PROFILES_RESPONSE"
        return 1
    fi
    
    echo "Found profile: $PROFILE_USERNAME ($PROFILE_UUID)"
    
    # Step 4: Create game session
    echo "Step 3: Creating game session..."
    
    SESSION_RESPONSE=$(curl -s -X POST "https://sessions.hytale.com/game-session/new" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"uuid\": \"$PROFILE_UUID\"}")
    
    SESSION_TOKEN=$(echo "$SESSION_RESPONSE" | grep -o '"sessionToken":"[^"]*"' | cut -d'"' -f4)
    IDENTITY_TOKEN=$(echo "$SESSION_RESPONSE" | grep -o '"identityToken":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$SESSION_TOKEN" ] || [ -z "$IDENTITY_TOKEN" ]; then
        echo "Error: Failed to create game session"
        echo "Response: $SESSION_RESPONSE"
        return 1
    fi
    
    # Step 5: Save tokens
    echo "Step 4: Saving tokens..."
    
    cat > "$TOKENS_FILE" << EOF
# Hytale Server Authentication Tokens
# Generated on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Refresh these tokens before they expire (30 days)

# OAuth tokens (for refreshing)
HYTALE_OAUTH_REFRESH_TOKEN=$REFRESH_TOKEN
HYTALE_OAUTH_ACCESS_TOKEN=$ACCESS_TOKEN

# Server session tokens (used by the server)
HYTALE_SERVER_SESSION_TOKEN=$SESSION_TOKEN
HYTALE_SERVER_IDENTITY_TOKEN=$IDENTITY_TOKEN

# Profile info
HYTALE_PROFILE_UUID=$PROFILE_UUID
HYTALE_PROFILE_USERNAME=$PROFILE_USERNAME
EOF
    
    chmod 600 "$TOKENS_FILE"
    
    echo ""
    echo "Tokens saved to: $TOKENS_FILE"
    echo "IMPORTANT: These tokens expire in 30 days. Run the refresh script before then!"
    echo ""
    echo "To refresh tokens, run:"
    echo "  ./refresh-hytale-tokens.sh"
    echo ""
    
    return 0
}

# Run authentication
authenticate_hytale_server

echo ""
echo "=========================================="
echo "Server startup command:"
echo ""
echo "To start the server with authentication, source the tokens file:"
echo "  source $TOKENS_FILE && java -Xms\${HYTALE_MEMORY:-4G} -Xmx\${HYTALE_MAX_MEMORY:-6G} \\"
echo "    -XX:+Use\${HYTALE_GC:-G1GC} \\"
echo "    -XX:AOTCache=HytaleServer.aot \\"
echo "    -jar HytaleServer.jar --assets Assets.zip \\"
echo "    --session-token \"\$HYTALE_SERVER_SESSION_TOKEN\" \\"
echo "    --identity-token \"\$HYTALE_SERVER_IDENTITY_TOKEN\""
echo ""
echo "Or via Docker, the tokens are automatically loaded from the tokens file."
echo "=========================================="

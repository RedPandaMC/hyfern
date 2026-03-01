#!/bin/bash
# HyFern Hytale Token Refresh Script
# Refreshes OAuth tokens and game session tokens before they expire

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HYTFERN_DATA_DIR="${HYTFERN_DATA_DIR:-$SCRIPT_DIR/data/hytale}"
TOKENS_FILE="$HYTFERN_DATA_DIR/tokens/server-tokens.env"

echo "=========================================="
echo "HyFern Hytale Token Refresh"
echo "=========================================="
echo ""

# Check if tokens file exists
if [ ! -f "$TOKENS_FILE" ]; then
    echo "Error: No tokens file found at $TOKENS_FILE"
    echo "Run install-hytale.sh first to authenticate."
    exit 1
fi

# Source existing tokens
source "$TOKENS_FILE"

# Check if we have a refresh token
if [ -z "$HYTALE_OAUTH_REFRESH_TOKEN" ]; then
    echo "Error: No OAuth refresh token found in $TOKENS_FILE"
    echo "Please re-run install-hytale.sh to authenticate."
    exit 1
fi

echo "Current profile: $HYTALE_PROFILE_USERNAME"
echo "Token file: $TOKENS_FILE"
echo ""

# Step 1: Refresh OAuth access token using refresh token
echo "Step 1: Refreshing OAuth access token..."

TOKEN_RESPONSE=$(curl -s -X POST "https://oauth.accounts.hytale.com/oauth2/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "client_id=hytale-server" \
    -d "grant_type=refresh_token" \
    -d "refresh_token=$HYTALE_OAUTH_REFRESH_TOKEN")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
NEW_REFRESH_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "Error: Failed to refresh OAuth token"
    echo "Response: $TOKEN_RESPONSE"
    echo ""
    echo "Your refresh token may have expired. Please re-run install-hytale.sh"
    exit 1
fi

echo "OAuth token refreshed successfully!"

# Update refresh token if we got a new one
if [ -n "$NEW_REFRESH_TOKEN" ]; then
    HYTALE_OAUTH_REFRESH_TOKEN="$NEW_REFRESH_TOKEN"
fi

# Step 2: Create new game session
echo "Step 2: Creating new game session..."

SESSION_RESPONSE=$(curl -s -X POST "https://sessions.hytale.com/game-session/new" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"uuid\": \"$HYTALE_PROFILE_UUID\"}")

SESSION_TOKEN=$(echo "$SESSION_RESPONSE" | grep -o '"sessionToken":"[^"]*"' | cut -d'"' -f4)
IDENTITY_TOKEN=$(echo "$SESSION_RESPONSE" | grep -o '"identityToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$SESSION_TOKEN" ] || [ -z "$IDENTITY_TOKEN" ]; then
    echo "Error: Failed to create game session"
    echo "Response: $SESSION_RESPONSE"
    exit 1
fi

echo "Game session created successfully!"

# Step 3: Save updated tokens
echo "Step 3: Saving updated tokens..."

cat > "$TOKENS_FILE" << EOF
# Hytale Server Authentication Tokens
# Refreshed on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Next refresh recommended before token expires (30 days)

# OAuth tokens (for refreshing)
HYTALE_OAUTH_REFRESH_TOKEN=$HYTALE_OAUTH_REFRESH_TOKEN
HYTALE_OAUTH_ACCESS_TOKEN=$ACCESS_TOKEN

# Server session tokens (used by the server)
HYTALE_SERVER_SESSION_TOKEN=$SESSION_TOKEN
HYTALE_SERVER_IDENTITY_TOKEN=$IDENTITY_TOKEN

# Profile info
HYTALE_PROFILE_UUID=$HYTALE_PROFILE_UUID
HYTALE_PROFILE_USERNAME=$HYTALE_PROFILE_USERNAME
EOF

chmod 600 "$TOKENS_FILE"

echo ""
echo "Tokens refreshed successfully!"
echo "Tokens saved to: $TOKENS_FILE"
echo ""
echo "IMPORTANT: Tokens will expire in 30 days."
echo "Run this script again before then to keep your server running."
echo ""
echo "To set up automatic refresh, add a cron job:"
echo "  echo '0 0 * * * $SCRIPT_DIR/refresh-hytale-tokens.sh' | crontab -"
echo ""
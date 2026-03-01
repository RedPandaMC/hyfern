Hypixel Studios >Game Features> Multiplayer

1 month ago· Updated

This guide explains how server hosting providers can authenticate Hytale dedicated
servers using accounts with the sessions.unlimited_servers entitlement.

```
Due to the high volume of applications and the launch, we have decided to close
the application process until we have an automated solution in place. 
```
```
We are sorry that we can't grant you the entitlement now. If you are still set to
offer Hytale servers to customers, you can purchase multiple standard licenses
and generate 100 servers with each license. 
```
```
We are working on an automated solution that will allow server providers to
sign up again.
```
Failure to respond to abuse reports within the 24-hour SLA may result in revocation of
your sessions.unlimited_servers entitlement, which will terminate all active server
sessions and take customer servers offline.

Articles in this section

```
Notice:
```

For GSPs and server network operators wanting automatic 0-click server
authentication for 100+ servers:

1. Get entitled - Contact Hytale Supportwith your company details to receive the
    sessions.unlimited_servers entitlement You can no longer get entitled.
Read above.
2. Obtain tokens once - Use the Device Code Flow to authenticate and get a
    refresh_token
3. Create sessions - Call /my-account/get-profiles then /game-session/new
    to get sessionToken and identityToken
4. Pass tokens to servers - Start each server instance with:

```
java -jar HytaleServer.jar \
--session-token "<sessionToken>" \
--identity-token "<identityToken>"
```
```
Or via environment variables: HYTALE_SERVER_SESSION_TOKEN and
HYTALE_SERVER_IDENTITY_TOKEN
```
5. Refresh before expiry - Game sessions expire in 1 hour. Refresh tokens (30-day
    TTL) via /oauth2/token with grant_type=refresh_token , then create new
    game sessions as needed.

Your provisioning system handles token management centrally—customers never see an
auth prompt.

```
Planned: We're working on a CLI tool to automate token acquisition and
refresh for GSP provisioning systems. This wasn't ready in time for launch
—check the GSP Discord for updates.
```
For automating server file downloads and updates, use the Hytale Downloader CLI. This
tool handles OAuth2 authentication and can be integrated into your provisioning pipelines
to keep server installations current.

Download:hytale-downloader.zip (Quickstart + Linux & Windows)

See Server Manual: Hytale Downloader CLI for full usage documentation.

Server authentication uses OAuth 2.0 to obtain tokens that authorize the server to:


1. Create game sessions for the server operator's profile
2. Validate players joining the server
3. Access game assets and version information

The server uses the pre-configured hytale-server OAuth client:

```
Client ID: hytale-server
Scopes: openid, offline, auth:server
```
All endpoints follow standard OAuth 2.0 specifications (RFC 6749, RFC 8628).

```
Endpoint URL
```
```
Authorization https://oauth.accounts.hytale.com/oauth2/auth
```
```
Token https://oauth.accounts.hytale.com/oauth2/token
```
```
Device
Authorization https://oauth.accounts.hytale.com/oauth2/device/auth
```
```
Stage Environment: Replace hytale.com with arcanitegames.ca
```
For servers with console access, use built-in authentication commands:

```
Command Description
```
```
/auth login device
```
```
Start device code flow (recommended for headless
servers)
```
```
/auth login browser Start browser PKCE flow (requires desktop environment)
```
```
/auth select
<number>
```
```
Select a game profile when multiple are available
```

```
Command Description
```
```
/auth status Check current authentication status
```
```
/auth cancel Cancel an in-progress authentication flow
```
```
/auth logout Clear authentication and terminate session
```
Example workflow:

```
> /auth login device
===================================================================
DEVICE AUTHORIZATION
===================================================================
Visit: https://accounts.hytale.com/device
Enter code: ABCD-
Or visit: https://accounts.hytale.com/device?user_code=ABCD-
===================================================================
Waiting for authorization (expires in 900 seconds)...
```
```
[User completes authorization in browser]
```
```
> Authentication successful! Mode: OAUTH_DEVICE
```
For automated or headless setups where you need to obtain tokens programmatically.

Step 1: Request Device Code

```
curl -X POST "https://oauth.accounts.hytale.com/oauth2/device/auth" \
-H "Content-Type: application/x-www-form-urlencoded" \
-d "client_id=hytale-server" \
-d "scope=openid offline auth:server"
```
Response:

## {

```
"device_code": "GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS",
"user_code": "ABCD-1234",
"verification_uri": "https://accounts.hytale.com/device",
"verification_uri_complete": "https://accounts.hytale.com/device?user_
"expires_in": 900,
```

```
 
```
```
"interval": 5
}
```
Step 2: Display Instructions to User

Show the user:

```
URL: verification_uri or verification_uri_complete
Code: user_code (if using verification_uri )
```
Step 3: Poll for Token

Poll the token endpoint at the specified interval (default 5 seconds):

```
curl -X POST "https://oauth.accounts.hytale.com/oauth2/token" \
-H "Content-Type: application/x-www-form-urlencoded" \
-d "client_id=hytale-server" \
-d "grant_type=urn:ietf:params:oauth:grant-type:device_code" \
-d "device_code=GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS"
```
Pending response (user hasn't authorized yet):

## {

```
"error": "authorization_pending"
}
```
Success response:

## {

```
"access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
"token_type": "Bearer",
"expires_in": 3600,
"refresh_token": "xreEsdDGrfIaQc...",
"scope": "openid offline auth:server"
}
```
Step 4: Get Available Profiles

```
curl -X GET "https://account-data.hytale.com/my-account/get-profiles" \
```

```
 
```
```
-H "Authorization: Bearer <access_token>"
```
Response:

## {

```
"owner": "550e8400-e29b-41d4-a716-446655440000",
"profiles": [
{
"uuid": "123e4567-e89b-12d3-a456-426614174000",
"username": "ServerOperator"
}
]
}
```
Step 5: Create Game Session

```
curl -X POST "https://sessions.hytale.com/game-session/new" \
-H "Authorization: Bearer <access_token>" \
-H "Content-Type: application/json" \
-d '{"uuid": "123e4567-e89b-12d3-a456-426614174000"}'
```
Response:

## {

```
"sessionToken": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...",
"identityToken": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...",
"expiresAt": "2026-01-07T15:00:00Z"
}
```
The sessionToken and identityToken are what the server uses for authentication.

For hosting providers who manage token acquisition externally and pass tokens to the
server at startup.

Environment Variables


```
Variable Description
```
```
HYTALE_SERVER_SESSION_TOKEN The session token (JWT)
```
```
HYTALE_SERVER_IDENTITY_TOKEN The identity token (JWT)
```
```
HYTALE_SERVER_AUDIENCE Override server audience (testing only)
```
CLI Options

```
Option Description
```
```
--session-token <token> Session token
```
```
--identity-token <token> Identity token
```
```
--owner-uuid <uuid> Auto-select profile by UUID
```
Example:

```
./hytale-server \
--session-token "eyJhbGciOiJFZERTQSIs..." \
--identity-token "eyJhbGciOiJFZERTQSIs..." \
--owner-uuid "123e4567-e89b-12d3-a456-426614174000"
```
Or via environment:

```
export HYTALE_SERVER_SESSION_TOKEN="eyJhbGciOiJFZERTQSIs..."
export HYTALE_SERVER_IDENTITY_TOKEN="eyJhbGciOiJFZERTQSIs..."
./hytale-server
```
The server automatically refreshes tokens 5 minutes before expiry when in
EXTERNAL_SESSION mode.

This feature is in development

For hosting providers who want to programmatically manage credentials and persist
tokens across server restarts via plugins.


Interface

```
public interface IAuthCredentialStore {
record OAuthTokens(
@Nullable String accessToken,
@Nullable String refreshToken,
@Nullable Instant accessTokenExpiresAt
) {}
```
```
void setTokens(@Nonnull OAuthTokens tokens);
@Nonnull OAuthTokens getTokens();
```
```
void setProfile(@Nullable UUID uuid);
@Nullable UUID getProfile();
```
```
void clear();
}
```
Usage

1. Implement IAuthCredentialStore to persist tokens (e.g., database, file, external
    service)
2. Register before authentication:
    ServerAuthManager.getInstance().registerCredentialStore(store)
3. Server automatically retrieves and refreshes tokens via the store
4. Auth mode becomes OAUTH_STORE

Key Behaviors

```
Registration timing: Store must be registered before any authentication occurs
Token retrieval: Server calls getTokens() when OAuth tokens are needed
Token persistence: Server calls setTokens() after successful token refresh
Profile selection: If getProfile() returns a UUID, that profile is auto-selected
```
Creates a new game session for a specific profile.


```
POST /game-session/new
Host: sessions.hytale.com
Authorization: Bearer <oauth_access_token>
Content-Type: application/json
```
```
{"uuid": "<profile_uuid>"}
```
Fetches available game profiles for the authenticated account.

```
GET /my-account/get-profiles
Host: account-data.hytale.com
Authorization: Bearer <oauth_access_token>
```
Refreshes the current session to extend its lifetime.

```
POST /game-session/refresh
Host: sessions.hytale.com
Authorization: Bearer <session_token>
```
Ends the current session (call on server shutdown).

```
DELETE /game-session
Host: sessions.hytale.com
Authorization: Bearer <session_token>
```
Exchange a refresh token for a new access token.

```
curl -X POST "https://oauth.accounts.hytale.com/oauth2/token" \
-H "Content-Type: application/x-www-form-urlencoded" \
-d "client_id=hytale-server" \
```

```
-d "grant_type=refresh_token" \
-d "refresh_token=<refresh_token>"
```
```
Token Type TTL Notes
```
```
OAuth Access Token 1 hour Used to create game sessions
```
```
OAuth Refresh Token 30 days Used to obtain new access tokens
```
```
Game Session 1 hour Auto-refreshed 5 minutes before expiry
```
Refresh strategy: The server schedules automatic refresh 5 minutes before token expiry. If
game session refresh fails, it falls back to OAuth token refresh.

```
Status Meaning
```
```
400 Bad Request Invalid request format or missing required fields
```
```
401
Unauthorized
```
```
Missing or invalid authentication
```
```
403 Forbidden
```
```
Valid auth but insufficient permissions (missing entitlement,
session limit)
```
```
404 Not Found Resource not found (invalid profile UUID, etc.)
```
Without the sessions.unlimited_servers entitlement, accounts are limited to 100
concurrent server sessions. Attempting to create more returns a 403 Forbidden error.

The server validates tokens at startup. If validation fails:


```
Token validation failed. Server starting unauthenticated.
Use /auth login to authenticate.
```
Common causes:

```
Expired tokens
Invalid token signature
Missing required scope ( hytale:server)
```
Servers validate player JWTs using the public keys from:

```
GET /.well-known/jwks.json
Host: sessions.hytale.com
```
Response:

## {

```
"keys": [
{
"kty": "OKP",
"alg": "EdDSA",
"use": "sig",
"kid": "key-id-1",
"crv": "Ed25519",
"x": "base64url-encoded-public-key"
}
]
}
```
```
RFC 6749 - OAuth 2.0 Authorization Framework
RFC 8628 - OAuth 2.0 Device Authorization Grant
RFC 7636 - PKCE (Proof Key for Code Exchange)
```
```
Have more questions? Submit a request
```

Return to top

Hytale Server Manual

Hytale Server Manual

Joining Friends

Frequently Asked Questions

How to Download and Play Hytale

Refund Policy and Available Payment Methods

# Follow us

## HOME SUPPORT BLOG MEDIA THE GAME COMMUNITY

## PRIVACY COOKIE POLICY SECURITY ABOUT & CONTACT

## ©2025 HYPIXEL STUDIOS CANADA INC. ALL RIGHTS RESERVED.

```
All trademarks referenced herein are the properties of their respective owners.
```


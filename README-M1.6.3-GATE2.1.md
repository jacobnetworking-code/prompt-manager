# Prompt Manager — M1.6.3 Gate 2.1

Adds the OAuth consent page required by Supabase OAuth Server.

Upload this folder structure to the repository root:

oauth/
  consent/
    index.html

The page:
- reads authorization_id from the query string
- verifies the Supabase user session
- supports Google sign-in while preserving the authorization request
- calls getAuthorizationDetails()
- displays client, redirect URI and requested scopes
- supports approveAuthorization() and denyAuthorization()
- redirects back to the OAuth client using Supabase's redirect_url

No MCP write tool is enabled by this package.

// hooks/useClientCredentialsAuth.ts
//
// Acquires a Microsoft Graph app-only token using the OAuth 2.0
// client credentials grant. The request is proxied through the
// Vite dev server (/api/token → login.microsoftonline.com) to
// avoid CORS restrictions in the browser.
//
// ⚠️  The client secret is visible in your JS bundle.
//     For production, move this call to a backend / Azure Function.

import axios from "axios";

export const appConfig = {
  clientId: "YOUR_CLIENT_ID",
  tenantId: "YOUR_TENANT_ID",
  containerTypeId: "YOUR_CONTAINER_TYPE_ID",
  appName: "Sharepoint Embedded",
  clientSecret: "YOUR_CLIENT_SECRET",
};

const cachedToken: string | null = null;
const tokenExpiresAt: number | null = null;

/**
 * Acquires an app-only access token for Microsoft Graph via Vite proxy.
 *
 * Flow:
 *   Browser → POST /api/token/{tenantId}/oauth2/v2.0/token
 *   Vite proxy rewrites → POST https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token
 */
export const getAccessTokenByApp = async (): Promise<string | null> => {
  if (cachedToken && tokenExpiresAt && tokenExpiresAt > Date.now()) {
    return cachedToken;
  }

  try {
    const tokenurl = `https://YOUR_PROXY_URL/fetch-access-token?tenantId=${appConfig.tenantId}`;

    const response = await axios({
      baseURL: tokenurl,
      method: "POST",
      data: {
        grant_type: "client_credentials",
        client_id: appConfig.clientId,
        client_secret: appConfig.clientSecret,
        scope: "https://graph.microsoft.com/.default",
      },
    });

    return response?.data?.access_token || null;
  } catch {
    return null;
  }
};

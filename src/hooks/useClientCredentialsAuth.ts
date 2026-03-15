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
  clientId: "453b9fbd-7155-4832-8324-efd5c13de9fb",
  tenantId: "3e8e53be-a48f-4147-adf8-7e90a6e46b57",
  containerTypeId: "5d56b164-88fc-4574-b399-7da2520f3a03",
  appName: "Sharepoint Embedded",
  clientSecret: "2c98Q~afKVPc9lvufXfrPoVkSpuWgeSusqAZAbSi",
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
    const tokenurl = `https://geotekdevapp-ahhdanhcg7bthucd.westus-01.azurewebsites.net/fetch-access-token?tenantId=${appConfig.tenantId}`;

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

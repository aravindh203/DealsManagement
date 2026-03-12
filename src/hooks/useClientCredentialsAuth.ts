// hooks/useClientCredentialsAuth.ts
//
// Acquires a Microsoft Graph app-only token using the OAuth 2.0
// client credentials grant. The request is proxied through the
// Vite dev server (/api/token → login.microsoftonline.com) to
// avoid CORS restrictions in the browser.
//
// ⚠️  The client secret is visible in your JS bundle.
//     For production, move this call to a backend / Azure Function.

export const appConfig = {
    clientId: "453b9fbd-7155-4832-8324-efd5c13de9fb",
    tenantId: "3e8e53be-a48f-4147-adf8-7e90a6e46b57",
    containerTypeId: "5d56b164-88fc-4574-b399-7da2520f3a03",
    appName: "Sharepoint Embedded",
    clientSecret: "2c98Q~afKVPc9lvufXfrPoVkSpuWgeSusqAZAbSi",
};

let cachedToken: string | null = null;
let tokenExpiresAt: number | null = null;

/**
 * Acquires an app-only access token for Microsoft Graph via Vite proxy.
 *
 * Flow:
 *   Browser → POST /api/token/{tenantId}/oauth2/v2.0/token
 *   Vite proxy rewrites → POST https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token
 */
export const getAccessTokenByApp = async (): Promise<string | null> => {
    // Return cached token if still valid
    if (cachedToken && tokenExpiresAt && tokenExpiresAt > Date.now()) {
        console.log('Using cached app token');
        return cachedToken;
    }

    try {
        // Use the Vite proxy path instead of the direct Azure AD URL
        //const tokenUrl = `/api/token/${appConfig.tenantId}/oauth2/v2.0/token`;
const tokenUrl = `https://login.microsoftonline.com/${appConfig.tenantId}/oauth2/v2.0/token`;
console.log(tokenUrl);
        const body = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: appConfig.clientId,
            client_secret: appConfig.clientSecret,
            scope: 'https://graph.microsoft.com/.default',
        });

        console.log('Requesting app-only token via proxy:', tokenUrl);

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Token error response:', errorText);
            throw new Error(`Token request failed: ${response.status} - ${errorText}`);
        }

        const tokenData = await response.json();
        cachedToken = tokenData.access_token;
        // Cache until 60 s before actual expiry
        tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000) - 60000;

        console.log('App-only token acquired successfully');
        return cachedToken;
    } catch (error) {
        console.error('Client credentials auth failed:', error);
        return null;
    }
};

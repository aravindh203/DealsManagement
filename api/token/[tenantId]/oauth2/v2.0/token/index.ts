import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function tokenProxy(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const tenantId = context.params.tenantId;
  
  try {
    const bodyText = await request.text();

    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyText
    });

    if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        return {
          status: tokenResponse.status,
          body: errorText
        };
    }

    const tokenData = await tokenResponse.json();
    return {
      status: 200,
      jsonBody: tokenData
    };
  } catch (error: any) {
    return {
      status: 500,
      jsonBody: { error: error.message }
    };
  }
}

app.http('tokenProxy', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'token/{tenantId}/oauth2/v2.0/token',
    handler: tokenProxy
});

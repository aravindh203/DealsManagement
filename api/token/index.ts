import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function tokenProxy(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const tenantId = request.params.tenantId;
  
  try {
    const bodyText = await request.text();

    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: bodyText
    });

    const tokenData = await tokenResponse.json();
    return {
      status: tokenResponse.status,
      jsonBody: tokenData
    };
  } catch (error: any) {
    return {
      status: 500,
      jsonBody: { error: error.message }
    };
  }
}

app.http("token", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "token/{tenantId}/oauth2/v2.0/token",
  handler: tokenProxy
});

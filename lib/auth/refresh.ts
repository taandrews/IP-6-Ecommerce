/**
 * Exchanges a refresh token for fresh ID and access tokens by calling the
 * Cognito JSON API directly. Uses fetch and Web Crypto only, so the Edge
 * middleware can renew a session without a Node SDK.
 */
import { cognitoConfig, type Realm } from "./config";

export interface RefreshedTokens {
  idToken: string;
  accessToken: string;
  expiresIn: number;
}

async function secretHash(username: string, clientId: string, clientSecret: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(clientSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(username + clientId));
  let bin = "";
  for (const b of new Uint8Array(sig)) bin += String.fromCharCode(b);
  return btoa(bin);
}

export async function refreshTokens(refreshToken: string, username: string | null, realm: Realm = "customer"): Promise<RefreshedTokens | null> {
  const { clientId, clientSecret, endpoint } = cognitoConfig(realm);
  if (!clientId || !refreshToken) return null;
  const params: Record<string, string> = { REFRESH_TOKEN: refreshToken };
  if (clientSecret) {
    if (!username) return null;
    params.SECRET_HASH = await secretHash(username, clientId, clientSecret);
  }
  try {
    const res = await fetch(endpoint + "/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-amz-json-1.1",
        "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
      },
      body: JSON.stringify({ AuthFlow: "REFRESH_TOKEN_AUTH", ClientId: clientId, AuthParameters: params }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { AuthenticationResult?: { IdToken?: string; AccessToken?: string; ExpiresIn?: number } };
    const r = data.AuthenticationResult;
    if (!r?.IdToken || !r.AccessToken) return null;
    return { idToken: r.IdToken, accessToken: r.AccessToken, expiresIn: r.ExpiresIn ?? 3600 };
  } catch {
    return null;
  }
}

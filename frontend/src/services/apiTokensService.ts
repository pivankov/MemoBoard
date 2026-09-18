import { authApiClient } from 'services/apiClients';

export interface ApiToken {
  uid: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface CreatedApiToken {
  /** Raw-токен. Показывается пользователю ОДИН раз. */
  token: string;
  apiToken: {
    uid: string;
    name: string;
    createdAt: string;
  };
}

export async function fetchApiTokens(): Promise<ApiToken[]> {
  const res = await authApiClient.get<{ tokens: ApiToken[] }>('/tokens');
  return res.tokens;
}

export async function createApiToken(): Promise<CreatedApiToken> {
  return authApiClient.post<CreatedApiToken>('/tokens');
}

export async function revokeApiToken(uid: string): Promise<void> {
  await authApiClient.delete(`/tokens/${uid}`);
}

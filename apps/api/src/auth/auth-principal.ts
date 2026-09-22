export type AuthPrincipal = {
  id: string;
  role: string;
  authType?: 'user' | 'api-key';
  apiKeyId?: string;
  scopes?: readonly string[];
  allowedCompanyIds?: readonly string[];
  email?: string;
  phone?: string;
  sessionId?: string;
};

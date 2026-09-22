import type { Request } from 'express';

import type { AuthPrincipal } from '../../auth/auth-principal.js';

export interface RequestWithContext extends Request {
  accessToken?: string;
  principal?: AuthPrincipal;
  requestId: string;
}

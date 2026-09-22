import { describe, expect, it } from 'vitest';

import { extractApiKeyPrefix } from './api-key-authenticator.service.js';

describe('extractApiKeyPrefix', () => {
  it('accepts Base64URL characters in the credential prefix', () => {
    expect(extractApiKeyPrefix(`fak_live_-_AbCd123456.${'x'.repeat(43)}`)).toBe(
      '-_AbCd123456',
    );
  });

  it('rejects malformed credentials', () => {
    expect(extractApiKeyPrefix(`fak_live_invalid+.${'x'.repeat(43)}`)).toBeUndefined();
  });
});

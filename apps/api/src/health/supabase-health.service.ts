import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Environment } from '../config/environment.js';

@Injectable()
export class SupabaseHealthService {
  private readonly anonKey: string;
  private readonly authHealthUrl: URL;
  private readonly dataApiUrl: URL;
  private readonly timeoutMs: number;

  constructor(@Inject(ConfigService) config: ConfigService<Environment, true>) {
    const baseUrl = config.get('SUPABASE_URL', { infer: true }).replace(/\/$/, '');
    this.anonKey = config.get('SUPABASE_ANON_KEY', { infer: true });
    this.timeoutMs = config.get('DEPENDENCY_TIMEOUT_MS', { infer: true });
    this.authHealthUrl = new URL(`${baseUrl}/auth/v1/health`);
    this.dataApiUrl = new URL(`${baseUrl}/rest/v1/clients?select=id&limit=1`);
  }

  async check(): Promise<{ auth: 'up'; dataApi: 'up' }> {
    const [auth, dataApi] = await Promise.allSettled([
      this.fetchDependency(this.authHealthUrl),
      this.fetchDependency(this.dataApiUrl, 'HEAD'),
    ]);

    if (auth.status === 'rejected' || dataApi.status === 'rejected') {
      throw new ServiceUnavailableException('A required Supabase dependency is unavailable.');
    }

    return { auth: 'up', dataApi: 'up' };
  }

  private async fetchDependency(url: URL, method: 'GET' | 'HEAD' = 'GET'): Promise<void> {
    const response = await fetch(url, {
      method,
      headers: { apikey: this.anonKey, authorization: `Bearer ${this.anonKey}` },
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    await response.body?.cancel();
    if (!response.ok) throw new Error(`Dependency returned HTTP ${response.status}.`);
  }
}

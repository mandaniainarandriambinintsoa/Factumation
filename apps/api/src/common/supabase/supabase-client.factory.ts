import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Environment } from '../../config/environment.js';
import type { Database } from './database.types.js';

@Injectable()
export class SupabaseClientFactory {
  private readonly anonKey: string;
  private readonly url: string;

  constructor(@Inject(ConfigService) config: ConfigService<Environment, true>) {
    this.url = config.get('SUPABASE_URL', { infer: true });
    this.anonKey = config.get('SUPABASE_ANON_KEY', { infer: true });
  }

  createForUser(accessToken: string): SupabaseClient<Database> {
    return createClient<Database>(this.url, this.anonKey, {
      accessToken: async () => accessToken,
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }
}

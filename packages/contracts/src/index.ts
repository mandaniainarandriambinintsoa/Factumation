import { z } from 'zod';

export const healthStatusSchema = z.object({
  status: z.literal('ok'),
  service: z.string().min(1),
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;

export const readinessStatusSchema = healthStatusSchema.extend({
  dependencies: z.object({
    auth: z.literal('up'),
    dataApi: z.literal('up'),
  }),
});

export type ReadinessStatus = z.infer<typeof readinessStatusSchema>;

export const problemDetailsSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  status: z.number().int().min(400).max(599),
  detail: z.string().min(1),
  instance: z.string().min(1),
  requestId: z.string().min(1),
  errors: z.array(z.string()).optional(),
});

export type ProblemDetails = z.infer<typeof problemDetailsSchema>;

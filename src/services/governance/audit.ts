import { createHash } from 'node:crypto';
import { z } from 'zod';
import { maskObjectStrings } from './pii-mask';

export const AuditEventSchema = z.object({
  id: z.string().uuid(),
  actorId: z.string().nullable(),
  action: z.string().min(1),
  layer: z.enum(['orchestrator', 'l1', 'l2', 'l3', 'connector', 'governance']),
  inputHash: z.string().regex(/^[a-f0-9]{64}$/),
  model: z.string().nullable(),
  reasonTrace: z.array(z.string()),
  redactionCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
}).strict();
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export interface AuditSink {
  append(input: Omit<AuditEvent, 'id' | 'inputHash' | 'redactionCount' | 'createdAt'> & { input: unknown }): AuditEvent;
  list(): AuditEvent[];
}

export class InMemoryAuditSink implements AuditSink {
  private readonly events: AuditEvent[] = [];

  append(input: Omit<AuditEvent, 'id' | 'inputHash' | 'redactionCount' | 'createdAt'> & { input: unknown }): AuditEvent {
    const masked = maskObjectStrings(input.input);
    const inputHash = createHash('sha256').update(JSON.stringify(masked.value)).digest('hex');
    const event = AuditEventSchema.parse({
      id: crypto.randomUUID(), actorId: input.actorId, action: input.action, layer: input.layer,
      inputHash, model: input.model, reasonTrace: input.reasonTrace, redactionCount: masked.redactions.reduce((sum, item) => sum + item.count, 0),
      createdAt: new Date().toISOString(),
    });
    this.events.push(event);
    return event;
  }

  list(): AuditEvent[] {
    return this.events.map((event) => AuditEventSchema.parse(event));
  }
}

export const auditSink: AuditSink = new InMemoryAuditSink();
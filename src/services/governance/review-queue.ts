import { z } from 'zod';

export const ReviewItemSchema = z.object({
  id: z.string().uuid(), subjectId: z.string().min(1), category: z.enum(['low-confidence', 'layer-disagreement', 'document-review', 'policy-handoff']),
  reason: z.string().min(1), referenceId: z.string().nullable(), createdAt: z.string().datetime(), status: z.enum(['open', 'resolved']), resolution: z.string().nullable(),
}).strict();
export type ReviewItem = z.infer<typeof ReviewItemSchema>;

export interface ReviewQueue {
  enqueue(input: Pick<ReviewItem, 'subjectId' | 'category' | 'reason' | 'referenceId'>): ReviewItem;
  listOpen(): ReviewItem[];
  resolve(id: string, resolution: string): ReviewItem | null;
}

export class InMemoryReviewQueue implements ReviewQueue {
  private readonly items = new Map<string, ReviewItem>();
  enqueue(input: Pick<ReviewItem, 'subjectId' | 'category' | 'reason' | 'referenceId'>): ReviewItem {
    const item = ReviewItemSchema.parse({ ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'open', resolution: null });
    this.items.set(item.id, item);
    return item;
  }
  listOpen(): ReviewItem[] { return [...this.items.values()].filter((item) => item.status === 'open').map((item) => ReviewItemSchema.parse(item)); }
  resolve(id: string, resolution: string): ReviewItem | null {
    const item = this.items.get(id);
    if (!item) return null;
    const updated = ReviewItemSchema.parse({ ...item, status: 'resolved', resolution });
    this.items.set(id, updated);
    return updated;
  }
}

export const reviewQueue: ReviewQueue = new InMemoryReviewQueue();
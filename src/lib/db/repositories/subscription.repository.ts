import { eq } from 'drizzle-orm';
import { db } from '../index';
import { subscriptions, payments } from '../schema';

export const subscriptionRepository = {
  async findByUserId(userId: string) {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
    return result[0] || null;
  },

  async upsert(userId: string, data: {
    plan?: string;
    status?: 'active' | 'canceled' | 'expired' | 'trialing';
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    aiGenerationsLimit?: number;
  }) {
    const existing = await this.findByUserId(userId);
    if (existing) {
      await db.update(subscriptions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(subscriptions.id, existing.id));
      return { ...existing, ...data };
    }
    const id = crypto.randomUUID();
    await db.insert(subscriptions).values({
      id,
      userId,
      plan: 'free',
      status: 'active',
      aiGenerationsLimit: 10,
      ...data,
    });
    return { id, userId, plan: 'free', status: 'active', aiGenerationsLimit: 10, ...data };
  },

  async incrementAiUsage(userId: string) {
    const sub = await this.findByUserId(userId);
    if (sub) {
      await db.update(subscriptions)
        .set({ aiGenerationsUsed: sub.aiGenerationsUsed + 1, updatedAt: new Date() })
        .where(eq(subscriptions.id, sub.id));
    }
  },

  async canUseAi(userId: string): Promise<boolean> {
    const sub = await this.findByUserId(userId);
    if (!sub) return true; // 默认允许
    return sub.aiGenerationsUsed < sub.aiGenerationsLimit;
  },

  async recordPayment(userId: string, data: {
    subscriptionId?: string;
    zpayTradeNo?: string;
    amount: number;
    currency?: string;
    status: 'pending' | 'succeeded' | 'failed' | 'refunded';
    plan: string;
  }) {
    const id = crypto.randomUUID();
    await db.insert(payments).values({ id, userId, ...data });
    return id;
  },
};


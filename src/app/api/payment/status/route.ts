import { NextRequest, NextResponse } from 'next/server';
import { subscriptionRepository } from '@/lib/db/repositories/subscription.repository';
import { PLANS } from '@/lib/zpay';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: '缺少 userId' }, { status: 400 });
  }

  const sub = await subscriptionRepository.findByUserId(userId);
  if (!sub) {
    return NextResponse.json({
      plan: 'free',
      status: 'active',
      aiGenerationsUsed: 0,
      aiGenerationsLimit: PLANS.free.aiGenerationsLimit,
      features: PLANS.free.features,
    });
  }

  const planInfo = PLANS[sub.plan as keyof typeof PLANS] || PLANS.free;

  return NextResponse.json({
    plan: sub.plan,
    status: sub.status,
    aiGenerationsUsed: sub.aiGenerationsUsed,
    aiGenerationsLimit: sub.aiGenerationsLimit,
    currentPeriodEnd: sub.currentPeriodEnd,
    features: planInfo.features,
  });
}

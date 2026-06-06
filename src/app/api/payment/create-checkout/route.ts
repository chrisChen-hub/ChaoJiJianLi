import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createOrder, buildOrderId, PLANS } from '@/lib/zpay';

export async function POST(req: NextRequest) {
  try {
    const { plan, userId, successUrl, cancelUrl } = await req.json();

    if (!plan || !userId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    if (plan === 'free') {
      return NextResponse.json({ url: successUrl || '/zh/pricing?success=true' });
    }

    const planConfig = PLANS[plan as keyof typeof PLANS];
    if (!planConfig || planConfig.price <= 0) {
      return NextResponse.json({ error: '无效的套餐' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    const result = await createOrder({
      type: 'alipay',
      out_trade_no: buildOrderId(userId, plan),
      money: planConfig.price,
      name: planConfig.name,
      notify_url: origin + '/api/payment/webhook',
      return_url: successUrl || (origin + '/zh/pricing?success=true'),
      clientip: ip.split(',')[0].trim(),
    });

    return NextResponse.json({ url: result.payurl });
  } catch (error: any) {
    console.error('创建支付订单失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

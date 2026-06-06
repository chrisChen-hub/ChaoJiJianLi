import { NextRequest, NextResponse } from 'next/server';
import { verifyCallback, PLANS } from '@/lib/zpay';
import { subscriptionRepository } from '@/lib/db/repositories/subscription.repository';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const params: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value;
    }

    console.log('📩 ZPAY 回调参数:', JSON.stringify(params));

    // 验证签名
    if (!verifyCallback(params)) {
      console.error('❌ ZPAY 回调签名验证失败');
      return NextResponse.json({ error: '签名验证失败' }, { status: 403 });
    }

    // ZPAY 状态: trade_status=TRADE_SUCCESS 才处理
    if (params.trade_status !== 'TRADE_SUCCESS') {
      console.log('⏳ 订单未支付完成，status:', params.trade_status);
      return NextResponse.json({ success: true });
    }

    // 解析商户订单号
    const outTradeNo = params.out_trade_no as string;
    const parts = outTradeNo.split('_');
    const plan = parts[0];
    const userId = parts.slice(1, -2).join('_');

    if (!userId || !plan) {
      console.error('❌ 无法解析订单号:', outTradeNo);
      return NextResponse.json({ error: '参数解析失败' }, { status: 400 });
    }

    // 更新订阅
    const limit = plan === 'pro' ? 999999 : plan === 'lifetime' ? 999999 : 10;
    const periodEnd = plan === 'lifetime'
      ? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) // 终身
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)         // 月付

    await subscriptionRepository.upsert(userId, {
      plan,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      aiGenerationsLimit: limit,
    });

    await subscriptionRepository.recordPayment(userId, {
      zpayTradeNo: params.trade_no as string,
      amount: Math.round(parseFloat(params.money as string) * 100),
      currency: 'cny',
      status: 'succeeded',
      plan,
    });

    console.log('✅ 支付成功:', { userId, plan, tradeNo: params.trade_no });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ 支付回调处理失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

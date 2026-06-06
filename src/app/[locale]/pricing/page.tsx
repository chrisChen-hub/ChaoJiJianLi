'use client';

import { useState } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFingerprint } from '@/hooks/use-fingerprint';

const PLANS = [
  {
    id: 'free', name: '免费版', price: 0, unit: '永久',
    description: '适合初次体验', popular: false,
    features: [
      { text: '3个基础模板', included: true },
      { text: '每月10次AI生成', included: true },
      { text: 'PDF导出', included: true },
      { text: 'AI简历优化', included: false },
      { text: 'JD匹配分析', included: false },
    ],
    buttonText: '当前方案', buttonVariant: 'outline' as const,
  },
  {
    id: 'pro', name: 'Pro版', price: 29, unit: '/月',
    description: '求职利器，事半功倍', popular: true,
    features: [
      { text: '全部50个模板', included: true },
      { text: '无限AI生成', included: true },
      { text: 'PDF/DOCX/HTML导出', included: true },
      { text: 'AI简历优化', included: true },
      { text: 'JD匹配分析', included: true },
      { text: '语法检查', included: true },
      { text: '求职信生成', included: true },
    ],
    buttonText: '立即升级', buttonVariant: 'default' as const,
  },
  {
    id: 'lifetime', name: '终身版', price: 199, unit: '一次付费',
    description: 'Pro全部 + 面试模拟', popular: false,
    features: [
      { text: '全部50个模板', included: true },
      { text: '无限AI生成', included: true },
      { text: 'PDF/DOCX/HTML导出', included: true },
      { text: 'AI简历优化', included: true },
      { text: 'JD匹配分析', included: true },
      { text: '语法检查', included: true },
      { text: '求职信生成', included: true },
      { text: '模拟面试', included: true },
    ],
    buttonText: '终身买断', buttonVariant: 'default' as const,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const { fingerprint } = useFingerprint();

  const handleCheckout = async (planId: string) => {
    if (planId === 'free') return;
    if (!fingerprint) {
      alert('请稍后重试（获取用户标识中...）');
      return;
    }
    setLoading(planId);

    try {
      const res = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-fingerprint': fingerprint },
        body: JSON.stringify({ plan: planId, userId: fingerprint }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('创建支付失败: ' + (data.error || '未知错误'));
      }
    } catch {
      alert('网络错误，请重试');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <div className="h-16" />
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm">
            💰 定价与套餐
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">选择适合你的方案</h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">免费版即可体验，升级Pro解锁全部AI能力</p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={
                plan.popular
                  ? 'relative flex flex-col p-8 border-2 border-pink-500 shadow-xl shadow-pink-500/10 scale-105'
                  : 'relative flex flex-col p-8 border-zinc-200 shadow-sm hover:shadow-md'
              }
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-pink-500 px-4 py-1 text-white shadow-lg">
                    <Sparkles className="mr-1 h-3 w-3" />
                    推荐
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">&yen;{plan.price}</span>
                <span className="ml-1 text-sm text-zinc-500">{plan.unit}</span>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    {feat.included ? (
                      <Check className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                    ) : (
                      <X className="h-4 w-4 flex-shrink-0 text-zinc-300 dark:text-zinc-600" />
                    )}
                    <span className={feat.included ? '' : 'text-zinc-400 dark:text-zinc-600'}>
                      {feat.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.buttonVariant}
                size="lg"
                className={'w-full' + (plan.popular ? ' bg-pink-500 text-white hover:bg-pink-600' : '')}
                disabled={plan.id === 'free' || loading === plan.id}
                onClick={() => handleCheckout(plan.id)}
              >
                {loading === plan.id ? '处理中...' : plan.buttonText}
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-zinc-400">
          <p>支持支付宝、微信支付</p>
          <p className="mt-1">支付由虎皮椒安全处理，30天无理由退款</p>
        </div>
      </div>
    </div>
  );
}

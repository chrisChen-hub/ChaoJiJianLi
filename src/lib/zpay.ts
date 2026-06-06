// ===== ZPAY 支付核心模块 =====
// 文档：http://www.z-pay.cn/doc.html

export const paymentConfig = {
  pid: process.env.ZPAY_PID ?? "",
  key: process.env.ZPAY_KEY ?? "",
  gateway: "https://zpayz.cn",
}

export const PLANS = {
  free: {
    id: "free",
    name: "免费版",
    price: 0,
    aiGenerationsLimit: 10,
    templates: 3,
    features: ["3个基础模板", "每月10次AI生成", "PDF导出"],
  },
  pro: {
    id: "pro",
    name: "Pro版",
    price: 29,
    aiGenerationsLimit: 999999,
    templates: 50,
    features: ["全部50个模板", "无限AI生成", "JD匹配分析", "语法检查", "求职信生成", "AI聊天助手", "PDF/DOCX/HTML导出"],
  },
  lifetime: {
    id: "lifetime",
    name: "终身版",
    price: 199,
    aiGenerationsLimit: 999999,
    templates: 50,
    features: ["Pro全部功能", "模拟面试", "优先客服支持", "永久使用"],
  },
} as const

export type PlanType = keyof typeof PLANS

export function getPlanLimit(plan: PlanType): number {
  return PLANS[plan].aiGenerationsLimit
}

export function sign(params: Record<string, any>, appsecret: string): string {
  const keys = Object.keys(params)
    .filter(k => k !== "sign" && k !== "sign_type" && params[k] !== null && params[k] !== "" && params[k] !== undefined)
    .sort()
  const query = keys.map(k => k + "=" + params[k]).join("&")
  const crypto = require("crypto")
  return crypto.createHash("md5").update(query + appsecret).digest("hex")
}

export async function createOrder(params: {
  type: 'alipay' | 'wxpay'
  out_trade_no: string
  money: number
  name: string
  notify_url: string
  return_url: string
  clientip: string
}): Promise<{ payurl: string; trade_no: string }> {
  const { pid, key, gateway } = paymentConfig
  const body: Record<string, any> = {
    pid,
    type: params.type,
    out_trade_no: params.out_trade_no,
    notify_url: params.notify_url,
    return_url: params.return_url,
    name: params.name,
    money: params.money.toFixed(2),
    clientip: params.clientip,
    sign_type: "MD5",
  }
  body.sign = sign(body, key)
  const res = await fetch(gateway + "/mapi.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  })
  const data = await res.json()
  if (data.code !== 1) {
    throw new Error("ZPAY 下单失败: " + (data.msg || "未知错误"))
  }
  return { payurl: data.payurl, trade_no: data.trade_no }
}

export function verifyCallback(params: Record<string, any>): boolean {
  const { key } = paymentConfig
  const sig = params.sign
  if (!sig) return false
  return sign(params, key) === sig
}

export function buildOrderId(userId: string, plan: string): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).substring(2, 6)
  return (plan + "_" + userId.substring(0, 8) + "_" + ts + "_" + rand).substring(0, 32)
}



/** Integer Iranian Rial/Toman amounts. Never use floats for money. */

export function assertIrr(amount: number, label = 'مبلغ'): number {
  if (!Number.isInteger(amount) || amount < 0 || amount > 100_000_000_000) {
    throw new Error(`${label} نامعتبر است`)
  }
  return amount
}

export function parseIrr(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null
  return n
}

export function splitPlatformFee(gross: number, feeBps: number): { fee: number, payout: number } {
  const amount = assertIrr(gross)
  const bps = Number.isInteger(feeBps) && feeBps >= 0 && feeBps <= 10_000 ? feeBps : 0
  const fee = Math.floor((amount * bps) / 10_000)
  return { fee, payout: amount - fee }
}

export function remainingRefundable(gross: number, alreadyRefunded: number): number {
  return Math.max(0, assertIrr(gross) - assertIrr(alreadyRefunded, 'مبلغ بازپرداخت‌شده'))
}

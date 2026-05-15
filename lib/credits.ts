import { getLimits, isMonthChanged, thisMonth, CreditType } from './plans'
import { createServerClient } from '@supabase/ssr'

type SupabaseServerClient = ReturnType<typeof createServerClient>

export async function checkAndConsumeCredit(
  supabase: SupabaseServerClient,
  type: CreditType,
  cost = 1
): Promise<{ ok: boolean; reason?: 'unauthenticated' | 'limit_reached' | 'error'; plan?: string; remaining?: number }> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return { ok: false, reason: 'unauthenticated' }

    const meta = user.user_metadata || {}
    const plan = ((meta.plan as string) || 'free').toLowerCase()
    const limits = getLimits(plan)
    const max = limits[type]

    // Reset mensual automático
    const lastReset = (meta.credits_reset_month as string) || ''
    const needsReset = isMonthChanged(lastReset)
    const currentUsed = needsReset ? 0 : Number(meta[`used_${type}`] || 0)

    if (currentUsed + cost > max) {
      return { ok: false, reason: 'limit_reached', plan, remaining: Math.max(0, max - currentUsed) }
    }

    // Consumir y guardar — con reset si toca
    const newMeta: Record<string, unknown> = {
      ...meta,
      [`used_${type}`]: currentUsed + cost,
    }
    if (needsReset) {
      newMeta.used_analisis = type === 'analisis' ? cost : 0
      newMeta.used_mejoras  = type === 'mejoras'  ? cost : 0
      newMeta.credits_reset_month = thisMonth()
    }

    await supabase.auth.updateUser({ data: newMeta })

    return { ok: true, plan, remaining: max - (currentUsed + cost) }
  } catch {
    return { ok: false, reason: 'error' }
  }
}
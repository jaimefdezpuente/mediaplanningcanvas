export const PLAN_LIMITS = {
  free:       { plans: 1,   analisis: 3,   mejoras: 10  },
  pro:        { plans: 10,  analisis: 20,  mejoras: 70  },
  business:   { plans: 30,  analisis: 60,  mejoras: 150 },
  enterprise: { plans: 999, analisis: 999, mejoras: 999 },
} as const

export type PlanTier = keyof typeof PLAN_LIMITS
export type CreditType = 'analisis' | 'mejoras'

export function getLimits(plan: string) {
  const tier = plan?.toLowerCase() as PlanTier
  return PLAN_LIMITS[tier] ?? PLAN_LIMITS.free
}

export function isMonthChanged(lastResetMonth: string): boolean {
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${now.getMonth() + 1}`
  return lastResetMonth !== thisMonth
}

export function thisMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth() + 1}`
}
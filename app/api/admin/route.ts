'use server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const ADMIN_SECRET = process.env.ADMIN_SECRET
if (!ADMIN_SECRET) throw new Error('ADMIN_SECRET no configurado en variables de entorno')
function checkAuth(req: NextRequest) { return req.headers.get('x-admin-secret') === ADMIN_SECRET }

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const supabase = adminClient()
  const action = new URL(req.url).searchParams.get('action') || 'users'

  if (action === 'stats') {
    const { count: totalPlans } = await supabase.from('plans').select('*', { count: 'exact', head: true })
    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    return NextResponse.json({ totalUsers: authUsers?.users?.length || 0, totalPlans: totalPlans || 0 })
  }

  const { data: authData, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: planCounts } = await supabase.from('plans').select('user_id')
  const counts: Record<string, number> = {}
  planCounts?.forEach(p => { counts[p.user_id] = (counts[p.user_id] || 0) + 1 })

  const users = authData.users.map(u => ({
    id:               u.id,
    email:            u.email,
    full_name:        u.user_metadata?.full_name || '',
    plan:             u.user_metadata?.plan || 'free',
    used_analisis:    Number(u.user_metadata?.used_analisis  || 0),
    used_mejoras:     Number(u.user_metadata?.used_mejoras   || 0),
    used_plans:       Number(u.user_metadata?.used_plans     || 0),
    plan_period_start: u.user_metadata?.plan_period_start || null,
    created_at:       u.created_at,
    last_sign_in:     u.last_sign_in_at,
    confirmed:        !!u.confirmed_at,
    plan_count:       counts[u.id] || 0,
  }))

  return NextResponse.json({ users })
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { userId } = await req.json()
  const { error } = await adminClient().auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const supabase = adminClient()
  const { userId, plan, email, resetCredits, confirmEmail } = await req.json()

  // Confirmar email manualmente
  if (confirmEmail) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'email_confirmed' })
  }

  // Leer metadata actual para no sobreescribirla
  const { data: userData } = await supabase.auth.admin.getUserById(userId)
  const existing = userData?.user?.user_metadata || {}

  const updates: Record<string, unknown> = {}

  if (plan) {
    const isFreeToFree = plan === 'free' && existing.plan === 'free'
    updates.user_metadata = {
      ...existing,
      plan,
      // Si se asigna un plan de pago → guardar fecha de inicio y resetear créditos
      ...(plan !== 'free' ? {
        plan_period_start: new Date().toISOString(),
        used_analisis: 0,
        used_mejoras:  0,
      } : {}),
      // Si se baja a free → sólo cambiar plan
    }
  }

  if (resetCredits) {
    updates.user_metadata = {
      ...(updates.user_metadata as object || existing),
      used_analisis:     0,
      used_mejoras:      0,
      plan_period_start: new Date().toISOString(),
    }
  }

  if (email) updates.email = email

  const { error } = await supabase.auth.admin.updateUserById(userId, updates)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

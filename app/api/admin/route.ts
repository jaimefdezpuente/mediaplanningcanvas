'use server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client uses service role key — bypasses RLS
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const ADMIN_SECRET = process.env.ADMIN_SECRET
if (!ADMIN_SECRET) throw new Error('ADMIN_SECRET no configurado en variables de entorno')

function checkAuth(req: NextRequest) {
  const auth = req.headers.get('x-admin-secret')
  return auth === ADMIN_SECRET
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabase = adminClient()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const action = searchParams.get('action') || 'users'

  if (action === 'stats') {
    const { count: totalUsers } = await supabase.from('plans').select('user_id', { count: 'exact', head: true })
    const { count: totalPlans } = await supabase.from('plans').select('*', { count: 'exact', head: true })
    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 200 })
    return NextResponse.json({
      totalUsers: authUsers?.users?.length || 0,
      totalPlans: totalPlans || 0,
    })
  }

  // Get all users from auth
  const { data: authData, error } = await supabase.auth.admin.listUsers({ perPage: 200 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let users = authData.users.map(u => ({
    id: u.id,
    email: u.email,
    full_name: u.user_metadata?.full_name || '',
    plan: u.user_metadata?.plan || 'free',
    created_at: u.created_at,
    last_sign_in: u.last_sign_in_at,
    confirmed: !!u.confirmed_at,
  }))

  // Filter by search
  if (search) {
    const q = search.toLowerCase()
    users = users.filter(u =>
      u.email?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q)
    )
  }

  // Get plan counts per user
  const { data: planCounts } = await supabase
    .from('plans')
    .select('user_id')

  const counts: Record<string, number> = {}
  planCounts?.forEach(p => { counts[p.user_id] = (counts[p.user_id] || 0) + 1 })

  const usersWithCounts = users.map(u => ({ ...u, plan_count: counts[u.id] || 0 }))

  return NextResponse.json({ users: usersWithCounts })
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { userId } = await req.json()
  const supabase = adminClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { userId, plan, email } = await req.json()
  const supabase = adminClient()
  const updates: Record<string, unknown> = {}
  if (plan) updates.user_metadata = { plan }
  if (email) updates.email = email
  const { error } = await supabase.auth.admin.updateUserById(userId, updates)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

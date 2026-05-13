-- Ejecuta en Supabase > SQL Editor
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  pais TEXT, sector TEXT, producto TEXT,
  tipo_negocio TEXT DEFAULT 'B2C',
  fase_negocio TEXT DEFAULT 'launch',
  usp TEXT,
  entorno JSONB, target JSONB, estrategia JSONB, tactico JSONB,
  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own plans" ON plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own plans" ON plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own plans" ON plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own plans" ON plans FOR DELETE USING (auth.uid() = user_id);

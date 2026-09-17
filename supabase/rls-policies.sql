-- ============================================
-- YARACREDIT - POLÍTICAS RLS PARA GESTIÓN DE USUARIOS
-- Ejecutar este script en Supabase SQL Editor
-- ============================================

-- Actualizar la tabla profiles para usar los roles correctos
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'cobrador'));

-- Actualizar valores existentes (si hay datos)
UPDATE profiles SET role = 'admin' WHERE role = 'administrador';
UPDATE profiles SET role = 'cobrador' WHERE role IN ('gerente', 'solo_lectura');

-- ============================================
-- POLÍTICAS RLS PARA TABLA PROFILES
-- ============================================

-- Política 1: Los usuarios pueden ver su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Política 2: Los administradores pueden ver todos los perfiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND active = true
    )
  );

-- Política 3: Los usuarios pueden actualizar su propio perfil (excepto el rol)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política 4: SOLO administradores pueden insertar nuevos perfiles
-- Esta es la política CRÍTICA para la gestión de usuarios
DROP POLICY IF EXISTS "Only admins can insert profiles" ON profiles;
CREATE POLICY "Only admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND active = true
    )
  );

-- Política 5: SOLO administradores pueden actualizar roles y estados
DROP POLICY IF EXISTS "Only admins can update roles" ON profiles;
CREATE POLICY "Only admins can update roles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND active = true
    )
  );

-- Política 6: SOLO administradores pueden eliminar perfiles
DROP POLICY IF EXISTS "Only admins can delete profiles" ON profiles;
CREATE POLICY "Only admins can delete profiles"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND active = true
    )
  );

-- ============================================
-- FUNCIÓN PARA VERIFICAR SI EL USUARIO ES ADMINISTRADOR
-- ============================================
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id 
    AND role = 'admin'
    AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- POLÍTICAS RLS PARA TABLA CLIENTES
-- ============================================

-- Los administradores pueden ver todos los clientes
DROP POLICY IF EXISTS "Admins can view all clients" ON clientes;
CREATE POLICY "Admins can view all clients"
  ON clientes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND active = true
    )
  );

-- Los cobradores pueden ver los clientes asignados a ellos
DROP POLICY IF EXISTS "Cobradores can view assigned clients" ON clientes;
CREATE POLICY "Cobradores can view assigned clients"
  ON clientes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rutas
      WHERE cobrador_id = auth.uid()
      AND clientes_ids @> ARRAY[clientes.id]::uuid[]
    )
    OR
    EXISTS (
      SELECT 1 FROM creditos
      WHERE cliente_id = clientes.id
      AND cobrador_asignado = auth.uid()
    )
  );

-- Solo administradores pueden insertar clientes
DROP POLICY IF EXISTS "Only admins can insert clients" ON clientes;
CREATE POLICY "Only admins can insert clients"
  ON clientes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND active = true
    )
  );

-- Solo administradores pueden actualizar clientes
DROP POLICY IF EXISTS "Only admins can update clients" ON clientes;
CREATE POLICY "Only admins can update clients"
  ON clientes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND active = true
    )
  );

-- Solo administradores pueden eliminar clientes
DROP POLICY IF EXISTS "Only admins can delete clients" ON clientes;
CREATE POLICY "Only admins can delete clients"
  ON clientes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND active = true
    )
  );

-- ============================================
-- POLÍTICAS RLS PARA TABLA CREDITOS
-- ============================================

-- Los administradores pueden ver todos los créditos
DROP POLICY IF EXISTS "Admins can view all credits" ON creditos;
CREATE POLICY "Admins can view all credits"
  ON creditos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND active = true
    )
  );

-- Los cobradores pueden ver los créditos asignados a ellos
DROP POLICY IF EXISTS "Cobradores can view assigned credits" ON creditos;
CREATE POLICY "Cobradores can view assigned credits"
  ON creditos FOR SELECT
  USING (cobrador_asignado = auth.uid());

-- Solo administradores pueden insertar créditos
DROP POLICY IF EXISTS "Only admins can insert credits" ON creditos;
CREATE POLICY "Only admins can insert credits"
  ON creditos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND active = true
    )
  );

-- Solo administradores pueden actualizar créditos
DROP POLICY IF EXISTS "Only admins can update credits" ON creditos;
CREATE POLICY "Only admins can update credits"
  ON creditos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND active = true
    )
  );

-- Solo administradores pueden eliminar créditos
DROP POLICY IF EXISTS "Only admins can delete credits" ON creditos;
CREATE POLICY "Only admins can delete credits"
  ON creditos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND active = true
    )
  );

-- ============================================
-- POLÍTICAS RLS PARA TABLA PAGOS
-- ============================================

-- Los administradores pueden ver todos los pagos
DROP POLICY IF EXISTS "Admins can view all payments" ON pagos;
CREATE POLICY "Admins can view all payments"
  ON pagos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND active = true
    )
  );

-- Los cobradores pueden ver los pagos que ellos registraron
DROP POLICY IF EXISTS "Cobradores can view own payments" ON pagos;
CREATE POLICY "Cobradores can view own payments"
  ON pagos FOR SELECT
  USING (cobrador_id = auth.uid());

-- Los cobradores pueden insertar pagos
DROP POLICY IF EXISTS "Cobradores can insert payments" ON pagos;
CREATE POLICY "Cobradores can insert payments"
  ON pagos FOR INSERT
  WITH CHECK (cobrador_id = auth.uid());

-- ============================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role_active ON profiles(role, active);
CREATE INDEX IF NOT EXISTS idx_creditos_cobrador ON creditos(cobrador_asignado);
CREATE INDEX IF NOT EXISTS idx_pagos_cobrador ON pagos(cobrador_id);

-- Optimize RLS policies by wrapping auth.uid() in SELECT for better performance
-- This prevents re-evaluation of auth.uid() for each row

-- Drop existing policies for invoices
DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON invoices;

-- Drop existing policies for quotes
DROP POLICY IF EXISTS "Users can view their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can insert their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON quotes;

-- Drop existing policies for clients
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;

-- Drop existing policies for user_preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON user_preferences;

-- Drop existing policies for companies
DROP POLICY IF EXISTS "Users can view own companies" ON companies;
DROP POLICY IF EXISTS "Users can create own companies" ON companies;
DROP POLICY IF EXISTS "Users can update own companies" ON companies;
DROP POLICY IF EXISTS "Users can delete own companies" ON companies;

-- Recreate optimized policies for invoices
CREATE POLICY "Users can view their own invoices" ON invoices
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own invoices" ON invoices
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own invoices" ON invoices
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own invoices" ON invoices
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Recreate optimized policies for quotes
CREATE POLICY "Users can view their own quotes" ON quotes
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own quotes" ON quotes
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own quotes" ON quotes
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own quotes" ON quotes
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Recreate optimized policies for clients
CREATE POLICY "Users can view their own clients" ON clients
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own clients" ON clients
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own clients" ON clients
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own clients" ON clients
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Recreate optimized policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own preferences" ON user_preferences
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Recreate optimized policies for companies
CREATE POLICY "Users can view own companies" ON companies
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own companies" ON companies
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own companies" ON companies
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own companies" ON companies
  FOR DELETE USING ((select auth.uid()) = user_id);;

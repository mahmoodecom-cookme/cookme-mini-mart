-- 1. Remove overly permissive guest INSERT policies (all writes go through trusted server code)
DROP POLICY IF EXISTS "orders guest insert" ON public.orders;
DROP POLICY IF EXISTS "order items guest insert" ON public.order_items;
DROP POLICY IF EXISTS "order messages guest insert" ON public.order_messages;
DROP POLICY IF EXISTS "support guest insert" ON public.support_messages;

REVOKE INSERT ON public.orders FROM anon;
REVOKE INSERT ON public.order_items FROM anon;
REVOKE INSERT ON public.order_messages FROM anon;
REVOKE INSERT ON public.support_messages FROM anon;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
GRANT ALL ON public.order_messages TO service_role;
GRANT ALL ON public.support_messages TO service_role;

-- 2. Constrain analytics inserts instead of WITH CHECK (true)
DROP POLICY IF EXISTS "visits insert" ON public.page_visits;
CREATE POLICY "visits insert" ON public.page_visits
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(path) BETWEEN 1 AND 300
  AND (referrer IS NULL OR length(referrer) <= 500)
  AND (session_id IS NULL OR length(session_id) <= 100)
);

-- 3. Lock down SECURITY DEFINER helpers
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
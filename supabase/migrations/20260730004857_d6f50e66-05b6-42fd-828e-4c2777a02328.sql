DROP POLICY IF EXISTS "uploads admin manage products" ON storage.objects;
CREATE POLICY "uploads admin manage products" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'uploads' AND public.is_admin())
WITH CHECK (bucket_id = 'uploads' AND public.is_admin());
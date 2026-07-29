-- Allow anyone to upload a grocery-list photo into the private uploads bucket
CREATE POLICY "Anyone can upload quick order photos"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'uploads' AND (storage.foldername(name))[1] = 'quick-orders');

-- Only admins can read files in the uploads bucket
CREATE POLICY "Admins can read uploads"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete uploads"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));
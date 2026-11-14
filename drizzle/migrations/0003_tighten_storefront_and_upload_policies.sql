DROP POLICY IF EXISTS "campaigns public read" ON public.campaigns;
CREATE POLICY "campaigns public read" ON public.campaigns FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "coupons public read" ON public.coupons;

DROP POLICY IF EXISTS "settings public read" ON public.store_settings;
CREATE POLICY "settings public read" ON public.store_settings FOR SELECT TO anon, authenticated USING (
  key = ANY (ARRAY[
    'hero_image', 'hero_mobile_image', 'announcement_enabled', 'announcement_text', 'menu_links',
    'delivery_fee', 'free_delivery_threshold', 'theme_primary', 'theme_background', 'theme_secondary',
    'footer_about', 'footer_delivery_note', 'footer_returns_note', 'footer_payment_note', 'footer_copyright',
    'social_facebook', 'social_instagram', 'social_youtube', 'contact_address', 'business_address',
    'contact_phone', 'business_phone'
  ]::text[])
);

DROP POLICY IF EXISTS "Anyone can upload quick order photos" ON storage.objects;
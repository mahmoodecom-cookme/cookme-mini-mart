CREATE TABLE public.promo_cards (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), image_url text NOT NULL, link_url text, sort_order integer NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.promo_cards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_cards TO authenticated;
GRANT ALL ON public.promo_cards TO service_role;
ALTER TABLE public.promo_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active promo cards public read" ON public.promo_cards FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Promo cards admin access" ON public.promo_cards FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE TRIGGER promo_cards_updated_at BEFORE UPDATE ON public.promo_cards FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
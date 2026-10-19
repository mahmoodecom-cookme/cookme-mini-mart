CREATE TABLE public.feature_cards (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text NOT NULL DEFAULT '', icon text NOT NULL DEFAULT 'truck', sort_order integer NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.feature_cards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feature_cards TO authenticated;
GRANT ALL ON public.feature_cards TO service_role;
ALTER TABLE public.feature_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active feature cards public read" ON public.feature_cards FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "Feature cards admin access" ON public.feature_cards FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER feature_cards_updated_at BEFORE UPDATE ON public.feature_cards FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
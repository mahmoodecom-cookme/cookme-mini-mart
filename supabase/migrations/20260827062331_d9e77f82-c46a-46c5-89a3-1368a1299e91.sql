GRANT SELECT ON public.banners, public.campaigns, public.categories, public.coupons, public.product_variants, public.products, public.store_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners, public.campaigns, public.categories, public.coupons, public.device_tokens, public.order_items, public.order_messages, public.orders, public.product_variants, public.products, public.store_settings, public.support_messages TO authenticated;
GRANT SELECT, INSERT ON public.page_visits TO authenticated;
GRANT INSERT ON public.page_visits TO anon;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.banners, public.campaigns, public.categories, public.coupons, public.device_tokens, public.order_items, public.order_messages, public.orders, public.page_visits, public.product_variants, public.products, public.store_settings, public.support_messages, public.user_roles TO service_role;

GRANT USAGE, SELECT ON SEQUENCE public.orders_order_number_seq TO service_role;

ALTER TABLE public.order_messages
  ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '';
ALTER TABLE public.order_messages
  ADD CONSTRAINT order_messages_address_length
  CHECK (char_length(address) BETWEEN 8 AND 500) NOT VALID;
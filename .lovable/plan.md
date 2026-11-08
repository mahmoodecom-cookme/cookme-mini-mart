# Promo Cards Carousel

## What will change
- Add a Home promo-card carousel immediately after search and before the existing benefit-card carousel. Keep the image-only card artwork, 5:8 shape, native swipe/scroll-snap behavior, desktop drag/arrows, keyboard support, loading and failure states, and reduced-motion behavior.
- Add an owner-managed Promo Cards area to the existing Promotions screen for upload, link editing, ordering, enable/disable, replacement, and confirmed deletion. Validate image type/size and show upload state and preview.
- Add a `promo_cards` table with public access limited to active rows and owner-only changes, plus five replaceable red offer placeholders.
- Keep card layout styles scoped to the Home page and use existing storage upload/auth patterns.

## Verification
- Test the admin CRUD and storefront refresh flow, then inspect the carousel at 360, 390, 768, 1024, 1280, and 1920px widths and check for console/build errors.

## Technical details
- Implement the table through the project migration tool with explicit public-schema grants and RLS policies.
- Fetch active cards ordered by `sort_order` in the existing storefront query; invalidate the shared storefront query after admin changes.
- Manage cards in a dedicated tab on the existing Promotions page, avoiding a new route.

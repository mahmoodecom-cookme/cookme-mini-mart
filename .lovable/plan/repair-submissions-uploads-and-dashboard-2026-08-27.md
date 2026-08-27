# Repair submissions, uploads, and dashboard

## Root cause found
The hosted backend is healthy, but every public table currently has no explicit Data API grants. That blocks both authenticated dashboard checks and server-side writes. In addition, `orders.order_number` is required but has no default generator, so checkout inserts fail even when the backend is reachable. Quick-order records also do not yet have a delivery-address column.

## Implementation
1. Apply one database migration that:
   - restores least-privilege grants for all existing tables according to their current access policies;
   - adds a safe generated order-number sequence/default;
   - adds required `address` storage to quick-order messages;
   - preserves all existing RLS policies and data.
2. Refactor server-function modules into thin TanStack Start wrappers so their validators, middleware, and helpers survive production server-function splitting.
3. Make checkout/order creation atomic enough to avoid orphaned orders if item saving fails, validate database errors explicitly, and keep confirmation data intact.
4. Update Quick Order to require Delivery Address after Mobile Number, upload images to the existing private bucket, and save the address with the same lead record.
5. Add the tappable Email Us card after Call Us on Help & Support without changing the rest of the layout.
6. Harden dashboard fetches to surface backend failures instead of silently returning empty data, while retaining its current real-data charts and tables.

## Verification
- Test public catalog → add product → cart → checkout → database order and items → confirmation.
- Test quick-order image upload, address submission, stored lead, and private uploaded object.
- Test authenticated dashboard load and real database metrics.
- Test Help email link resolves to `mailto:cookme024@gmail.com`.
- Check relevant server/browser logs and responsive rendering after changes.

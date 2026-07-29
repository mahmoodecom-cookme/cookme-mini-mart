# Cook Me Mart Online

Build a premium, professional e-commerce website for "Cook Me Mini Mart" — a grocery/mart store with a single physical branch that also sells online.

BRANDING

- Use the uploaded logo (the clean "Cook Me" text with chef hat icon, red and black colors, white/transparent background) across the entire site — header, footer, favicon, loading screens.

- Color theme: Red (#E31E24 or similar vibrant red from the logo) as primary, black as secondary, white/light gray backgrounds. Clean, modern, premium grocery-store aesthetic — not childish or cluttered.

- Typography: Modern, clean sans-serif fonts, easy to read on mobile.

GENERAL REQUIREMENTS

- This is an e-commerce site: full product catalog, cart, checkout — but NO online payment gateway, only Cash on Delivery / pay on dispatch.

- Mobile-first design is critical — 99% of traffic will be on mobile phones. Every page must look and function flawlessly on small screens: large tap targets, sticky bottom cart bar on mobile, fast-loading images, minimal scrolling to find key actions.

- Fully SEO optimized: proper meta titles/descriptions per page, semantic HTML, alt text on product images, clean URLs (e.g. /products/ketchup-250ml), fast page load, structured data (schema.org Product markup) for products.

- Design should be conversion-focused: clear CTAs, urgency elements (discount badges, "limited stock" tags), trust signals (delivery info, easy returns note, contact info visible), minimal friction checkout (guest checkout, no forced signup).

HOMEPAGE

- Top rotating banner carousel for promotions (e.g. "50% Off", "20% Off Today Only") — banners must be manageable from the dashboard (see Promotions section below).

- Category grid, bestsellers/featured products section, trust badges, easy access to categories.

PRODUCTS

- Support 100+ products across multiple categories.

- IMPORTANT: Many products come in multiple size/price variants (e.g. Ketchup available in Rs.50, Rs.100, Rs.250 packs; Lentils/Daal available in 500g and 1kg packs). Each product should have a single product page with a variant selector (dropdown or buttons) to choose size/pack — NOT separate duplicate product listings for each size. Each variant has its own price and stock count.

- Product detail page: multiple images, description, price, variant selector, quantity selector, "Add to Cart" button, related products.

CART & CHECKOUT

- Simple, fast, mobile-optimized cart and checkout flow.

- Checkout form: Name, Phone Number, Delivery Address, optional order notes.

- No online payment — Cash on Delivery only.

- On order confirmation, show a popup/modal: "Thank you! Our team will contact you shortly to confirm your order."

- Save every order to the database with full details (items, variants, quantities, total, customer info, timestamp, status = "New").

ORDER MESSAGE / CHAT FEATURE

- Add a section on the website (name it something like "Send Us Your Order List" or "Quick Order") where a customer can either type a free-text list of items they want, OR upload/attach an image of their handwritten/typed list, and submit it.

- These submissions should be saved to the database and appear in a dedicated "Order Messages" section in the dashboard (separate from formal cart-based orders), so the owner can review and respond.

HELP & SUPPORT

- A Help & Support page on the website with a contact form (Name, Phone/Email, Message).

- Submissions from this form should land in the dashboard's Help & Support section as messages the owner can view and mark as resolved.

PUSH NOTIFICATIONS (Firebase Cloud Messaging)

- Integrate Firebase Cloud Messaging so that whenever a new order (cart checkout) OR a new Order Message submission is received, the dashboard automatically updates in real-time AND sends a push notification with sound to the owner's device — even if the website/browser is fully closed.

- On first dashboard visit, prompt the owner to "Allow Notifications."

- Here is my Firebase config:

const firebaseConfig = {

  apiKey: "AIzaSyAM-FEYrPEq9A8qawOcqUTAtKC7FbgTv6o",

  authDomain: "cook-me-e30cd.firebaseapp.com",

  projectId: "cook-me-e30cd",

  storageBucket: "cook-me-e30cd.firebasestorage.app",

  messagingSenderId: "183084705647",

  appId: "1:183084705647:web:11fddae4a47b473fdf2a9a",

  measurementId: "G-7LY284ERFH"

};

- VAPID key: BJR1QsQgxsI1-0wY0eG5tUHGUeD8eUK_xmmdbmagECkdW-Ro7Cvm82WHN0ItgbYS1Ixws0j3WGuve-su0dfuQrk

ADMIN DASHBOARD

Build a secure, password-protected admin dashboard (only the owner can access) with the following sections:

1. Overview — quick summary: today's orders, pending orders, revenue snapshot, recent activity.

2. System Analytics — traffic/visits, top-selling products, conversion trends over time.

3. Orders Management — full list of orders with: Revenue total, Total Orders count, Returned/Refunded orders, Dispatch status tracking (e.g. New → Confirmed → Dispatched → Delivered → Returned). Ability to update order status manually.

4. Promotions — manage Campaigns, Coupons, and Homepage Banners from the dashboard. This must be fully dynamic: when I delete a coupon/banner/campaign, it should be completely removed with no empty gaps or broken layout anywhere on the site or dashboard. When I add a new one, it should automatically appear in the correct position/order without needing any code changes.

5. Help & Support — inbox of messages submitted via the website's Help & Support form, with ability to mark as read/resolved.

6. Order Messages — a dedicated view for the free-text/image order submissions from the "Order Message" section on the website (see above), separate from formal checkout orders.

7. Product Management (full CRUD) — Add, edit, delete products with: name, description, category, multiple pricing variants (size/pack + price + stock for each), multiple images. 

   - Image upload tool must include a built-in CROP feature and an automatic BACKGROUND REMOVAL feature so product photos can get a clean white/transparent background directly during upload, without needing external software.

8. Settings — a section for Tax and Commission configuration, so I can directly set/edit tax percentages or commission values from the dashboard later myself, without needing to ask for new code. Keep this flexible (editable fields, not hardcoded), even though I won't fill exact values yet.

Make the whole site and dashboard feel like a polished, professional, trustworthy grocery e-commerce brand — similar in quality feel to apps like Daraz or Foodpanda but tailored for a single-branch mini mart.


1. Owner's phone is Android — please proceed with FCM + PWA setup ("Add to Home Screen") so background/closed-app push notifications work.

2. Background removal: Go with Option A — in-browser, free (@imgly/background-removal or similar), no external API key needed.

3. Admin login: Single owner account.
   Email: admin@example.com
   Password: admin123
   (I'll change this password after first login for security)

4. Currency: PKR (Rs.)
   Delivery: All over Karachi only.
   Free delivery on orders above Rs. 3,000 — but make this that I can edit later from the dashboard Settings, since it's not fully finalized yet and may change.

One more requirement: In the Product Management section of the dashboard, please add a BULK UPLOAD feature via Excel/CSV file. I have 100+ products with their variants and pricing already organized — I want to upload an Excel file and have all product data (name, category, description, variants, prices, stock, etc.) automatically populate into the system. Product images will still be added manually one by one afterward (with the crop + background removal tool), since images can't come from Excel.

Please also provide a downloadable Excel/CSV template with the correct column structure so I format my data correctly before uploading.

Go ahead and build the full site + dashboard now based on everything discussed.
1. I already have a Firebase project set up (the one we configured earlier for push notifications — project ID: cook-me-e30cd). Please use that, don't create a new one. I'll provide the Firebase Service Account JSON when we reach Phase 4.

2. Yes, please seed ~6 demo products so the storefront isn't empty — I'll replace them via bulk upload once ready.

3. Email/password only for now, please. Keep it simple — we can add Google sign-in later if needed.

Please proceed with Phase 1 onwards.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cookme-mini-mart.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/35ec7868-7178-463b-9fee-fb70580a350a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

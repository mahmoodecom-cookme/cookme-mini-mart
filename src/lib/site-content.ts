export type ContentField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "image";
  placeholder?: string;
};

export type ContentSection = {
  id: string;
  title: string;
  description: string;
  fields: ContentField[];
};

/** Every storefront-editable piece of text/image lives in store_settings under these keys. */
export const SITE_SECTIONS: ContentSection[] = [
  {
    id: "announcement",
    title: "Top header / announcement bar",
    description: "The thin strip shown above the storefront header.",
    fields: [
      { key: "announcement_text", label: "Announcement text", placeholder: "Free delivery above Rs. 3,000" },
      { key: "announcement_enabled", label: "Show announcement bar (yes / no)", placeholder: "yes" },
    ],
  },
  {
    id: "home",
    title: "Home page",
    description: "Headings and the quick-order call to action on the homepage.",
    fields: [
      { key: "home_categories_heading", label: "Categories heading", placeholder: "Shop by category" },
      { key: "home_featured_heading", label: "Featured products heading", placeholder: "Bestsellers & featured" },
      { key: "home_cta_heading", label: "Quick order heading", placeholder: "Have a handwritten list?" },
      { key: "home_cta_text", label: "Quick order text", type: "textarea" },
      { key: "home_cta_button", label: "Quick order button label", placeholder: "Send us your order list" },
    ],
  },
  {
    id: "about",
    title: "About / our story",
    description: "Shown on the Help & Support page.",
    fields: [
      { key: "about_heading", label: "Heading", placeholder: "Our story" },
      { key: "about_text", label: "Story text", type: "textarea" },
      { key: "about_image", label: "Image URL", type: "image" },
    ],
  },
  {
    id: "contact",
    title: "Contact page",
    description: "Address, phone and map used on Help & Support and in the footer.",
    fields: [
      { key: "contact_heading", label: "Heading", placeholder: "Visit or call us" },
      { key: "contact_address", label: "Shop address", type: "textarea" },
      { key: "contact_phone", label: "Phone number" },
      { key: "contact_whatsapp", label: "WhatsApp number" },
      { key: "contact_hours", label: "Opening hours", placeholder: "Daily 9 AM – 11 PM" },
      { key: "contact_map_embed", label: "Google Maps embed URL", type: "textarea" },
    ],
  },
  {
    id: "faq",
    title: "FAQs",
    description: "Up to five question/answer pairs shown on Help & Support.",
    fields: [
      { key: "faq_1_q", label: "Question 1" },
      { key: "faq_1_a", label: "Answer 1", type: "textarea" },
      { key: "faq_2_q", label: "Question 2" },
      { key: "faq_2_a", label: "Answer 2", type: "textarea" },
      { key: "faq_3_q", label: "Question 3" },
      { key: "faq_3_a", label: "Answer 3", type: "textarea" },
      { key: "faq_4_q", label: "Question 4" },
      { key: "faq_4_a", label: "Answer 4", type: "textarea" },
      { key: "faq_5_q", label: "Question 5" },
      { key: "faq_5_a", label: "Answer 5", type: "textarea" },
    ],
  },
  {
    id: "footer",
    title: "Footer",
    description: "Footer blurb, service promises and social links.",
    fields: [
      { key: "footer_about", label: "Footer blurb", type: "textarea" },
      { key: "footer_delivery_note", label: "Delivery note", placeholder: "Delivery: all over Karachi" },
      { key: "footer_returns_note", label: "Returns note", placeholder: "Easy returns on damaged items" },
      { key: "footer_payment_note", label: "Payment note", placeholder: "Cash on delivery only" },
      { key: "footer_copyright", label: "Copyright line" },
    ],
  },
  {
    id: "menu",
    title: "Menu builder",
    description: "Storefront navigation links. One per line as: Label | /path",
    fields: [{ key: "menu_links", label: "Header menu links", type: "textarea", placeholder: "Home | /\nProducts | /products" }],
  },
  {
    id: "notfound",
    title: "404 page",
    description: "Shown when a visitor opens a page that does not exist.",
    fields: [
      { key: "notfound_heading", label: "Heading", placeholder: "Page not found" },
      { key: "notfound_text", label: "Message", type: "textarea" },
      { key: "notfound_button", label: "Button label", placeholder: "Go home" },
    ],
  },
  {
    id: "pages",
    title: "Custom pages",
    description: "Extra static pages (title and body). Linked from the footer.",
    fields: [
      { key: "page_1_title", label: "Page 1 title" },
      { key: "page_1_body", label: "Page 1 content", type: "textarea" },
      { key: "page_2_title", label: "Page 2 title" },
      { key: "page_2_body", label: "Page 2 content", type: "textarea" },
    ],
  },
  {
    id: "seo",
    title: "SEO information",
    description: "Default and per-page meta information.",
    fields: [
      { key: "seo_title", label: "Default meta title" },
      { key: "seo_description", label: "Default meta description", type: "textarea" },
      { key: "seo_keywords", label: "Keywords (comma separated)" },
      { key: "seo_og_image", label: "Default OG image URL", type: "image" },
      { key: "seo_home_title", label: "Home page meta title" },
      { key: "seo_home_description", label: "Home page meta description", type: "textarea" },
      { key: "seo_products_title", label: "Products page meta title" },
      { key: "seo_products_description", label: "Products page meta description", type: "textarea" },
    ],
  },
];

export const ACCOUNT_SECTIONS: ContentSection[] = [
  {
    id: "business",
    title: "Store information",
    description: "Business identity used across the store and invoices.",
    fields: [
      { key: "business_name", label: "Business name" },
      { key: "business_address", label: "Business address", type: "textarea" },
      { key: "business_phone", label: "Contact phone" },
      { key: "business_whatsapp", label: "WhatsApp number" },
      { key: "business_email", label: "Business email" },
    ],
  },
  {
    id: "social",
    title: "Social links",
    description: "Shown in the storefront footer.",
    fields: [
      { key: "social_facebook", label: "Facebook URL" },
      { key: "social_instagram", label: "Instagram URL" },
      { key: "social_tiktok", label: "TikTok URL" },
      { key: "social_youtube", label: "YouTube URL" },
    ],
  },
  {
    id: "ops",
    title: "Operations",
    description: "Delivery, currency and notification preferences.",
    fields: [
      { key: "delivery_fee", label: "Delivery fee (PKR)" },
      { key: "free_delivery_threshold", label: "Free delivery above (PKR)" },
      { key: "currency", label: "Currency code", placeholder: "PKR" },
      { key: "timezone", label: "Timezone", placeholder: "Asia/Karachi" },
      { key: "notify_email", label: "Send new-order alerts to email" },
    ],
  },
];

export const ALL_CONTENT_KEYS = [...SITE_SECTIONS, ...ACCOUNT_SECTIONS].flatMap((s) => s.fields.map((f) => f.key));

import type { ComponentType } from 'react';
import { Coffee } from 'lucide-react';

/* Icons drawn to match the supplied "Shop by category" reference image
   (solid wheat, outline drop, solid chili, solid bean cluster, outline cupcake). */
const base = { viewBox: '0 0 24 24', 'aria-hidden': true } as const;

function WheatIcon() {
  return (
    <svg {...base} fill="currentColor" stroke="none">
      <path d="M11.2 22v-9.3h1.6V22z" />
      <path d="M12 1.6c1.9 1.7 2.6 3.7 1.9 5.9-.3 1-.9 1.8-1.9 2.5-1-.7-1.6-1.5-1.9-2.5-.7-2.2 0-4.2 1.9-5.9zm0 2.9c-.6.9-.7 1.8-.3 2.8.1.3.2.5.3.7.1-.2.2-.4.3-.7.4-1 .3-1.9-.3-2.8z" />
      <path d="M10.6 11.6c-2.9.4-4.7-1-5.3-3.9 2.9-.4 4.7 1 5.3 3.9zm-3.2-2.3c.5.9 1.3 1.4 2.3 1.5-.5-.9-1.3-1.4-2.3-1.5z" />
      <path d="M13.4 11.6c.6-2.9 2.4-4.3 5.3-3.9-.6 2.9-2.4 4.3-5.3 3.9zm.9-1c1 0 1.8-.6 2.3-1.5-1 .1-1.8.6-2.3 1.5z" />
      <path d="M10.6 17c-2.9.4-4.7-1-5.3-3.9 2.9-.4 4.7 1 5.3 3.9zm-3.2-2.3c.5.9 1.3 1.4 2.3 1.5-.5-.9-1.3-1.4-2.3-1.5z" />
      <path d="M13.4 17c.6-2.9 2.4-4.3 5.3-3.9-.6 2.9-2.4 4.3-5.3 3.9zm.9-1c1 0 1.8-.6 2.3-1.5-1 .1-1.8.6-2.3 1.5z" />
    </svg>
  );
}

function DropIcon() {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.8c3.4 4.1 6 7.2 6 10.6a6 6 0 0 1-12 0c0-3.4 2.6-6.5 6-10.6z" />
      <path d="M9 14.2a3 3 0 0 0 2.2 2.6" />
    </svg>
  );
}

function ChiliIcon() {
  return (
    <svg {...base} fill="currentColor" stroke="none">
      <path d="M14.6 2.2c.9-.3 1.8.1 2.1.9.2.6 0 1.2-.5 1.6 1.7.9 2.9 2.6 3 4.7.2 4.6-3.7 10.4-10.2 11.6-3.3.6-5.5.1-6.4-.9-.7-.8-.5-1.5.4-1.7 4.2-.9 6.6-3 8-6.3.7-1.6.8-2.9 1.4-4.2.2-.5.5-.9.9-1.2-.4-.6-.3-1.4.3-1.9.4-.3.9-.4 1.4-.3z" />
      <path d="M15.2 4.6c-.8.3-1.5 1-1.8 1.9" stroke="#fff" strokeWidth="1" strokeLinecap="round" fill="none" opacity=".0" />
    </svg>
  );
}

function BeanClusterIcon() {
  return (
    <svg {...base} fill="currentColor" stroke="none">
      <ellipse cx="8" cy="7.6" rx="3.6" ry="4.4" transform="rotate(-18 8 7.6)" />
      <ellipse cx="16.4" cy="9" rx="3.6" ry="4.4" transform="rotate(22 16.4 9)" />
      <ellipse cx="8.6" cy="16.8" rx="3.6" ry="4.4" transform="rotate(18 8.6 16.8)" />
      <ellipse cx="16" cy="17.2" rx="3.6" ry="4.4" transform="rotate(-20 16 17.2)" />
    </svg>
  );
}

function CupcakeIcon() {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.2 11.2C6.2 8 8.6 5.6 12 5.6s5.8 2.4 5.8 5.6" />
      <path d="M12 5.6c-.9-.9-.9-2.2 0-3 .9.8.9 2.1 0 3z" />
      <path d="M4.6 11.2h14.8v2.2H4.6z" />
      <path d="M5.8 13.4l1.3 7.2h9.8l1.3-7.2" />
      <path d="M9.4 13.8l.5 6.4M14.6 13.8l-.5 6.4M12 13.8v6.4" />
    </svg>
  );
}

export const categoryIcons: Record<string, ComponentType> = {
  'rice-grains': WheatIcon,
  'cooking-oil': DropIcon,
  spices: ChiliIcon,
  'pulses-daal': BeanClusterIcon,
  'sugar-baking': CupcakeIcon,
  'tea-beverages': Coffee,
};

export function categoryIcon(slug: string): ComponentType {
  return categoryIcons[slug] ?? WheatIcon;
}

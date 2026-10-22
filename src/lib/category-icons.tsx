import type { ComponentType } from 'react';
import { Wheat, Droplet, Coffee } from 'lucide-react';

/* Line icons drawn to match the supplied category card reference (stroke style matches lucide). */
function ChiliIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.5 6.5c-.4-1.5.2-3 1.8-3.6" />
      <path d="M9.8 5.2c2.8-1.6 6.6.2 7.6 4 .9 3.7-.8 8.6-4.6 11.3-2.4 1.7-5.5 2-7.3.4-1.6-1.5-1.2-4.2.6-6.6 1.3-1.8 2.8-3.4 3.7-9.1z" fill="currentColor" stroke="none" opacity=".14" />
      <path d="M9.8 5.2c2.8-1.6 6.6.2 7.6 4 .9 3.7-.8 8.6-4.6 11.3-2.4 1.7-5.5 2-7.3.4-1.6-1.5-1.2-4.2.6-6.6 1.3-1.8 2.8-3.4 3.7-9.1z" />
    </svg>
  );
}

function BeanClusterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="8.6" cy="8.4" rx="3.4" ry="4.2" transform="rotate(-30 8.6 8.4)" />
      <ellipse cx="16.4" cy="9.4" rx="3.4" ry="4.2" transform="rotate(28 16.4 9.4)" />
      <ellipse cx="8.8" cy="16.4" rx="3.4" ry="4.2" transform="rotate(24 8.8 16.4)" />
      <ellipse cx="15.9" cy="15.7" rx="3.4" ry="4.2" transform="rotate(-26 15.9 15.7)" />
    </svg>
  );
}

function CupcakeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 11.5a5 5 0 0 1 10 0" />
      <path d="M4.5 11.5h15a1.5 1.5 0 0 1 0 3h-15a1.5 1.5 0 0 1 0-3z" />
      <path d="M6 14.5l1 6h10l1-6" />
      <path d="M12 6.5v-2" />
      <circle cx="12" cy="4" r="1.4" />
    </svg>
  );
}

export const categoryIcons: Record<string, ComponentType> = {
  'rice-grains': Wheat,
  'cooking-oil': Droplet,
  spices: ChiliIcon,
  'pulses-daal': BeanClusterIcon,
  'sugar-baking': CupcakeIcon,
  'tea-beverages': Coffee,
};

export function categoryIcon(slug: string): ComponentType {
  return categoryIcons[slug] ?? Wheat;
}

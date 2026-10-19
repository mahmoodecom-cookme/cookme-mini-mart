import { Truck, RotateCcw, ShieldCheck, PackageCheck, ShoppingBasket, ClipboardList } from 'lucide-react';

export const featureIcons = { truck: Truck, 'rotate-ccw': RotateCcw, 'shield-check': ShieldCheck, 'package-check': PackageCheck, 'shopping-basket': ShoppingBasket, 'clipboard-list': ClipboardList };
export type FeatureCard = { id: string; title: string; description: string; icon: string; sort_order: number; is_active: boolean };
export function featureIcon(key: string) { return featureIcons[key as keyof typeof featureIcons] ?? Truck; }
export function activeFeatures(cards: FeatureCard[]) {
  return [...new Map(cards.filter(c => c.is_active).map(c => [c.id, c])).values()].sort((a,b) => a.sort_order-b.sort_order || a.id.localeCompare(b.id));
}
export function isCircular(cards: FeatureCard[]) { return activeFeatures(cards).length >= 6; }
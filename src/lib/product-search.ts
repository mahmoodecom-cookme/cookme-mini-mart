export type SearchableProduct = { name: string; description?: string | null; category_id?: string | null; categories?: { name?: string | null } | null };
export function matchesProduct(product: SearchableProduct, query: string, category: string) {
  const q = query.trim().toLowerCase();
  return (category === 'all' || product.category_id === category) && (!q || [product.name, product.description, product.categories?.name].some(value => value?.toLowerCase().includes(q)));
}
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-middleware';

export const getAdminFeatures = createServerFn({ method: 'GET' }).middleware([requireAdmin]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from('feature_cards').select('*').order('sort_order').order('id');
  if (error) throw new Error('Could not load feature cards.');
  return data ?? [];
});
export const saveFeature = createServerFn({ method: 'POST' }).middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid().optional(), title: z.string().trim().min(1).max(100), description: z.string().trim().max(300), icon: z.enum(['truck','rotate-ccw','shield-check','package-check','shopping-basket','clipboard-list']), sort_order: z.number().int().min(0), is_active: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { id, ...row } = data;
    const result = id ? await context.supabase.from('feature_cards').update(row).eq('id',id) : await context.supabase.from('feature_cards').insert(row);
    if (result.error) throw new Error('Could not save feature card.');
    return { ok: true };
  });
export const deleteFeature = createServerFn({ method: 'POST' }).middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({id:z.string().uuid()}).parse(input))
  .handler(async ({data,context}) => {
    const {error} = await context.supabase.from('feature_cards').delete().eq('id',data.id);
    if(error) throw new Error('Could not delete feature card.');
    return {ok:true};
  });
export const reorderFeatures = createServerFn({ method: 'POST' }).middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ids:z.array(z.string().uuid()).max(200)}).parse(input))
  .handler(async ({data,context}) => {
    for (const [sort_order,id] of data.ids.entries()) {
      const {error} = await context.supabase.from('feature_cards').update({sort_order}).eq('id',id);
      if(error) throw new Error('Could not reorder feature cards.');
    }
    return {ok:true};
  });
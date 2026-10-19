import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useRouter } from '@tanstack/react-router';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { featureIcons, featureIcon, type FeatureCard } from '@/lib/feature-cards';
import { getAdminFeatures, saveFeature, deleteFeature, reorderFeatures } from '@/lib/feature-cards.functions';

type Draft = Omit<FeatureCard, 'id' | 'icon'> & { id?: string; icon: keyof typeof featureIcons };
export function FeatureCardsEditor() {
  const qc = useQueryClient(), router = useRouter();
  const read = useServerFn(getAdminFeatures), write = useServerFn(saveFeature), remove = useServerFn(deleteFeature), reorder = useServerFn(reorderFeatures);
  const { data: cards = [], isPending, error } = useQuery({queryKey:['admin','features'],queryFn:()=>read()});
  const [draft,setDraft] = useState<Draft | null>(null);
  const refresh = async () => { await Promise.all([qc.invalidateQueries({queryKey:['admin','features']}),qc.invalidateQueries({queryKey:['storefront']})]); await router.invalidate(); };
  const action = useMutation({mutationFn: async (task: {kind:'save';card:Draft} | {kind:'delete';id:string} | {kind:'reorder';ids:string[]}) => {
    if(task.kind==='save') return write({data:task.card});
    if(task.kind==='delete') return remove({data:{id:task.id}});
    return reorder({data:{ids:task.ids}});
  },onSuccess:async()=>{setDraft(null);await refresh();toast.success('Feature cards updated');},onError:()=>toast.error('Could not update feature cards')});
  const move = (index:number,delta:number) => {const ids=cards.map(c=>c.id);const other=index+delta;if(other<0||other>=ids.length)return;[ids[index],ids[other]]=[ids[other],ids[index]];action.mutate({kind:'reorder',ids});};
  if(isPending)return <p>Loading feature cards…</p>;
  if(error)return <p role="alert">Could not load feature cards.</p>;
  return <div className="space-y-3">
    {cards.filter(c=>c.is_active).length<6 && <p className="text-sm text-muted-foreground">Add at least 6 active cards for the circular carousel</p>}
    <Button size="sm" onClick={()=>setDraft({title:'',description:'',icon:'truck',sort_order:cards.length ? Math.max(...cards.map(c=>c.sort_order))+1 : 0,is_active:true})}><Plus className="mr-2 h-4 w-4"/>Add feature card</Button>
    {cards.map((card,index)=>{const Icon=featureIcon(card.icon);return <div key={card.id} className="flex flex-wrap items-center gap-3 border-b py-3">
      <Icon className="h-5 w-5 shrink-0 text-primary"/><div className="min-w-0 flex-1"><strong className="block text-sm">{card.title}</strong><p className="text-xs text-muted-foreground">{card.description}</p></div>
      <Switch aria-label={`Active: ${card.title}`} checked={card.is_active} disabled={action.isPending} onCheckedChange={v=>action.mutate({kind:'save',card:{...card,icon:card.icon as Draft['icon'],is_active:v}})}/>
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" title="Move up" aria-label={`Move up: ${card.title}`} disabled={index===0||action.isPending} onClick={()=>move(index,-1)}><ArrowUp className="h-4 w-4"/></Button>
        <Button size="icon" variant="ghost" title="Move down" aria-label={`Move down: ${card.title}`} disabled={index===cards.length-1||action.isPending} onClick={()=>move(index,1)}><ArrowDown className="h-4 w-4"/></Button>
        <Button size="icon" variant="ghost" title="Edit" aria-label={`Edit: ${card.title}`} onClick={()=>setDraft({...card,icon:card.icon as Draft['icon']})}><Pencil className="h-4 w-4"/></Button>
        <Button size="icon" variant="ghost" title="Delete" aria-label={`Delete: ${card.title}`} disabled={action.isPending} onClick={()=>{if(window.confirm(`Delete ${card.title}?`))action.mutate({kind:'delete',id:card.id});}}><Trash2 className="h-4 w-4"/></Button>
      </div>
    </div>;})}
    <Dialog open={!!draft} onOpenChange={open=>{if(!open)setDraft(null);}}><DialogContent><DialogHeader><DialogTitle>{draft?.id?'Edit feature card':'Add feature card'}</DialogTitle></DialogHeader>
      {draft && <form className="space-y-4" onSubmit={e=>{e.preventDefault();action.mutate({kind:'save',card:draft});}}>
        <div className="space-y-1"><Label htmlFor="feature-title">Title</Label><Input id="feature-title" required maxLength={100} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></div>
        <div className="space-y-1"><Label htmlFor="feature-description">Description</Label><Textarea id="feature-description" maxLength={300} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></div>
        <div className="space-y-1"><Label>Icon</Label><Select value={draft.icon} onValueChange={icon=>setDraft({...draft,icon:icon as Draft['icon']})}><SelectTrigger aria-label="Feature icon"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(featureIcons).map(([key,Icon])=><SelectItem key={key} value={key}><span className="flex items-center gap-2"><Icon className="h-4 w-4"/>{key}</span></SelectItem>)}</SelectContent></Select></div>
        <div className="flex items-center gap-2"><Switch id="feature-active" checked={draft.is_active} onCheckedChange={is_active=>setDraft({...draft,is_active})}/><Label htmlFor="feature-active">Active</Label></div>
        <Button type="submit" disabled={action.isPending}>Save feature card</Button>
      </form>}
    </DialogContent></Dialog>
  </div>;
}